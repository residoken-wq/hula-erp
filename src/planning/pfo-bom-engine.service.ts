import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionFulfillmentOrder } from './pfo.entity';
import { PfoMaterialRequirement, SupplyMethod } from './pfo-material-requirement.entity';
import { Product } from '../products/product.entity';
import { BOM } from '../bom/bom.entity';
import { ProductComponent } from '../products/product-component.entity';
import { Material } from '../materials/material.entity';

@Injectable()
export class PfoBomEngineService {
    constructor(
        @InjectRepository(ProductionFulfillmentOrder) private pfoRepo: Repository<ProductionFulfillmentOrder>,
        @InjectRepository(PfoMaterialRequirement) private materialReqRepo: Repository<PfoMaterialRequirement>,
        @InjectRepository(Product) private productRepo: Repository<Product>,
        @InjectRepository(BOM) private bomRepo: Repository<BOM>,
        @InjectRepository(ProductComponent) private componentRepo: Repository<ProductComponent>,
        @InjectRepository(Material) private materialRepo: Repository<Material>,
    ) { }

    /**
     * Gate 2: BOM Explosion & Material Requirement Calculation
     * Dựa vào SO Items liên kết với PFO, bóc tách định mức vật tư trực tiếp từ Product BOMs & Combos.
     */
    async calculateMaterialRequirements(pfoId: number) {
        const pfo = await this.pfoRepo.findOne({
            where: { id: pfoId },
            relations: [
                'sales_order',
                'sales_order.items',
                'sales_order.items.product',
                'material_requirements'
            ]
        });

        if (!pfo) throw new NotFoundException('Lệnh sản xuất (PFO) không tồn tại');

        const materialMap = new Map<number, { qty: number; material?: Material }>();

        if (pfo.sales_order && pfo.sales_order.items) {
            for (const item of pfo.sales_order.items) {
                const orderQty = Number(item.quantity) || 0;
                if (orderQty <= 0) continue;

                // Lấy product từ relation hoặc query theo sku
                let product = item.product;
                if (!product && item.sku) {
                    product = await this.productRepo.findOne({ where: { sku: item.sku } });
                }

                if (!product) continue;

                // Queue nổ BOM (hỗ trợ đệ quy Combo)
                const queue: { productId: number; multiplier: number }[] = [
                    { productId: product.id, multiplier: orderQty }
                ];

                let safetyCounter = 0;
                while (queue.length > 0 && safetyCounter++ < 500) {
                    const current = queue.shift();
                    if (!current) break;

                    const targetProd = await this.productRepo.findOne({ where: { id: current.productId } });
                    if (!targetProd) continue;

                    // 1. Kiểm tra nếu là COMBO -> Nổ ra các sản phẩm con
                    if (targetProd.product_type === 'COMBO') {
                        const components = await this.componentRepo.find({
                            where: { parent_product: { id: targetProd.id } },
                            relations: ['child_product']
                        });

                        for (const comp of components) {
                            if (comp.child_product) {
                                queue.push({
                                    productId: comp.child_product.id,
                                    multiplier: current.multiplier * (Number(comp.quantity) || 1)
                                });
                            }
                        }
                    } else {
                        // 2. Nếu là STANDARD -> Lấy định mức vật tư BOM
                        const boms = await this.bomRepo.find({
                            where: { product_id: targetProd.id },
                            relations: ['material']
                        });

                        for (const bom of boms) {
                            if (!bom.material_id) continue;
                            
                            const rawQty = current.multiplier * Number(bom.quantity || 0);
                            const waste = Number(bom.waste_percent || 0);
                            const totalReqQty = rawQty * (1 + waste / 100);

                            const existing = materialMap.get(bom.material_id);
                            if (existing) {
                                existing.qty += totalReqQty;
                            } else {
                                materialMap.set(bom.material_id, {
                                    qty: totalReqQty,
                                    material: bom.material
                                });
                            }
                        }
                    }
                }
            }
        }

        // Xóa các yêu cầu vật tư cũ của PFO này
        if (pfo.material_requirements && pfo.material_requirements.length > 0) {
            await this.materialReqRepo.remove(pfo.material_requirements);
        }

        // Tạo danh sách PfoMaterialRequirement mới
        const requirements: PfoMaterialRequirement[] = [];
        for (const [materialId, data] of materialMap.entries()) {
            let mat = data.material;
            if (!mat) {
                mat = await this.materialRepo.findOne({ where: { id: materialId } });
            }

            const req = this.materialReqRepo.create({
                pfo_id: pfoId,
                material_id: materialId,
                material_code: mat?.code || `MAT-${materialId}`,
                material_name: mat?.name || 'Vật tư',
                supply_method: SupplyMethod.HULA_SUPPLIED,
                planned_quantity: Math.round(data.qty * 100) / 100, // Bo tròn 2 chữ số thập phân
                actual_order_quantity: Math.round(data.qty * 100) / 100,
                unit_price: Number(mat?.cost_price || mat?.cost_per_unit || 0),
                issued_quantity: 0
            });
            requirements.push(req);
        }

        if (requirements.length > 0) {
            await this.materialReqRepo.save(requirements);
        }

        return {
            message: `Đã nổ BOM thành công cho Lệnh SX #${pfo.code}`,
            total_materials: requirements.length,
            requirements
        };
    }
}
