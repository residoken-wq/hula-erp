import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PurchaseOrder, POType, POStatus } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { GoodsReceipt } from '../inventory/entities/goods-receipt.entity';
import { InventoryService } from '../inventory/inventory.service';
import { ProductsService } from '../products/products.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { PlanningService } from '../planning/planning.service'; // --- MỚI ---
import { v4 as uuidv4 } from 'uuid';
import { ProductionPlan } from '../planning/production-plan.entity';

@Injectable()
export class PurchasingService {
    constructor(
        @InjectRepository(PurchaseOrder) private poRepo: Repository<PurchaseOrder>,
        @InjectRepository(PurchaseOrderItem) private poItemRepo: Repository<PurchaseOrderItem>,
        @InjectRepository(GoodsReceipt) private grRepo: Repository<GoodsReceipt>,
        private inventoryService: InventoryService,
        private productsService: ProductsService,
        private suppliersService: SuppliersService,
        private planningService: PlanningService,
        @InjectRepository(ProductionPlan) private planRepo: Repository<ProductionPlan>,
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
                item.plan_id = i.plan_id; // --- FIX: Lưu plan_id ---
                item.material_id = i.material_id;
                item.product_id = i.product_id;
                item.description = i.description || '';
                item.note = i.note || ''; // --- FIX: Save note ---
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
        return this.poRepo.find({ relations: ['supplier', 'items', 'items.material', 'plan', 'plan.customer'], order: { created_at: 'DESC' } });
    }

    async getPOByCode(code: string) {
        return this.poRepo.findOne({ where: { po_code: code }, relations: ['supplier'] });
    }

    async getPODetail(id: number) {
        const po = await this.poRepo.findOne({ where: { id }, relations: ['supplier', 'items', 'items.material', 'items.product'] });
        if (!po || !po.items) return po;

        // --- MỚI: Recover Missing Product (Legacy Data Fix) ---
        // Some Outsourcing POs created before 02/01/2026 might miss product_id
        // HOẶC product_id có nhưng ko load được relation (trường hợp hiếm)
        const missingProductItems = po.items.filter(i => (!i.product || !i.product.processing_description) && !i.material_id && i.description);

        if (missingProductItems.length > 0) {
            const skuMap = new Map<string, any>();

            // Helper to extract SKU: Taken from the last (...) group
            const extractSku = (desc: string) => {
                const matches = desc.match(/\(([^)]+)\)/g);
                if (matches && matches.length > 0) {
                    // Take the last match, remove parens
                    const last = matches[matches.length - 1];
                    return last.replace(/^\(/, '').replace(/\)$/, '').trim();
                }
                return null;
            };

            for (const item of missingProductItems) {
                const sku = extractSku(item.description);
                if (sku) skuMap.set(sku, null);
            }

            if (skuMap.size > 0) {
                for (const sku of Array.from(skuMap.keys())) {
                    const p = await this.productsService.findOneBySku(sku);
                    if (p) {
                        skuMap.set(sku, p);
                    }
                }
                for (const item of missingProductItems) {
                    const sku = extractSku(item.description);
                    if (sku) {
                        const p = skuMap.get(sku);
                        if (p) {
                            item.product = p;
                            item.product_id = p.id;
                        }
                    }
                }
            }
        }
        // -----------------------------------------------------


