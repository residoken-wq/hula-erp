import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder, POType } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { GoodsReceipt } from './entities/goods-receipt.entity';
import { InventoryService } from '../inventory/inventory.service';
import { ProductsService } from '../products/products.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { PlanningService } from '../planning/planning.service'; // --- MỚI ---
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PurchasingService {
    constructor(
        @InjectRepository(PurchaseOrder) private poRepo: Repository<PurchaseOrder>,
        @InjectRepository(PurchaseOrderItem) private poItemRepo: Repository<PurchaseOrderItem>,
        @InjectRepository(GoodsReceipt) private grRepo: Repository<GoodsReceipt>,
        private inventoryService: InventoryService,
        private productsService: ProductsService,
        private suppliersService: SuppliersService,
        private planningService: PlanningService, // --- MỚI: Inject PlanningService ---
    ) { }

    async createPO(data: any) {
        const po = this.poRepo.create({
            po_code: data.po_code,
            uuid: uuidv4(),
            supplier_id: data.supplier_id,
            note: data.note,
            status: 'DRAFT' as any,
            total_amount: 0,
            paid_amount: 0
        });

        let total = 0;
        po.items = [];
        if (data.items) {
            for (const i of data.items) {
                const item = new PurchaseOrderItem();
                item.material_id = i.material_id;
                item.product_id = i.product_id;
                item.description = i.description || '';
                item.quantity = Number(i.quantity);
                item.unit_price = Number(i.unit_price);
                item.subtotal = item.quantity * item.unit_price;
                total += item.subtotal;
                po.items.push(item);
            }
        }
        po.total_amount = total;
        return this.poRepo.save(po);
    }

    async getAllPOs() {
        return this.poRepo.find({ relations: ['supplier', 'items'], order: { created_at: 'DESC' } });
    }

    async getPODetail(id: number) {
        return this.poRepo.findOne({ where: { id }, relations: ['supplier', 'items', 'items.material', 'items.product'] });
    }

    async updatePO(id: number, data: any) {
        const po = await this.poRepo.findOne({ where: { id } });
        if (!po) throw new NotFoundException();

        if (data.outsourcing_delivery_info) {
            po.outsourcing_delivery_info = data.outsourcing_delivery_info;
        }

        if (data.status) po.status = data.status;

        return this.poRepo.save(po);
    }

    async updatePayment(poCode: string, amount: number) {
        const po = await this.poRepo.findOne({ where: { po_code: poCode } });
        if (po) {
            po.paid_amount = Number(po.paid_amount || 0) + Number(amount);
            await this.poRepo.save(po);
        }
    }

    // --- TÍNH TOÁN NPL CẦN THIẾT CHO ĐƠN GIA CÔNG ---
    async getOutsourcingMaterials(poId: number) {
        const po = await this.poRepo.findOne({ where: { id: poId }, relations: ['items', 'items.product'] });
        if (!po || po.type !== POType.OUTSOURCING) return [];

        const materialNeeds = new Map<number, any>();

        for (const item of po.items) {
            if (item.product_id && item.product?.sku) {
                const boms = await this.productsService.getBomByProductSku(item.product.sku);
                for (const bom of boms) {
                    if (bom.material) {
                        const matId = bom.material.id;
                        const needQty = Number(bom.quantity) * Number(item.quantity) * (1 + Number(bom.waste_percent) / 100);

                        if (materialNeeds.has(matId)) {
                            const exist = materialNeeds.get(matId);
                            exist.quantity += needQty;
                        } else {
                            materialNeeds.set(matId, {
                                material_id: matId,
                                code: bom.material.code, // FIX: Chỉ dùng code, bỏ sku
                                name: bom.material.name,
                                unit: bom.material.unit,
                                quantity: needQty,
                                stock: Number(bom.material.quantity_in_stock || 0),
                                // image: bom.material.image_url // FIX: Bỏ image_url vì không tồn tại trong Material entity
                            });
                        }
                    }
                }
            }
        }
        return Array.from(materialNeeds.values());
    }
    // ------------------------------------------------------

    async remove(id: number) {
        return this.poRepo.delete(id);
    }

    async createGoodsReceipt(poId: number, data: any) {
        const po = await this.poRepo.findOne({ where: { id: poId }, relations: ['items'] });
        if (!po) throw new NotFoundException('PO not found');

        const gr = this.grRepo.create({
            code: data.code, purchase_order: po, received_date: data.date, note: data.note
        });
        await this.grRepo.save(gr);

        for (const item of data.items) {
            const poItem = po.items.find(pi => pi.id === item.po_item_id);
            if (!poItem) continue;
            if (poItem.material_id) {
                await this.inventoryService.adjustStock('IMPORT', 'MATERIAL', poItem.material_id, Number(item.quantity), data.code, 'Nhập từ PO ' + po.po_code, 'KHO_NPL');
            } else if (poItem.product_id) {
                await this.inventoryService.adjustStock('IMPORT', 'PRODUCT', poItem.product_id, Number(item.quantity), data.code, 'Nhập từ PO ' + po.po_code, 'KHO_TP');
            }
        }
        po.status = 'COMPLETED' as any;
        return this.poRepo.save(po);
    }

    async getByUuid(uuid: string) { return this.poRepo.findOne({ where: { uuid }, relations: ['supplier', 'items'] }); }
    async supplierAction(uuid: string, action: string, note?: string) { return null; }

    // --- MỚI: TỔNG HỢP NHU CẦU MUA HÀNG (PO GỘP) ---
    async getPendingRequirements() {
        // 1. Load tất cả Plan đang ở trạng thái CALCULATED
        const plans = await this.planningService.findAll();
        const calcPlans = plans.filter(p => p.status === 'CALCULATED');

        // 2. Load tất cả Item đã đặt hàng (Active)
        const allPoItems = await this.poItemRepo.find({ relations: ['purchase_order'] });
        const activePoItems = allPoItems.filter(i => i.purchase_order && i.purchase_order.status !== 'CANCELLED');

        const orderedQtyMap = new Map<string, number>(); // key: planId_type_idOrRef

        for (const item of activePoItems) {
            if (item.plan_id) { // Chỉ quan tâm item có link đến Plan
                // Nếu là Material
                if (item.material_id) {
                    const key = `${item.plan_id}_MAT_${item.material_id}`;
                    orderedQtyMap.set(key, (orderedQtyMap.get(key) || 0) + Number(item.quantity));
                } else {
                    // Nếu là Outsourcing (Dựa vào Description match)
                    // Format: "StepName (SKU)"
                    const key = `${item.plan_id}_OUT_${item.description}`;
                    orderedQtyMap.set(key, (orderedQtyMap.get(key) || 0) + Number(item.quantity));
                }
            }
        }

        const pendingItems = [];

        for (const plan of calcPlans) {
            // A. Parse mrp_data (Material)
            let mrpResult = [];
            if (typeof plan.mrp_data === 'string') { try { mrpResult = JSON.parse(plan.mrp_data); } catch (e) { } }
            else { mrpResult = plan.mrp_data || []; }

            if (Array.isArray(mrpResult)) {
                for (const item of mrpResult) {
                    const key = `${plan.id}_MAT_${item.material_id}`;
                    const ordered = orderedQtyMap.get(key) || 0;
                    const needed = Number(item.net_requirement || 0);
                    const remaining = needed - ordered;

                    if (remaining > 0) {
                        pendingItems.push({
                            type: 'MATERIAL',
                            plan_id: plan.id,
                            plan_code: plan.code,
                            material_id: item.material_id, // Quan trọng
                            material_code: item.material_code,
                            material_name: item.material_name,
                            supplier_name: item.supplier_name,
                            unit: item.unit,
                            reference_price: item.reference_price,
                            needed_qty: needed,
                            ordered_qty: ordered,
                            remaining_qty: remaining,
                            description: item.material_name
                        });
                    }
                }
            }

            // B. Parse outsourcing_data (Gia Công)
            let outResult = [];
            if (typeof plan.outsourcing_data === 'string') { try { outResult = JSON.parse(plan.outsourcing_data); } catch (e) { } }
            else { outResult = plan.outsourcing_data || []; }

            if (Array.isArray(outResult)) {
                for (const item of outResult) {
                    const desc = `${item.step_name} (${item.product_sku})`;
                    const key = `${plan.id}_OUT_${desc}`;
                    const ordered = orderedQtyMap.get(key) || 0;
                    const needed = Number(item.quantity || 0);
                    const remaining = needed - ordered;

                    if (remaining > 0) {
                        pendingItems.push({
                            type: 'OUTSOURCING',
                            plan_id: plan.id,
                            plan_code: plan.code,
                            material_id: null,
                            material_code: item.product_sku,
                            material_name: item.step_name, // Display as Name
                            supplier_name: item.supplier_name,
                            supplier_id: item.supplier_id, // Outsourcing often has Supplier ID
                            unit: 'Unit',
                            reference_price: item.unit_price,
                            needed_qty: needed,
                            ordered_qty: ordered,
                            remaining_qty: remaining,
                            description: desc // Quan trong để link PO
                        });
                    }
                }
            }
        }

        return pendingItems;
    }

    async createPooledPO(dto: any) {
        // DTO: { supplier_id, items: [{ material_id, quantity, unit_price, plan_id, description, type }] }
        const isOutsourcing = dto.items.some(i => i.type === 'OUTSOURCING');

        const po = this.poRepo.create({
            po_code: `PO-${Date.now()}`,
            uuid: uuidv4(),
            supplier_id: dto.supplier_id,
            note: `PO Gộp (${isOutsourcing ? 'Gia Công' : 'NPL'})`,
            status: 'DRAFT' as any,
            type: (isOutsourcing ? 'OUTSOURCING' : 'MATERIAL') as any, // Quan trọng
        });

        let total = 0;
        po.items = [];

        for (const i of dto.items) {
            const item = new PurchaseOrderItem();
            item.plan_id = i.plan_id;
            item.quantity = Number(i.quantity);
            item.unit_price = Number(i.unit_price);
            item.subtotal = item.quantity * item.unit_price;

            if (i.type === 'OUTSOURCING') {
                item.description = i.description; // e.g. "Son (SKU-01)"
            } else {
                item.material_id = i.material_id;
                item.description = i.material_name || i.description;
            }

            total += item.subtotal;
            po.items.push(item);
        }

        po.total_amount = total;
        return this.poRepo.save(po);
    }
    // ----------------------------------------------------
}