import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionFulfillmentOrder, PfoStatus } from './pfo.entity';
import { PfoMaterialRequirement, SupplyMethod } from './pfo-material-requirement.entity';
import { ProductsService } from '../products/products.service';
import { MaterialsService } from '../materials/materials.service';

@Injectable()
export class PfoBomEngineService {
    constructor(
        @InjectRepository(ProductionFulfillmentOrder) private pfoRepo: Repository<ProductionFulfillmentOrder>,
        @InjectRepository(PfoMaterialRequirement) private materialReqRepo: Repository<PfoMaterialRequirement>,
        private productsService: ProductsService,
        private materialsService: MaterialsService,
    ) { }

    /**
     * Gate 2: BOM Explosion & Material Requirement Calculation
     * Dựa vào SO Items liên kết với PFO, bóc tách định mức vật tư và lưu vào bảng PfoMaterialRequirement.
     */
    async calculateMaterialRequirements(pfoId: number) {
        const pfo = await this.pfoRepo.findOne({
            where: { id: pfoId },
            relations: [
                'sales_order',
                'sales_order.items',
                'material_requirements'
            ]
        });

        if (!pfo) throw new NotFoundException('PFO không tồn tại');

        const productDemand = new Map<string, number>();

        // 1. Lấy nhu cầu số lượng từ Sales Order Items
        if (pfo.sales_order && pfo.sales_order.items) {
            for (const item of pfo.sales_order.items) {
                // Tùy chọn: Xử lý booking, nếu đã có tồn thì trừ ra. Hiện tại giữ nguyên số lượng.
                const qty = Number(item.quantity) || 0;
                if (qty > 0) {
                    productDemand.set(item.sku, (productDemand.get(item.sku) || 0) + qty);
                }
            }
        }

        const materialDemand = new Map<number, number>();

        // 2. BOM Explosion (Xử lý cả Combo và Standard)
        const processingQueue = [];
        for (const [sku, qty] of productDemand.entries()) {
            processingQueue.push({ sku, qty });
        }

        const totalProductDemand = new Map<string, number>();
        let safetyCounter = 0;
        const MAX_ITERATIONS = 20000;

        while (processingQueue.length > 0) {
            if (safetyCounter++ > MAX_ITERATIONS) {
                console.warn('BOM Explosion Loop Limit Reached - Possible Cycle in Product Components');
                break;
            }

            const { sku, qty } = processingQueue.shift();
            if (qty <= 0) continue;

            totalProductDemand.set(sku, (totalProductDemand.get(sku) || 0) + qty);

            // Nếu là Combo, phân rã tiếp
            const components = await this.productsService.getComboComponents(sku);
            if (components && components.length > 0) {
                for (const comp of components) {
                    if (comp.child_product) {
                        processingQueue.push({ sku: comp.child_product.sku, qty: qty * Number(comp.quantity) });
                    }
                }
            }
        }

        // 3. Tính nhu cầu nguyên vật liệu từ BOM
        for (const [sku, qty] of totalProductDemand.entries()) {
            const boms = await this.productsService.getBomByProductSku(sku);
            for (const bom of boms) {
                if (bom.material_id) {
                    const rawReq = qty * Number(bom.quantity);
                    const wastage = Number(bom.waste_percent) || 0;
                    const req = rawReq * (1 + wastage / 100);

                    materialDemand.set(bom.material_id, (materialDemand.get(bom.material_id) || 0) + req);
                }
            }
        }

        // 4. Xóa yêu cầu cũ nếu tính lại
        if (pfo.material_requirements && pfo.material_requirements.length > 0) {
            await this.materialReqRepo.remove(pfo.material_requirements);
        }

        // 5. Lưu vào bảng PfoMaterialRequirement
        const requirements: PfoMaterialRequirement[] = [];
        for (const [matId, qty] of materialDemand.entries()) {
            const mat = await this.materialsService.materialRepo.findOne({ where: { id: matId } });
            
            const req = this.materialReqRepo.create({
                pfo_id: pfoId,
                material_id: matId,
                material_code: mat?.code || '',
                material_name: mat?.name || 'Unknown',
                supply_method: SupplyMethod.HULA_SUPPLIED, // Mặc định HULA cấp phát, có thể sửa trên UI
                planned_quantity: qty,
                unit_price: mat?.base_price || 0
            });
            requirements.push(req);
        }

        if (requirements.length > 0) {
            await this.materialReqRepo.save(requirements);
        }

        return {
            message: 'Đã tính toán xong nhu cầu vật tư',
            total_materials: requirements.length
        };
    }
}
