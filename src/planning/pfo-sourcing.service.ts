import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionFulfillmentOrder, PfoStatus } from './pfo.entity';
import { PurchaseOrder, POType, POStatus } from '../purchasing/entities/purchase-order.entity';
import { PurchaseOrderItem } from '../purchasing/entities/purchase-order-item.entity';
import { PfoMaterialRequirement, SupplyMethod } from './pfo-material-requirement.entity';

@Injectable()
export class PfoSourcingService {
    constructor(
        @InjectRepository(ProductionFulfillmentOrder) private pfoRepo: Repository<ProductionFulfillmentOrder>,
        @InjectRepository(PurchaseOrder) private poRepo: Repository<PurchaseOrder>,
        @InjectRepository(PurchaseOrderItem) private poItemRepo: Repository<PurchaseOrderItem>
    ) { }

    /**
     * Gán Nhà gia công cho PFO (Gate 3)
     */
    async assignVendor(pfoId: number, vendorId: number) {
        const pfo = await this.pfoRepo.findOne({ where: { id: pfoId } });
        if (!pfo) throw new NotFoundException('PFO không tồn tại');

        pfo.vendor_id = vendorId;
        pfo.status = PfoStatus.WAITING_VENDOR;
        return this.pfoRepo.save(pfo);
    }

    /**
     * Gate 4 & 5: Generate Purchase Orders for Outsourcing and Materials
     */
    async generatePos(pfoId: number) {
        const pfo = await this.pfoRepo.findOne({
            where: { id: pfoId },
            relations: ['material_requirements', 'sales_order', 'sales_order.items']
        });

        if (!pfo) throw new NotFoundException('PFO không tồn tại');
        if (!pfo.vendor_id) throw new BadRequestException('Chưa gán Nhà gia công cho PFO này');

        const createdPos = [];

        // 1. Tạo Subcontract PO (Gia công) cho Vendor
        const subcontractPo = this.poRepo.create({
            po_code: `PO-GC-PFO${pfoId}-${Math.floor(Math.random() * 1000)}`,
            type: POType.OUTSOURCING,
            pfo_id: pfoId,
            supplier_id: pfo.vendor_id,
            status: POStatus.DRAFT,
            note: `Subcontract PO cho PFO #${pfo.code}`
        });
        await this.poRepo.save(subcontractPo);

        const subcontractItems = pfo.sales_order.items.map(item => this.poItemRepo.create({
            purchase_order: subcontractPo,
            pfo_id: pfoId,
            product_id: item.product?.id,
            description: `Gia công SP: ${item.sku}`,
            quantity: item.quantity,
            unit_price: 0, // Should be fetched from supplier price list
            subtotal: 0
        }));
        await this.poItemRepo.save(subcontractItems);
        createdPos.push(subcontractPo.po_code);

        // 2. Tạo Material POs cho NPL bị thiếu (chỉ tạo cho nhóm do Vendor/Supplier cấp)
        const vendorSupplied = pfo.material_requirements.filter(m => m.supply_method === SupplyMethod.VENDOR_SUPPLIED);
        
        // Group by supplier_id (if set on requirement, otherwise we fallback)
        const supplierGroups = {};
        for (const req of vendorSupplied) {
            const suppId = req.supplier_id || 'UNKNOWN';
            if (!supplierGroups[suppId]) supplierGroups[suppId] = [];
            supplierGroups[suppId].push(req);
        }

        for (const [suppId, reqs] of Object.entries(supplierGroups)) {
            const matPo = this.poRepo.create({
                po_code: `PO-NPL-PFO${pfoId}-${Math.floor(Math.random() * 1000)}`,
                type: POType.MATERIAL,
                pfo_id: pfoId,
                supplier_id: suppId !== 'UNKNOWN' ? Number(suppId) : null,
                status: POStatus.DRAFT,
                note: `Cung ứng NPL cho PFO #${pfo.code}`
            });
            await this.poRepo.save(matPo);

            const matItems = (reqs as PfoMaterialRequirement[]).map(r => this.poItemRepo.create({
                purchase_order: matPo,
                pfo_id: pfoId,
                material_id: r.material_id,
                description: r.material_name,
                quantity: r.planned_quantity,
                unit_price: r.unit_price || 0,
                subtotal: r.planned_quantity * (r.unit_price || 0)
            }));
            await this.poItemRepo.save(matItems);

            matPo.total_amount = matItems.reduce((acc, item) => acc + item.subtotal, 0);
            await this.poRepo.save(matPo);

            createdPos.push(matPo.po_code);
        }

        // Cập nhật trạng thái PFO
        pfo.status = PfoStatus.MATERIAL_PREP;
        await this.pfoRepo.save(pfo);

        return {
            message: `Đã tạo thành công ${createdPos.length} POs`,
            pos: createdPos
        };
    }
}
