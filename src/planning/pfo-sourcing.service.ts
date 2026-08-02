import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionFulfillmentOrder, PfoStatus } from './pfo.entity';
import { PurchaseOrder, POType, POStatus } from '../purchasing/entities/purchase-order.entity';
import { PurchaseOrderItem } from '../purchasing/entities/purchase-order-item.entity';
import { PfoMaterialRequirement, SupplyMethod } from './pfo-material-requirement.entity';
import { PfoMilestone } from './pfo-milestone.entity';
import { Supplier } from '../suppliers/supplier.entity';
import { GoodsIssue, GoodsIssueStatus, GoodsIssueType, GoodsIssueDeliveryMode } from '../inventory/entities/goods-issue.entity';
import { GoodsIssueItem } from '../inventory/entities/goods-issue-item.entity';

@Injectable()
export class PfoSourcingService {
    constructor(
        @InjectRepository(ProductionFulfillmentOrder) private pfoRepo: Repository<ProductionFulfillmentOrder>,
        @InjectRepository(PurchaseOrder) private poRepo: Repository<PurchaseOrder>,
        @InjectRepository(PurchaseOrderItem) private poItemRepo: Repository<PurchaseOrderItem>,
        @InjectRepository(PfoMaterialRequirement) private materialReqRepo: Repository<PfoMaterialRequirement>,
        @InjectRepository(PfoMilestone) private milestoneRepo: Repository<PfoMilestone>,
        @InjectRepository(GoodsIssue) private goodsIssueRepo: Repository<GoodsIssue>,
        @InjectRepository(GoodsIssueItem) private goodsIssueItemRepo: Repository<GoodsIssueItem>
    ) { }

    /**
     * Gán Nhà gia công cho PFO (Gate 3) - Có thể gán chung hoặc theo mốc
     */
    async assignVendor(pfoId: number, vendorId: number) {
        const pfo = await this.pfoRepo.findOne({ where: { id: pfoId } });
        if (!pfo) throw new NotFoundException('PFO không tồn tại');

        pfo.vendor_id = vendorId;
        pfo.status = PfoStatus.WAITING_VENDOR;
        return this.pfoRepo.save(pfo);
    }

    /**
     * Cập nhật danh sách công đoạn & Nhà gia công tương ứng cho PFO (Gate 3 Multi-Vendor)
     */
    async updateProcessRouting(pfoId: number, routingData: any[]) {
        const id = Number(pfoId);
        const pfo = await this.pfoRepo.findOne({ where: { id }, relations: ['milestones'] });
        if (!pfo) throw new NotFoundException('PFO không tồn tại');

        // Xóa milestones cũ nếu có
        if (pfo.milestones && pfo.milestones.length > 0) {
            await this.milestoneRepo.remove(pfo.milestones);
        }

        const safeList = Array.isArray(routingData) ? routingData : [];
        const newMilestones = safeList.map(item => this.milestoneRepo.create({
            pfo_id: id,
            milestone_type: item.milestone_type || item.step_name || 'OUTSOURCING',
            step_name: item.step_name || item.milestone_type || 'Gia công',
            vendor_id: item.vendor_id ? Number(item.vendor_id) : null,
            vendor_name: item.vendor_name || null,
            unit_price: Number(item.unit_price || 0),
            product_id: item.product_id ? Number(item.product_id) : null,
            product_name: item.product_name || null,
            planned_quantity: Number(item.planned_quantity || pfo.quantity || 1),
            total_cost: Number(item.unit_price || 0) * Number(item.planned_quantity || pfo.quantity || 1)
        }));

        await this.milestoneRepo.save(newMilestones);

        pfo.milestones = newMilestones;
        pfo.status = PfoStatus.WAITING_VENDOR;
        await this.pfoRepo.save(pfo);

        return {
            message: 'Đã cập nhật quy trình gia công đa xưởng',
            milestones: newMilestones
        };
    }

