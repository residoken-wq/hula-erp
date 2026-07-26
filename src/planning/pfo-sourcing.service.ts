import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionFulfillmentOrder, PfoStatus } from './pfo.entity';
import { PurchaseOrder, POType, POStatus } from '../purchasing/entities/purchase-order.entity';
import { PurchaseOrderItem } from '../purchasing/entities/purchase-order-item.entity';
import { PfoMaterialRequirement, SupplyMethod } from './pfo-material-requirement.entity';
import { PfoMilestone } from './pfo-milestone.entity';

@Injectable()
export class PfoSourcingService {
    constructor(
        @InjectRepository(ProductionFulfillmentOrder) private pfoRepo: Repository<ProductionFulfillmentOrder>,
        @InjectRepository(PurchaseOrder) private poRepo: Repository<PurchaseOrder>,
        @InjectRepository(PurchaseOrderItem) private poItemRepo: Repository<PurchaseOrderItem>,
        @InjectRepository(PfoMilestone) private milestoneRepo: Repository<PfoMilestone>,
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
    async updateProcessRouting(pfoId: number, routingData: { milestone_type: any; step_name: string; vendor_id?: number; vendor_name?: string; unit_price?: number }[]) {
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
            milestone_type: item.milestone_type,
            step_name: item.step_name,
            vendor_id: item.vendor_id || null,
            vendor_name: item.vendor_name || null,
            unit_price: Number(item.unit_price || 0),
            total_cost: Number(item.unit_price || 0) * (pfo.quantity || 1)
        }));

        await this.milestoneRepo.save(newMilestones);

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
        const pfo = await this.pfoRepo.findOne({
            where: { id: pfoId },
            relations: ['material_requirements', 'milestones', 'sales_order', 'sales_order.items', 'sales_order.items.product']
        });

        if (!pfo) throw new NotFoundException('Lệnh SX (PFO) không tồn tại');

        // Xóa các PO NPL & GC (nháp) cũ của PFO này trước khi tạo mới để tránh trùng lặp
        await this.poRepo.delete({ pfo_id: pfoId, status: POStatus.DRAFT });

        const createdPos: string[] = [];

        // 1. TẠO PO NGUYÊN PHỤ LIỆU (PO NPL)
        // Chỉ mua các NPL do HULA cấp phát (supply_method = HULA_SUPPLIED)
        const hulaMaterials = (pfo.material_requirements || []).filter(
            m => m.supply_method === SupplyMethod.HULA_SUPPLIED || !m.supply_method
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
                const validReqs = reqs.filter(r => (r.actual_order_quantity !== undefined ? Number(r.actual_order_quantity) : Number(r.planned_quantity)) > 0);
                if (validReqs.length === 0) continue;

                const poCode = `PO-NPL-PFO${pfoId}-${Math.floor(1000 + Math.random() * 9000)}`;
                
                const suppIdNum = suppIdStr !== 'GENERAL' ? Number(suppIdStr) : null;
                const matPo = this.poRepo.create({
                    po_code: poCode,
                    type: POType.MATERIAL,
                    pfo_id: pfoId,
                    supplier_id: suppIdNum,
                    status: POStatus.DRAFT,
                    note: `Đơn mua Nguyên phụ liệu cấp phát cho PFO #${pfo.code}`
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
                    const qty = r.actual_order_quantity !== undefined ? Number(r.actual_order_quantity) : Number(r.planned_quantity);
                    const price = Number(r.unit_price || 0);
                    return this.poItemRepo.create({
                        purchase_order: matPo,
                        pfo_id: pfoId,
                        material_id: r.material_id,
                        description: `${r.material_code} - ${r.material_name}`,
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

        // 2. TẠO PO GIA CÔNG (SUBCONTRACT PO) TƯƠNG ỨNG TỪNG XƯỞNG/CÔNG ĐOẠN
        const milestonesWithVendor = (pfo.milestones || []).filter(m => m.vendor_id);
        const firstSoItem = pfo.sales_order?.items?.[0];
        let defaultFrontColor = '';
        let defaultBackColor = '';
        if (firstSoItem?.product?.attributes) {
            let attr = firstSoItem.product.attributes;
            if (typeof attr === 'string') {
                try { attr = JSON.parse(attr); } catch (e) {}
            }
            defaultFrontColor = attr?.front_color || '';
            defaultBackColor = attr?.back_color || '';
        }
        
        if (milestonesWithVendor.length > 0) {
            // Gom công đoạn theo từng Vendor ID
            const vendorGroups: { [key: number]: PfoMilestone[] } = {};
            for (const ms of milestonesWithVendor) {
                if (!vendorGroups[ms.vendor_id]) vendorGroups[ms.vendor_id] = [];
                vendorGroups[ms.vendor_id].push(ms);
            }

            for (const [vendorIdStr, msList] of Object.entries(vendorGroups)) {
                const vendorId = Number(vendorIdStr);
                const poCode = `PO-GC-PFO${pfoId}-V${vendorId}-${Math.floor(1000 + Math.random() * 9000)}`;
                
                const gcPo = this.poRepo.create({
                    po_code: poCode,
                    type: POType.OUTSOURCING,
                    pfo_id: pfoId,
                    supplier_id: vendorId,
                    status: POStatus.DRAFT,
                    note: `Đơn gia công cho Xưởng #${vendorId} (${msList.map(m => m.step_name || m.milestone_type).join(', ')})`
                });
                await this.poRepo.save(gcPo);

                const gcItems = msList.map(ms => {
                    const qty = Number(pfo.quantity || 1);
                    const price = Number(ms.unit_price || 0);
                    return this.poItemRepo.create({
                        purchase_order: gcPo,
                        pfo_id: pfoId,
                        product_id: firstSoItem?.product?.id,
                        front_color: defaultFrontColor,
                        back_color: defaultBackColor,
                        description: `Gia công: ${ms.step_name || ms.milestone_type}`,
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
        } else if (pfo.vendor_id) {
            // Nếu chưa chia mốc nhưng có vendor_id chung -> Tạo 1 Subcontract PO tổng
            const poCode = `PO-GC-PFO${pfoId}-${Math.floor(1000 + Math.random() * 9000)}`;
            const gcPo = this.poRepo.create({
                po_code: poCode,
                type: POType.OUTSOURCING,
                pfo_id: pfoId,
                supplier_id: pfo.vendor_id,
                status: POStatus.DRAFT,
                note: `Đơn gia công tổng cho PFO #${pfo.code}`
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
                    return this.poItemRepo.create({
                        purchase_order: gcPo,
                        pfo_id: pfoId,
                        product_id: item.product?.id,
                        front_color: fColor,
                        back_color: bColor,
                        description: `Gia công tổng hợp SP: ${item.product?.name || item.product?.sku}`,
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
}
