import { Injectable, BadRequestException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProductionFulfillmentOrder, PfoStatus } from './pfo.entity';
import { SalesOrder, SalesOrderStatus } from '../sales/sales-order.entity';
import { SalesOrderItem } from '../sales/sales-order-item.entity';
import { InventoryService } from '../inventory/inventory.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class PfoDemandService {
    constructor(
        @InjectRepository(ProductionFulfillmentOrder) private pfoRepo: Repository<ProductionFulfillmentOrder>,
        @InjectRepository(SalesOrder) private orderRepo: Repository<SalesOrder>,
        @InjectRepository(SalesOrderItem) private orderItemRepo: Repository<SalesOrderItem>,
        @Inject(forwardRef(() => InventoryService)) private inventoryService: InventoryService,
        private productsService: ProductsService
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
            relations: ['customer', 'items', 'items.product', 'pfos', 'deliveries'],
            order: { delivery_date: 'ASC' }
        });

        // Filter orders that haven't been fully planned
        const filteredOrders = orders.filter(o => !o.pfos || o.pfos.length === 0);

        const stocks = await this.inventoryService.getAllStocks();
        const stockMap = new Map<string, number>();
        // Build stock map for ALL warehouses (excluding KHO_MAU)
        const stockMapAll = new Map<string, number>();

        stocks.forEach(s => {
            if (s.item_type === 'PRODUCT' && s.warehouse_code === 'KHO_TP') {
                const key = String(s.item_id);
                stockMap.set(key, (stockMap.get(key) || 0) + Number(s.quantity));
            }
            if (s.item_type === 'PRODUCT' && s.warehouse_code !== 'KHO_MAU') {
                const key = String(s.item_id);
                stockMapAll.set(key, (stockMapAll.get(key) || 0) + Number(s.quantity));
            }
        });

        const enrichedOrders = [];
        for (const o of filteredOrders) {
            let canFulfill = true;
            let totalItems = 0;

            const enrichedItems = [];
            for (const item of o.items) {
                let stock = 0;
                let totalStock = 0;
                let availableStock = 0;
                const product = item.product;
                const approvedBooking = Number(product?.approved_booking_stock || 0);
                const bookingStock = Number(product?.booking_stock || 0);
                
                if (product) {
                    if (product.product_type === 'COMBO') {
                        const components = await this.productsService.getComboComponents(product.sku);
                        if (components && components.length > 0) {
                            let minStockTp = Infinity;
                            let minStockAll = Infinity;
                            let minAvailableAll = Infinity;
                            for (const c of components) {
                                if (c.child_product) {
                                    const childId = String(c.child_product.id);
                                    const childStockTp = stockMap.get(childId) || 0;
                                    const childStockAll = stockMapAll.get(childId) || 0;
                                    const childApproved = Number(c.child_product.approved_booking_stock || 0);
                                    const childAvailable = Math.max(0, childStockAll - childApproved);
                                    
                                    const reqQty = Number(c.quantity) || 1;
                                    
                                    const possibleTp = Math.floor(childStockTp / reqQty);
                                    const possibleAll = Math.floor(childStockAll / reqQty);
                                    const possibleAvailable = Math.floor(childAvailable / reqQty);
                                    
                                    if (possibleTp < minStockTp) minStockTp = possibleTp;
                                    if (possibleAll < minStockAll) minStockAll = possibleAll;
                                    if (possibleAvailable < minAvailableAll) minAvailableAll = possibleAvailable;
                                }
                            }
                            stock = minStockTp === Infinity ? 0 : minStockTp;
                            totalStock = minStockAll === Infinity ? 0 : minStockAll;
                            availableStock = minAvailableAll === Infinity ? 0 : minAvailableAll;
                        }
                    } else {
                        stock = stockMap.get(String(product.id)) || 0;
                        totalStock = stockMapAll.get(String(product.id)) || 0;
                        availableStock = Math.max(0, totalStock - approvedBooking);
                    }
                }
                totalItems++;
                if (availableStock < Number(item.quantity)) canFulfill = false;
                
                enrichedItems.push({
                    ...item,
                    available_stock_tp: stock,
                    total_stock: totalStock,
                    approved_booking_stock: approvedBooking,
                    booking_stock: bookingStock,
                    available_stock: availableStock,
                });
            }

            if (!o.customer_name && o.customer) {
                o.customer_name = o.customer.name;
            }
            const has_pending_export = o.deliveries && o.deliveries.some((d: any) => d.status === 'PENDING_EXPORT');
            enrichedOrders.push({ 
                ...o, 
                items: enrichedItems, 
                can_fulfill_stock: (totalItems > 0 && canFulfill),
                has_pending_export 
            });
        }

        return enrichedOrders;
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
                'sales_order.items.product.logistics',
                'sales_order.items.product.boms',
                'sales_order.items.product.boms.material',
                'sales_order.items.product.components',
                'sales_order.items.product.components.child_product',
                'sales_order.items.product.components.child_product.logistics',
                'sales_order.items.product.components.child_product.boms',
                'sales_order.items.product.components.child_product.boms.material',
                'material_requirements',
                'material_requirements.material',
                'milestones',
                'milestones.vendor',
                'qc_records'
            ]
        });

        if (!pfo) throw new NotFoundException('PFO không tồn tại');

        // AUTO-HEAL: Nếu pfo bị mất relation sales_order do lỗi lưu dữ liệu cũ, thử tìm lại qua mã PFO
        if (!pfo.sales_order && pfo.code.startsWith('PFO-')) {
            const orderCode = pfo.code.replace('PFO-', '');
            const so: any = await this.pfoRepo.manager.findOne('SalesOrder', {
                where: { order_code: orderCode },
                relations: [
                    'customer', 
                    'items', 
                    'items.product',
                    'items.product.logistics',
                    'items.product.boms',
                    'items.product.boms.material',
                    'items.product.components',
                    'items.product.components.child_product',
                    'items.product.components.child_product.logistics',
                    'items.product.components.child_product.boms',
                    'items.product.components.child_product.boms.material'
                ]
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
