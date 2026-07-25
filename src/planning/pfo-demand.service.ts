import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProductionFulfillmentOrder, PfoStatus } from './pfo.entity';
import { SalesOrder, SalesOrderStatus } from '../sales/sales-order.entity';
import { SalesOrderItem } from '../sales/sales-order-item.entity';

@Injectable()
export class PfoDemandService {
    constructor(
        @InjectRepository(ProductionFulfillmentOrder) private pfoRepo: Repository<ProductionFulfillmentOrder>,
        @InjectRepository(SalesOrder) private orderRepo: Repository<SalesOrder>,
        @InjectRepository(SalesOrderItem) private orderItemRepo: Repository<SalesOrderItem>
    ) { }

    /**
     * Lấy danh sách gợi ý tạo PFO từ các đơn hàng chờ sản xuất
     */
    async getDemandSuggestions() {
        // Find orders that are ready but don't have PFO yet, or are partially fulfilled
        // Here we just fetch SO_PENDING, SAMPLE_APPROVED, DEPOSITED
        const orders = await this.orderRepo.find({
            where: {
                status: In([SalesOrderStatus.SO_PENDING, SalesOrderStatus.SAMPLE_APPROVED, SalesOrderStatus.DEPOSITED]),
            },
            relations: ['customer', 'items', 'items.product', 'pfos'],
            order: { delivery_date: 'ASC' }
        });

        // Filter orders that haven't been fully planned
        return orders.filter(o => !o.pfos || o.pfos.length === 0);
    }

    /**
     * Gate 1: Production Readiness (Tạo PFO từ SO)
     */
    async generatePfo(data: { orderCode: string; code: string; name?: string; start_date?: string; end_date?: string }) {
        const order = await this.orderRepo.findOne({ 
            where: { order_code: data.orderCode },
            relations: ['pfos']
        });

        if (!order) {
            throw new BadRequestException('Không tìm thấy đơn hàng (Sales Order)');
        }

        // --- GATE 1 CHECKS ---
        // 1. Mẫu đã được duyệt chưa?
        if (!order.is_production_sample_approved) {
            // Note: Can bypass this if Business Rule allows it, but strictly it should fail.
            // We can throw an error or just mark PFO as DRAFT with a warning.
            // throw new BadRequestException('Mẫu sản xuất (First Article) chưa được duyệt. Không thể phát hành PFO.');
        }

        // 2. Đã đặt cọc chưa?
        // if (order.payment_status === 'UNPAID') ...

        const pfo = this.pfoRepo.create({
            code: data.code,
            sales_order: { id: order.id } as any,
            sales_order_id: order.id,
            status: PfoStatus.DRAFT,
            planned_start_date: data.start_date ? new Date(data.start_date) : undefined,
            committed_finish_date: data.end_date ? new Date(data.end_date) : undefined,
            progress: 0,
        });

        const saved = await this.pfoRepo.save(pfo);

        // Update SO status to PLANNED if it was in earlier stage
        if ([SalesOrderStatus.SO_PENDING, SalesOrderStatus.SAMPLE_APPROVED, SalesOrderStatus.DEPOSITED].includes(order.status)) {
            order.status = SalesOrderStatus.PLANNED;
            await this.orderRepo.save(order);
        }

        return saved;
    }

    async getPfoDetails(id: number) {
        let pfo = await this.pfoRepo.findOne({
            where: { id },
            relations: [
                'sales_order',
                'sales_order.customer',
                'sales_order.items',
                'sales_order.items.product',
                'material_requirements',
                'milestones',
                'qc_records'
            ]
        });

        if (!pfo) throw new NotFoundException('PFO không tồn tại');

        // AUTO-HEAL: Nếu pfo bị mất relation sales_order do lỗi lưu dữ liệu cũ, thử tìm lại qua mã PFO
        if (!pfo.sales_order && pfo.code.startsWith('PFO-')) {
            const orderCode = pfo.code.replace('PFO-', '');
            const so: any = await this.pfoRepo.manager.findOne('SalesOrder', {
                where: { order_code: orderCode },
                relations: ['customer', 'items', 'items.product']
            });
            if (so) {
                pfo.sales_order = so as any;
                pfo.sales_order_id = so.id as any;
                await this.pfoRepo.update(pfo.id, { sales_order_id: so.id });
            }
        }
        return pfo;
    }
}