        // --- MỚI: Enrich Item Data from Plan if missing ---
        const planIds = new Set(po.items.map(i => i.plan_id).filter(Boolean));
        if (planIds.size > 0) {
            const plans = await this.planRepo.find({ where: { id: In(Array.from(planIds)) } });
            const planMap = new Map(plans.map(p => [p.id, p]));

            for (const item of po.items) {
                // Chỉ điền nếu dữ liệu đang bằng 0
                if (item.plan_id && planMap.has(item.plan_id)) {
                    const plan = planMap.get(item.plan_id);

                    // A. Material Logic
                    if (item.material_id) {
                        let mrpResult = [];
                        if (typeof plan.mrp_data === 'string') { try { mrpResult = JSON.parse(plan.mrp_data); } catch (e) { } }
                        else { mrpResult = plan.mrp_data || []; }

                        // Match by Material ID (Make sure to compare as numbers)
                        const match = mrpResult.find((m: any) => Number(m.material_id) === Number(item.material_id));

                        if (match) {
                            // Always enrich if data exists in Plan (Overwrite DB 0 values)
                            item.raw_quantity = match.gross_raw || 0;
                            item.wastage_rate = match.wastage_percent || 0;
                            item.total_quantity = match.gross_requirement || 0;
                        }
                    }
                    // B. Outsourcing Logic
                    else {
                        let outResult = [];
                        if (typeof plan.outsourcing_data === 'string') { try { outResult = JSON.parse(plan.outsourcing_data); } catch (e) { } }
                        else { outResult = plan.outsourcing_data || []; }

                        // Match by Description approx
                        const match = outResult.find((m: any) => item.description?.includes(m.product_sku));
                        if (match) {
                            item.raw_quantity = match.quantity || 0; // Gross
                            item.total_quantity = match.quantity || 0;
                        }
                    }
                }
            }
        }
        // ------------------------------------------------
        return po;
    }


    async updatePO(id: number, data: any) {
        const po = await this.poRepo.findOne({ where: { id }, relations: ['items'] });
        if (!po) throw new NotFoundException();

        if (data.outsourcing_delivery_info) po.outsourcing_delivery_info = data.outsourcing_delivery_info;
        if (data.delivery_info) po.delivery_info = data.delivery_info;
        if (data.packing_list_details) po.packing_list_details = data.packing_list_details;
        if (data.status) po.status = data.status;
        if (data.note !== undefined) po.note = data.note; // Update General Note
        if (data.supplier_id) po.supplier = { id: data.supplier_id } as any; // Update Supplier relation
        
        if (data.project_id !== undefined) po.project_id = data.project_id;
        if (data.task_id !== undefined) po.task_id = data.task_id;

        // --- MỚI: Update Items logic ---
        if (data.items && Array.isArray(data.items)) {
            for (const itemDTO of data.items) {
                const poItem = po.items.find(i => i.id === itemDTO.id);
                if (poItem) {
                    // Update Item fields
                    if (itemDTO.product_id !== undefined) {
                        poItem.product = { id: itemDTO.product_id } as any;
                        poItem.product_id = itemDTO.product_id; // Explicitly set ID
                    }
                    if (itemDTO.quantity !== undefined) poItem.quantity = Number(itemDTO.quantity);
                    if (itemDTO.unit_price !== undefined) poItem.unit_price = Number(itemDTO.unit_price);
                    if (itemDTO.note !== undefined) poItem.note = itemDTO.note; // Update Item Note

                    // Recalculate Subtotal
                    poItem.subtotal = Number(poItem.quantity) * Number(poItem.unit_price);
                }
            }
            // Save updated items
            await this.poItemRepo.save(po.items);


            // Recalculate PO Total
            po.total_amount = po.items.reduce((sum, i) => sum + Number(i.subtotal), 0);
        }
        // -------------------------------


        const savedPO = await this.poRepo.save(po);

        // --- Sync Price to Planning if Ordered ---
        if (data.status === 'ORDERED' && savedPO.plan_id) {
            await this.planningService.syncPoPrices(savedPO.plan_id);
        }

        // --- MỚI: Auto-check Plan Status khi PO status thay đổi ---
        if (data.status && savedPO.plan_id) {
            await this.planningService.checkAndUpdatePlanStatus(savedPO.plan_id);
        }

        return savedPO;
    }

    async updatePayment(poCode: string, amount: number) {
        const po = await this.poRepo.findOne({ where: { po_code: poCode } });
        if (po) {
            po.paid_amount = Number(po.paid_amount || 0) + Number(amount);
            await this.poRepo.save(po);
        }
    }

    async updatePaymentById(id: number, amount: number) {
        const po = await this.poRepo.findOne({ where: { id } });
        if (po) {
            po.paid_amount = Number(po.paid_amount || 0) + Number(amount);

            // Auto Update Status
            if (po.paid_amount >= po.total_amount) {
                // Determine logic: keep existing status or move to COMPLETED?
                // Usually COMPLETED implies both received and paid.
                // For now, let's strictly handle payment amount.
            }

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
        // Unlink children if this is a Pooled PO
        const children = await this.poRepo.find({ where: { parent_po_id: id } });
        if (children.length > 0) {
            await this.poRepo.update({ parent_po_id: id }, { parent_po_id: null });
        }
        return this.poRepo.delete(id);
    }

    async createGoodsReceipt(poId: number, data: any) {
        const po = await this.poRepo.findOne({ where: { id: poId }, relations: ['items'] });
        if (!po) throw new NotFoundException('PO not found');

        const gr = this.grRepo.create({
            code: data.code, purchase_order: po, delivery_date: data.date, note: data.note
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

    async getByUuid(uuid: string) {
        const po = await this.poRepo.findOne({
            where: { uuid },
            relations: ['supplier', 'items', 'items.product', 'items.material']
        });
        if (!po) throw new NotFoundException('Đơn hàng không tồn tại hoặc link đã hết hạn');
        return po;
    }

    async supplierAction(uuid: string, action: string, data?: any) {
        const po = await this.poRepo.findOne({ where: { uuid }, relations: ['items'] });
        if (!po) throw new NotFoundException('Đơn hàng không tồn tại');

        // Initialize outsourcing_delivery_info if null
        if (!po.outsourcing_delivery_info) po.outsourcing_delivery_info = {};
        if (!po.outsourcing_delivery_info.progress_updates) po.outsourcing_delivery_info.progress_updates = [];

        switch (action) {
            case 'CONFIRM':
                if (!['DRAFT', 'SENT'].includes(po.status)) {
                    throw new BadRequestException('Đơn hàng đã được xác nhận trước đó');
                }
                po.status = POStatus.CONFIRMED;
                po.outsourcing_delivery_info.confirmed_at = new Date().toISOString();
                po.outsourcing_delivery_info.confirmed_note = data?.note || null;
                break;

            case 'UPDATE_PROGRESS':
                // data: { completed_qty, note, photos }
                po.outsourcing_delivery_info.progress_updates.push({
                    completed_qty: Number(data?.completed_qty || 0),
                    note: data?.note || '',
                    photos: data?.photos || [],
                    timestamp: new Date().toISOString()
                });
                // Auto-update status to ORDERED nếu chưa
                if (['CONFIRMED', 'DRAFT', 'SENT'].includes(po.status)) {
                    po.status = POStatus.ORDERED;
                }
                break;

            case 'MARK_COMPLETED':
                po.outsourcing_delivery_info.completed_at = new Date().toISOString();
                po.outsourcing_delivery_info.completion_note = data?.note || '';
                po.outsourcing_delivery_info.completion_photos = data?.photos || [];
                // Chuyển sang DELIVERED (chờ nội bộ confirm nhập kho)
                po.status = POStatus.DELIVERED;
                break;

            case 'REJECT':
                po.outsourcing_delivery_info.rejection = {
                    reason: data?.reason || 'Không có lý do',
                    rejected_at: new Date().toISOString(),
                    note: data?.note || ''
                };
                po.status = POStatus.CANCELLED;
                break;

            default:
                throw new BadRequestException(`Action không hợp lệ: ${action}`);
        }

        const saved = await this.poRepo.save(po);

        // Auto-check plan status
        if (saved.plan_id) {
            await this.planningService.checkAndUpdatePlanStatus(saved.plan_id);
        }

        return saved;
    }

    // --- MỚI: TỔNG HỢP NHU CẦU MUA HÀNG (PO GỘP) ---
    async getPendingRequirements() {
        console.log('Start getPendingRequirements');
        try {
            // 1. Load tất cả Plan đang ở trạng thái CALCULATED
            const plans = await this.planningService.findAll();
            console.log('Found plans:', plans.length);
            const calcPlans = plans.filter(p => p.status === 'CALCULATED');
            console.log('Calc plans:', calcPlans.length);

            // 2. Load tất cả Item đã đặt hàng (Active)
            const allPoItems = await this.poItemRepo.find({ relations: ['purchase_order'] });
            console.log('Found PO items:', allPoItems.length);
            const activePoItems = allPoItems.filter(i => i.purchase_order && i.purchase_order.status !== 'CANCELLED');
            console.log('Active PO items:', activePoItems.length);

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

                                description: item.material_name,
                                // --- MỚI: Truyền dữ liệu gốc/hao hụt ---
                                raw_quantity: item.gross_raw || 0,
                                wastage_rate: item.wastage_percent || 0,
                                total_quantity: item.gross_requirement || 0
                                // ---------------------------------------
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
        } catch (err) {
            console.error('Error in getPendingRequirements:', err);
            throw err;
        }
    }

    // --- MỚI: POOLED PO LOGIC ---

    async clearPooledPOs() {
        // Unlink all
        await this.poRepo.update({ type: POType.MATERIAL }, { parent_po_id: null });
        await this.poRepo.update({ type: POType.OUTSOURCING }, { parent_po_id: null });
        return this.poRepo.delete({ type: POType.POOLED });
    }

    // Lấy danh sách PO_NPL có thể gộp (chưa có parent_po_id)
    async getAvailableForPooling(type: POType = POType.MATERIAL) {
        return this.poRepo.find({
            where: {
                type: type,
                status: POStatus.ORDERED, // --- CHỈ GỘP PO ĐÃ ĐẶT HÀNG ---
                parent_po_id: null as any
            },
            relations: ['supplier', 'items', 'items.material'],
            order: { created_at: 'DESC' }
        });
    }

    // Tạo Pooled PO từ danh sách child PO IDs
    async createPooledPO(dto: { supplier_id: number, child_po_ids: number[] }) {
        if (!dto.child_po_ids || dto.child_po_ids.length === 0) {
            throw new BadRequestException('Vui lòng chọn ít nhất 1 PO');
        }

        const childPos = await this.poRepo.find({
            where: { id: In(dto.child_po_ids) },
            relations: ['items']
        });

        if (childPos.length === 0) {
            throw new NotFoundException('Không tìm thấy PO');
        }

        // Tính tổng tiền từ các child POs
        const totalAmount = childPos.reduce((sum, p) => sum + Number(p.total_amount || 0), 0);

        const pooledPO = this.poRepo.create({
            po_code: `POOLED-${Date.now()}`,
            uuid: uuidv4(),
            type: POType.POOLED,
            supplier_id: dto.supplier_id,
            status: 'DRAFT' as any,
            total_amount: totalAmount,
            note: `Gộp ${childPos.length} PO: ${childPos.map(p => p.po_code).join(', ')}`
        });

        await this.poRepo.save(pooledPO);

        // Link child POs to this Pooled PO
        await this.poRepo.update({ id: In(dto.child_po_ids) }, { parent_po_id: pooledPO.id });

        return pooledPO;
    }

    // Lấy aggregate view của Pooled PO
    async getPooledAggregate(pooledId: number) {
        const po = await this.poRepo.findOne({
            where: { id: pooledId },
            relations: ['child_pos', 'child_pos.items', 'child_pos.items.material', 'supplier']
        });

        if (!po) throw new NotFoundException('Không tìm thấy PO');
        if (po.type !== POType.POOLED) throw new BadRequestException('PO này không phải Pooled PO');

        // Aggregate by material
        const materialMap = new Map<number, any>();

        for (const childPO of (po.child_pos || [])) {
            for (const item of (childPO.items || [])) {
                if (!item.material_id) continue;

                if (!materialMap.has(item.material_id)) {
                    materialMap.set(item.material_id, {
                        material_id: item.material_id,
                        material_name: item.material?.name || item.description,
                        material_code: item.material?.code,
                        unit: item.material?.unit,
                        total_ordered: 0,
                        total_delivered: 0,  // TODO: Tính từ GoodsReceipt
                        remaining: 0,
                        po_sources: []
                    });
                }

                const agg = materialMap.get(item.material_id);
                agg.total_ordered += Number(item.quantity || 0);
                if (!agg.po_sources.includes(childPO.po_code)) {
                    agg.po_sources.push(childPO.po_code);
                }
            }
        }

        // Calculate remaining
        for (const agg of materialMap.values()) {
            agg.remaining = agg.total_ordered - agg.total_delivered;
        }

        return {
            pooled_po: {
                id: po.id,
                po_code: po.po_code,
                supplier: po.supplier,
                total_amount: po.total_amount,
                child_count: po.child_pos?.length || 0
            },
            aggregated_items: Array.from(materialMap.values())
        };
    }
    // ----------------------------
}