    /**
     * Gate 4 & 5: Sinh PO Mua Nguyên Phụ Liệu (PO NPL) & PO Gia Công Đa Xưởng (Subcontract PO)
     */
    async generatePos(pfoId: number) {
        const id = Number(pfoId);
        const pfo = await this.pfoRepo.findOne({
            where: { id },
            relations: ['material_requirements', 'milestones', 'sales_order', 'sales_order.items', 'sales_order.items.product']
        });

        if (!pfo) throw new NotFoundException('Lệnh SX (PFO) không tồn tại');

        try {
            // 1. Xóa an toàn các PO NPL & GC (nháp DRAFT) cũ của PFO này để tránh lỗi Foreign Key Constraint
            const existingDraftPos = await this.poRepo.find({
                where: { pfo_id: id, status: POStatus.DRAFT }
            });
            if (existingDraftPos.length > 0) {
                const poIds = existingDraftPos.map(p => p.id);
                try {
                    await this.goodsIssueRepo.createQueryBuilder()
                        .update()
                        .set({ po_id: () => 'NULL' })
                        .where('po_id IN (:...poIds)', { poIds })
                        .execute();
                } catch (e) {
                    console.warn('[generatePos] Could not unlink goods_issues:', e);
                }

                try {
                    await this.poRepo.createQueryBuilder()
                        .update()
                        .set({ parent_po_id: () => 'NULL' })
                        .where('parent_po_id IN (:...poIds)', { poIds })
                        .execute();
                } catch (e) {
                    console.warn('[generatePos] Could not unlink parent_po_id:', e);
                }

                await this.poItemRepo.createQueryBuilder()
                    .delete()
                    .where('po_id IN (:...poIds)', { poIds })
                    .execute();
                await this.poRepo.delete(poIds);
            }

            const createdPos: string[] = [];
            let createdGoodsIssue: string | null = null;

            // 2. TẠO PHIẾU XUẤT KHO NPL TỪ TỒN KHO (Nếu có dùng tồn kho)
            const inventoryReqs = (pfo.material_requirements || []).filter(
                m => m.use_inventory === true && Number(m.inventory_used_quantity || 0) > 0
            );

            if (inventoryReqs.length > 0) {
                // Delete old DRAFT issues for this PFO an toàn
                const existingDraftIssues = await this.goodsIssueRepo.find({
                    where: { pfo_id: id, status: GoodsIssueStatus.DRAFT }
                });
                if (existingDraftIssues.length > 0) {
                    const issueIds = existingDraftIssues.map(i => i.id);
                    await this.goodsIssueItemRepo.createQueryBuilder()
                        .delete()
                        .where('issue_id IN (:...issueIds)', { issueIds })
                        .execute();
                    await this.goodsIssueRepo.delete(issueIds);
                }

                const timestamp = Date.now().toString().slice(-4);
                const rand = Math.floor(100 + Math.random() * 900);
                const issueCode = `PXK-PFO${id}-${timestamp}${rand}`;
                const goodsIssue = this.goodsIssueRepo.create({
                    code: issueCode,
                    type: GoodsIssueType.PRODUCTION,
                    delivery_mode: GoodsIssueDeliveryMode.PER_ORDER,
                    status: GoodsIssueStatus.DRAFT,
                    pfo_id: id,
                    note: `Xuất kho nguyên phụ liệu cho Lệnh SX #${pfo.code || id}`
                });
                await this.goodsIssueRepo.save(goodsIssue);

                const issueItems = inventoryReqs.map(r => {
                    const issueQty = Number(r.inventory_used_quantity || 0);
                    return this.goodsIssueItemRepo.create({
                        issue: goodsIssue,
                        issue_id: goodsIssue.id,
                        material_id: r.material_id,
                        quantity: issueQty,
                        note: `Xuất tồn kho: ${r.material_code || r.material_name || ''}`
                    });
                });
                await this.goodsIssueItemRepo.save(issueItems);
                createdGoodsIssue = goodsIssue.code;
            }

            // 3. TẠO PO NGUYÊN PHỤ LIỆU (PO NPL)
            // Chỉ mua các NPL do HULA cấp phát (supply_method = HULA_SUPPLIED) và số lượng cần mua > 0
            const hulaMaterials = (pfo.material_requirements || []).filter(
                m => (m.supply_method === SupplyMethod.HULA_SUPPLIED || !m.supply_method) && 
                     (m.actual_order_quantity !== undefined ? Number(m.actual_order_quantity) : Number(m.planned_quantity || 0)) > 0
            );

            if (hulaMaterials.length > 0) {
                // Gom nhóm theo supplier_id (nếu có)
                const supplierGroups: { [key: string]: PfoMaterialRequirement[] } = {};
                for (const req of hulaMaterials) {
                    const suppId = req.supplier_id ? String(req.supplier_id) : 'GENERAL';
                    if (!supplierGroups[suppId]) supplierGroups[suppId] = [];
                    supplierGroups[suppId].push(req);
                }

                for (const [suppIdStr, reqs] of Object.entries(supplierGroups)) {
                    const validReqs = reqs.filter(r => (r.actual_order_quantity !== undefined ? Number(r.actual_order_quantity) : Number(r.planned_quantity || 0)) > 0);
                    if (validReqs.length === 0) continue;

                    const timestamp = Date.now().toString().slice(-4);
                    const rand = Math.floor(100 + Math.random() * 900);
                    const poCode = `PO-NPL-PFO${id}-${suppIdStr !== 'GENERAL' ? `S${suppIdStr}-` : ''}${timestamp}${rand}`;
                    
                    const suppIdNum = (suppIdStr !== 'GENERAL' && Number(suppIdStr) > 0) ? Number(suppIdStr) : null;
                    const matPo = this.poRepo.create({
                        po_code: poCode,
                        type: POType.MATERIAL,
                        pfo_id: id,
                        supplier_id: suppIdNum,
                        status: POStatus.DRAFT,
                        note: `Đơn mua Nguyên phụ liệu cấp phát cho PFO #${pfo.code || id}`
                    });
                    await this.poRepo.save(matPo);

                    // Extract first product color details from SO if available
                    let defaultFrontColor = '';
                    let defaultBackColor = '';
                    const firstSoItem = pfo.sales_order?.items?.[0];
                    if (firstSoItem?.product?.attributes) {
                        let attr = firstSoItem.product.attributes;
                        if (typeof attr === 'string') {
                            try { attr = JSON.parse(attr); } catch (e) {}
                        }
                        defaultFrontColor = attr?.front_color || '';
                        defaultBackColor = attr?.back_color || '';
                    }

                    const matItems = validReqs.map(r => {
                        const qty = r.actual_order_quantity !== undefined ? Number(r.actual_order_quantity) : Number(r.planned_quantity || 0);
                        const price = Number(r.unit_price || 0);
                        const validMatId = (r.material_id && Number(r.material_id) > 0) ? Number(r.material_id) : null;
                        return this.poItemRepo.create({
                            purchase_order: matPo,
                            pfo_id: id,
                            material_id: validMatId,
                            description: `${r.material_code || ''} - ${r.material_name || ''}`.trim(),
                            front_color: defaultFrontColor,
                            back_color: defaultBackColor,
                            quantity: qty,
                            raw_quantity: qty,
                            total_quantity: qty,
                            unit_price: price,
                            subtotal: qty * price
                        });
                    });
                    await this.poItemRepo.save(matItems);

                    matPo.total_amount = matItems.reduce((acc, item) => acc + Number(item.subtotal || 0), 0);
                    await this.poRepo.save(matPo);

                    createdPos.push(matPo.po_code);
                }
            }

            // 4. TẠO PO GIA CÔNG (SUBCONTRACT PO) TƯƠNG ỨNG TỪNG XƯỞNG/CÔNG ĐOẠN
            const milestonesWithVendor = (pfo.milestones || []).filter(m => m.vendor_id && Number(m.vendor_id) > 0);
            const firstSoItem = pfo.sales_order?.items?.[0];
            let defaultFrontColor = '';
            let defaultBackColor = '';
            
            // Build map for all products in SO items
            const soItemProductMap = new Map<number, { frontColor: string, backColor: string }>();
            if (pfo.sales_order?.items) {
                for (const item of pfo.sales_order.items) {
                    if (item.product?.id) {
                        let frontColor = '';
                        let backColor = '';
                        if (item.product.attributes) {
                            let attr = item.product.attributes;
                            if (typeof attr === 'string') {
                                try { attr = JSON.parse(attr); } catch (e) {}
                            }
                            frontColor = attr?.front_color || '';
                            backColor = attr?.back_color || '';
                        }
                        soItemProductMap.set(item.product.id, { frontColor, backColor });
                        
                        if (item === firstSoItem) {
                            defaultFrontColor = frontColor;
                            defaultBackColor = backColor;
                        }
                    }
                }
            }
            
            if (milestonesWithVendor.length > 0) {
                // Gom công đoạn theo từng Vendor ID
                const vendorGroups: { [key: number]: PfoMilestone[] } = {};
                for (const ms of milestonesWithVendor) {
                    const vId = Number(ms.vendor_id);
                    if (!vId || isNaN(vId)) continue;
                    if (!vendorGroups[vId]) vendorGroups[vId] = [];
                    vendorGroups[vId].push(ms);
                }

                for (const [vendorIdStr, msList] of Object.entries(vendorGroups)) {
                    const vendorId = Number(vendorIdStr);
                    if (!vendorId || isNaN(vendorId)) continue;
                    const timestamp = Date.now().toString().slice(-4);
                    const rand = Math.floor(100 + Math.random() * 900);
                    const poCode = `PO-GC-PFO${id}-V${vendorId}-${timestamp}${rand}`;
                    
                    const gcPo = this.poRepo.create({
                        po_code: poCode,
                        type: POType.OUTSOURCING,
                        pfo_id: id,
                        supplier_id: vendorId,
                        status: POStatus.DRAFT,
                        note: `Đơn gia công cho Xưởng #${vendorId} (${msList.map(m => m.step_name || m.milestone_type).join(', ')})`
                    });
                    await this.poRepo.save(gcPo);

                    const gcItems = msList.map(ms => {
                        const qty = Number(ms.planned_quantity || pfo.quantity || 1);
                        const price = Number(ms.unit_price || 0);
                        const prodDesc = ms.product_name ? ` [${ms.product_name}]` : '';
                        
                        const rawProdId = ms.product_id ? Number(ms.product_id) : (firstSoItem?.product?.id || null);
                        const prodId = (rawProdId && !isNaN(rawProdId) && rawProdId > 0) ? rawProdId : null;
                        const colors = (prodId ? soItemProductMap.get(prodId) : null) || { frontColor: defaultFrontColor, backColor: defaultBackColor };

                        return this.poItemRepo.create({
                            purchase_order: gcPo,
                            pfo_id: id,
                            product_id: prodId,
                            front_color: colors.frontColor || '',
                            back_color: colors.backColor || '',
                            description: `Gia công: ${ms.step_name || ms.milestone_type || 'Gia công'}${prodDesc}`,
                            quantity: qty,
                            raw_quantity: qty,
                            total_quantity: qty,
                            unit_price: price,
                            subtotal: qty * price
                        });
                    });
                    await this.poItemRepo.save(gcItems);

                    gcPo.total_amount = gcItems.reduce((acc, item) => acc + Number(item.subtotal || 0), 0);
                    await this.poRepo.save(gcPo);

                    createdPos.push(gcPo.po_code);
                }
            } else if (pfo.vendor_id && Number(pfo.vendor_id) > 0) {
                // Nếu chưa chia mốc nhưng có vendor_id chung -> Tạo 1 Subcontract PO tổng
                const timestamp = Date.now().toString().slice(-4);
                const rand = Math.floor(100 + Math.random() * 900);
                const poCode = `PO-GC-PFO${id}-${timestamp}${rand}`;
                const gcPo = this.poRepo.create({
                    po_code: poCode,
                    type: POType.OUTSOURCING,
                    pfo_id: id,
                    supplier_id: Number(pfo.vendor_id),
                    status: POStatus.DRAFT,
                    note: `Đơn gia công tổng cho PFO #${pfo.code || id}`
                });
                await this.poRepo.save(gcPo);

                if (pfo.sales_order && pfo.sales_order.items) {
                    const gcItems = pfo.sales_order.items.map(item => {
                        let fColor = '';
                        let bColor = '';
                        if (item.product?.attributes) {
                            let attr = item.product.attributes;
                            if (typeof attr === 'string') {
                                try { attr = JSON.parse(attr); } catch (e) {}
                            }
                            fColor = attr?.front_color || '';
                            bColor = attr?.back_color || '';
                        }

                        const qty = Number(item.quantity || 1);
                        const pId = (item.product?.id && Number(item.product.id) > 0) ? Number(item.product.id) : null;
                        return this.poItemRepo.create({
                            purchase_order: gcPo,
                            pfo_id: id,
                            product_id: pId,
                            front_color: fColor,
                            back_color: bColor,
                            description: `Gia công tổng hợp SP: ${item.product?.name || item.product?.sku || ''}`,
                            quantity: qty,
                            raw_quantity: qty,
                            total_quantity: qty,
                            unit_price: 0,
                            subtotal: 0
                        });
                    });
                    await this.poItemRepo.save(gcItems);
                }

                createdPos.push(gcPo.po_code);
            }

            // Đổi trạng thái PFO sang WAITING_VENDOR nếu đang ở DRAFT
            if (pfo.status === PfoStatus.DRAFT || pfo.status === PfoStatus.PENDING_APPROVAL) {
                pfo.status = PfoStatus.WAITING_VENDOR;
                await this.pfoRepo.save(pfo);
            }

            return {
                message: `Đã phát hành ${createdPos.length} Đơn đặt hàng (PO)`,
                pos: createdPos
            };
        } catch (error: any) {
            console.error(`[PfoSourcingService.generatePos] Error on PFO #${id}:`, error);
            throw new BadRequestException(`Không thể phát hành PO cho PFO #${id}: ${error?.message || 'Lỗi xử lý dữ liệu'}`);
        }
    }

    async getPos(pfoId: number) {
        const pos = await this.poRepo.find({
            where: { pfo_id: pfoId },
            relations: ['items', 'items.material', 'items.product', 'supplier'],
            order: { created_at: 'DESC' }
        });
        return {
            pos_npl: pos.filter(po => po.type === POType.MATERIAL),
            pos_gc: pos.filter(po => po.type === POType.OUTSOURCING)
        };
    }

    async getPxks(pfoId: number) {
        const pxks = await this.goodsIssueRepo.find({
            where: { pfo_id: pfoId },
            relations: ['items', 'items.material', 'items.product', 'supplier'],
            order: { created_at: 'DESC' }
        });
        return {
            pxk_npl: pxks.filter(pxk => pxk.type === GoodsIssueType.PRODUCTION || !pxk.type),
            pxk_gc: pxks.filter(pxk => pxk.type === GoodsIssueType.OUTSOURCING) // if there is such a type, or empty
        };
    }
}
