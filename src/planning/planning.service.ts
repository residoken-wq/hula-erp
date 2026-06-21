import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { ProductionPlan, PlanStatus } from './production-plan.entity';
import { SalesOrder, SalesOrderStatus } from '../sales/sales-order.entity';
import { SalesOrderItem, BookingStatus } from '../sales/sales-order-item.entity';
import { ProductsService } from '../products/products.service';
import { MaterialsService } from '../materials/materials.service';
import { PurchaseOrder, POType, POStatus } from '../purchasing/entities/purchase-order.entity';
import { PurchaseOrderItem } from '../purchasing/entities/purchase-order-item.entity';
import { InventoryService } from '../inventory/inventory.service';
import { MrpCalculationService } from './mrp-calculation.service';
import { GanttService } from './gantt.service';

@Injectable()
export class PlanningService {
    constructor(
        @InjectRepository(ProductionPlan) private planRepo: Repository<ProductionPlan>,
        @InjectRepository(SalesOrder) private orderRepo: Repository<SalesOrder>,
        @InjectRepository(SalesOrderItem) private orderItemRepo: Repository<SalesOrderItem>,
        @InjectRepository(PurchaseOrder) private poRepo: Repository<PurchaseOrder>,
        @InjectRepository(PurchaseOrderItem) private poItemRepo: Repository<PurchaseOrderItem>,
        private productsService: ProductsService,
        private materialsService: MaterialsService,
        private inventoryService: InventoryService,
        private mrpCalculationService: MrpCalculationService,
        private ganttService: GanttService,
    ) { }

    async getSuggestion() {
        const orders = await this.orderRepo.find({
            where: {
                status: In([SalesOrderStatus.SO_PENDING, SalesOrderStatus.SAMPLE_APPROVED, SalesOrderStatus.DEPOSITED]),
                plan_id: IsNull()
            },
            relations: ['customer', 'items', 'items.product'],
            order: { delivery_date: 'ASC' }
        });

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
        for (const o of orders) {
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
            enrichedOrders.push({ ...o, items: enrichedItems, can_fulfill_stock: (totalItems > 0 && canFulfill) });
        }

        return enrichedOrders;
    }

    async createPlan(data: any) {
        const orders = await this.orderRepo.find({ where: { order_code: In(data.orderCodes) } });
        if (!orders.length) throw new BadRequestException('Không tìm thấy đơn hàng');

        const plan = this.planRepo.create({
            code: data.code, name: data.name, start_date: data.start_date, end_date: data.end_date, status: PlanStatus.DRAFT
        });
        const saved = await this.planRepo.save(plan);
        await this.orderRepo.update({ id: In(orders.map(o => o.id)) }, { plan_id: saved.id, status: SalesOrderStatus.PLANNED });
        return saved;
    }

    async findOne(id: number) {
        return this.planRepo.findOne({
            where: { id },
            relations: [
                'sales_orders',
                'sales_orders.items',
                'sales_orders.items.product',
                'sales_orders.items.product.components',
                'sales_orders.items.product.components.child_product',
                'sales_orders.items.product.components.child_product.boms',
                'sales_orders.items.product.components.child_product.boms.material',
                'sales_orders.items.product.boms',
                'sales_orders.items.product.boms.material'
            ]
        });
    }

    // --- Delegate to MrpCalculationService ---
    async calculateMaterialNeeds(planId: number) {
        return this.mrpCalculationService.calculateMaterialNeeds(planId);
    }

    async saveAnalysis(id: number, mrpData: any, outsourcingData: any, logisticsData: any) {
        const plan = await this.planRepo.findOneBy({ id });
        if (!plan) throw new NotFoundException();
        plan.mrp_data = mrpData;
        plan.outsourcing_data = outsourcingData;
        if (logisticsData) plan.logistics_data = logisticsData;
        await this.planRepo.save(plan);
        return { message: 'Đã lưu kết quả phân tích' };
    }

    // --- HÀM TẠO PO (Dùng chung cho NPL và Gia Công) ---
    async generatePos(planId: number, data: any[]) {
        const supplierGroups = {};

        for (const item of data) {
            const qty = item.net_requirement !== undefined ? item.net_requirement : item.quantity;
            if (qty > 0) {
                const suppName = item.supplier_name || 'Unknown';
                if (!supplierGroups[suppName]) supplierGroups[suppName] = [];
                supplierGroups[suppName].push({ ...item, qtyToBuy: qty });
            }
        }

        const createdPos = [];
        for (const [suppName, items] of Object.entries(supplierGroups)) {
            if (!items || (items as any[]).length === 0) continue;
            const isMaterial = (items as any)[0].material_id !== undefined;

            const po = this.poRepo.create({
                po_code: `PO-${isMaterial ? 'NPL' : 'GC'}-${planId}-${Math.floor(Math.random() * 1000)}`,
                type: isMaterial ? POType.MATERIAL : 'OUTSOURCING' as any,
                plan_id: planId,
                status: POStatus.DRAFT,
                note: `Tự động từ Kế hoạch ${planId}. NCC: ${suppName}`
            });

            await this.poRepo.save(po);

            const poItems = (items as any[]).map(i => {
                const price = isMaterial ? (i.reference_price || 0) : (i.unit_price || 0);
                const sub = i.qtyToBuy * price;
                const desc = isMaterial ? i.material_name : `${i.step_name} (${i.product_sku})`;

                const poItem = this.poItemRepo.create({
                    purchase_order: po,
                    description: desc,
                    quantity: i.qtyToBuy,
                    unit_price: price,
                    subtotal: sub,
                    plan_id: planId,
                    material_id: isMaterial ? i.material_id : null,
                    product_id: !isMaterial ? i.product_id : null,
                    raw_quantity: i.gross_raw || 0,
                    wastage_rate: i.wastage_percent || 0,
                    total_quantity: i.gross_requirement || 0
                });

                if (isMaterial) poItem.material_id = i.material_id;
                return poItem;
            });

            await this.poItemRepo.save(poItems);

            const totalAmount = poItems.reduce((acc, item) => acc + item.subtotal, 0);
            po.total_amount = totalAmount;
            await this.poRepo.save(po);
            createdPos.push(po.po_code);
        }

        if (createdPos.length > 0) {
            const plan = await this.planRepo.findOne({ where: { id: planId } });
            if (plan) {
                const hasOutsourcing = createdPos.some(c => c.includes('PO-GC'));
                const hasMaterial = createdPos.some(c => c.includes('PO-NPL'));
                if (hasOutsourcing && plan.status !== PlanStatus.HAS_PO_OUTSOURCING) {
                    plan.status = PlanStatus.HAS_PO_OUTSOURCING;
                } else if (hasMaterial && plan.status !== PlanStatus.HAS_PO_OUTSOURCING && plan.status !== PlanStatus.HAS_PO_MATERIAL) {
                    plan.status = PlanStatus.HAS_PO_MATERIAL;
                }
                await this.planRepo.save(plan);
            }
        }

        return { message: `Đã tạo ${createdPos.length} Đơn đặt hàng`, pos: createdPos };
    }

    async findAll() { return this.planRepo.find({ order: { id: 'DESC' }, relations: ['sales_orders', 'sales_orders.customer'] }); }

    async deletePlan(id: number) {
        const plan = await this.planRepo.findOne({ where: { id }, relations: ['sales_orders'] });
        if (!plan) throw new NotFoundException('Kế hoạch không tồn tại');

        const existingPos = await this.poRepo.count({ where: { plan_id: id } });
        if (existingPos > 0) {
            throw new BadRequestException('Không thể xóa kế hoạch đã tạo Đơn mua hàng (PO)');
        }

        if (plan.sales_orders && plan.sales_orders.length > 0) {
            await this.orderRepo.update({ production_plan: { id } }, { production_plan: null });
        }

        await this.planRepo.remove(plan);
        return { message: 'Đã xóa kế hoạch sản xuất' };
    }

    // --- Delegate to MrpCalculationService ---
    async syncPoPrices(planId: number) {
        return this.mrpCalculationService.syncPoPrices(planId);
    }

    // --- Delegate to GanttService ---
    async getGanttData() {
        return this.ganttService.getGanttData();
    }

    async saveGanttConfig(planId: number, config: any) {
        return this.ganttService.saveGanttConfig(planId, config);
    }

    // =============================================
    // --- MỚI: PLAN LIFECYCLE MANAGEMENT ---
    // =============================================

    // Cập nhật status plan thủ công
    async updatePlanStatus(planId: number, status: string) {
        const plan = await this.planRepo.findOne({ where: { id: planId } });
        if (!plan) throw new NotFoundException('Kế hoạch không tồn tại');

        // Validate transition - cho phép linh hoạt theo yêu cầu
        const validTransitions: Record<string, string[]> = {
            'DRAFT': ['CALCULATED', 'DONE'],
            'CALCULATED': ['HAS_PO_MATERIAL', 'HAS_PO_OUTSOURCING', 'IN_PRODUCTION', 'STOCK_RECEIVED', 'DONE'],
            'HAS_PO_MATERIAL': ['HAS_PO_OUTSOURCING', 'IN_PRODUCTION', 'STOCK_RECEIVED', 'DONE'],
            'HAS_PO_OUTSOURCING': ['HAS_PO_MATERIAL', 'IN_PRODUCTION', 'STOCK_RECEIVED', 'DONE'],
            'IN_PRODUCTION': ['STOCK_RECEIVED', 'COMPLETED', 'DONE'],
            'STOCK_RECEIVED': ['DELIVERED_TO_CUSTOMER', 'DONE'],
            'DELIVERED_TO_CUSTOMER': ['DONE'],
            'COMPLETED': ['IN_PRODUCTION', 'DONE'],
            'DONE': ['DRAFT', 'CALCULATED', 'STOCK_RECEIVED'] // Allow reopen
        };

        const allowed = validTransitions[plan.status] || [];
        if (!allowed.includes(status) && status !== plan.status) {
            // Cho phép bypass nếu admin chủ động chuyển, hoặc bỏ warning nếu muốn linh hoạt tối đa.
            // Ở đây tạm nới lỏng hoặc cho phép tất cả để user tự do chuyển
            // throw new BadRequestException(`Không thể chuyển từ ${plan.status} sang ${status}`);
        }

        plan.status = status as PlanStatus;
        return this.planRepo.save(plan);
    }

    // Auto-detect plan status từ PO statuses
    async checkAndUpdatePlanStatus(planId: number) {
        try {
            const plan = await this.planRepo.findOne({ where: { id: planId } });
            if (!plan) return;

            // Lấy tất cả PO thuộc plan này
            const pos = await this.poRepo.find({ where: { plan_id: planId } });
            if (pos.length === 0) return;

            const allPosDelivered = pos.every(
                po => ['DELIVERED', 'COMPLETED'].includes(po.status)
            );
            const anyPoOrdered = pos.some(
                po => ['ORDERED', 'PARTIAL_DELIVERED', 'DELIVERED', 'COMPLETED', 'CONFIRMED'].includes(po.status)
            );

            // Auto-transition logic
            if (allPosDelivered && plan.status !== PlanStatus.COMPLETED) {
                // Tất cả PO đã giao đủ → Có thể chuyển Plan sang COMPLETED
                // Nhưng cần kiểm tra thêm ProductionOrder nếu có
                plan.status = PlanStatus.COMPLETED;
                await this.planRepo.save(plan);
            } else if (anyPoOrdered && plan.status === PlanStatus.CALCULATED) {
                // Có ít nhất 1 PO đã order → Plan chuyển sang IN_PRODUCTION
                plan.status = PlanStatus.IN_PRODUCTION;
                await this.planRepo.save(plan);
            }
        } catch (e) {
            console.error('Auto-update plan status failed:', e);
        }
    }

    async confirmBookings(planId: number, itemIds?: number[]) {
        const plan = await this.planRepo.findOne({
            where: { id: planId },
            relations: ['sales_orders', 'sales_orders.items', 'sales_orders.items.product']
        });
        if (!plan) throw new NotFoundException('Kế hoạch không tồn tại');

        // Fetch real stock for partial booking calculation
        const allStocks = await this.inventoryService.getAllStocks();
        const stockMap = new Map<number, number>();
        for (const s of allStocks) {
            if (s.item_type === 'PRODUCT' && s.warehouse_code !== 'KHO_MAU') {
                const key = Number(s.item_id);
                stockMap.set(key, (stockMap.get(key) || 0) + Number(s.quantity));
            }
        }

        let confirmedCount = 0;
        for (const order of plan.sales_orders) {
            for (const item of order.items) {
                if ((item as any).booking_status === 'TEMPORARY') {
                    // Nếu có truyền itemIds thì kiểm tra xem item.id có trong mảng không
                    if (!itemIds || itemIds.includes(item.id)) {
                        
                        // --- MỚI: Tính toán số lượng có thể book một phần ---
                        const product = item.product;
                        let actualBookedQty = 0;
                        const requestedQty = Number(item.quantity);

                        if (product) {
                            let availableStock = 0;
                            if (product.product_type === 'COMBO') {
                                const components = await this.productsService.getComboComponents(product.sku);
                                let minAvailable = Infinity;
                                for (const c of components) {
                                    if (c.child_product) {
                                        const childStock = stockMap.get(c.child_product.id) || 0;
                                        const childApproved = Number(c.child_product.approved_booking_stock || 0);
                                        const childAvailable = Math.max(0, childStock - childApproved);
                                        const possible = Math.floor(childAvailable / Number(c.quantity));
                                        if (possible < minAvailable) minAvailable = possible;
                                    }
                                }
                                availableStock = minAvailable === Infinity ? 0 : minAvailable;
                            } else {
                                const realStock = stockMap.get(product.id) || 0;
                                const approvedBooking = Number(product.approved_booking_stock || 0);
                                availableStock = Math.max(0, realStock - approvedBooking);
                            }

                            // Book số lượng nhỏ hơn hoặc bằng tồn kho khả dụng
                            actualBookedQty = Math.min(requestedQty, availableStock);

                            if (product.product_type === 'COMBO') {
                                const components = await this.productsService.getComboComponents(product.sku);
                                for (const comp of components) {
                                    if (comp.child_product) {
                                        const approvedQty = actualBookedQty * Number(comp.quantity);
                                        comp.child_product.approved_booking_stock = Number(comp.child_product.approved_booking_stock || 0) + approvedQty;
                                        await this.productsService.update(comp.child_product.id, { approved_booking_stock: comp.child_product.approved_booking_stock } as any);
                                        // Update memory stock for next item
                                        const curStock = stockMap.get(comp.child_product.id) || 0;
                                        stockMap.set(comp.child_product.id, curStock - approvedQty);
                                    }
                                }
                            } else {
                                product.approved_booking_stock = Number(product.approved_booking_stock || 0) + actualBookedQty;
                                await this.productsService.update(product.id, { approved_booking_stock: product.approved_booking_stock } as any);
                                // Update memory stock for next item
                                const curStock = stockMap.get(product.id) || 0;
                                stockMap.set(product.id, curStock - actualBookedQty);
                            }
                        }

                        await this.orderItemRepo.manager.update('SalesOrderItem', item.id, {
                            booking_status: 'CONFIRMED',
                            booking_expires_at: null,
                            booked_quantity: actualBookedQty // Lưu số lượng thực tế book được
                        });

                        confirmedCount++;
                    }
                }
            }
        }

        return { message: `Đã xác nhận ${confirmedCount} mục giữ chỗ.` };
    }

    // --- Lấy booking items kèm thông tin tồn kho cho BookingApprovalModal ---
    async getBookingItemsWithStock(planId: number) {
        const plan = await this.planRepo.findOne({
            where: { id: planId },
            relations: [
                'sales_orders', 'sales_orders.items', 'sales_orders.items.product',
                'sales_orders.items.product.components', 'sales_orders.items.product.components.child_product',
                'sales_orders.customer'
            ]
        });
        if (!plan) throw new NotFoundException('Kế hoạch không tồn tại');

        // Fetch real stock
        const allStocks = await this.inventoryService.getAllStocks();
        const stockMap = new Map<number, number>();
        for (const s of allStocks) {
            if (s.item_type === 'PRODUCT' && s.warehouse_code !== 'KHO_MAU') {
                const key = Number(s.item_id);
                stockMap.set(key, (stockMap.get(key) || 0) + Number(s.quantity));
            }
        }

        const extractedItems: any[] = [];
        for (const order of plan.sales_orders) {
            const customerName = order.customer_name || order.customer?.name || '';
            for (const item of order.items) {
                const product = item.product;
                const productType = product?.product_type || 'STANDARD';
                const realStock = product ? (stockMap.get(product.id) || 0) : 0;
                const approvedBooking = Number(product?.approved_booking_stock || 0);
                const bookingStockVal = Number(product?.booking_stock || 0);
                const availableStock = Math.max(0, realStock - approvedBooking);

                let comboComponents: any[] = [];
                let minRealStock = Infinity;
                let minApprovedBooking = Infinity;
                let minAvailableStock = Infinity;
                let minBookingStock = Infinity;

                if (productType === 'COMBO' && product?.components?.length > 0) {
                    comboComponents = product.components.map((c: any) => {
                        const childStock = c.child_product ? (stockMap.get(c.child_product.id) || 0) : 0;
                        const childApproved = Number(c.child_product?.approved_booking_stock || 0);
                        const childAvailable = Math.max(0, childStock - childApproved);
                        const childBooking = Number(c.child_product?.booking_stock || 0);
                        const reqQty = Number(c.quantity) || 1;

                        const possibleStock = Math.floor(childStock / reqQty);
                        const possibleApproved = Math.floor(childApproved / reqQty);
                        const possibleAvailable = Math.floor(childAvailable / reqQty);
                        const possibleBooking = Math.floor(childBooking / reqQty);

                        if (possibleStock < minRealStock) minRealStock = possibleStock;
                        if (possibleApproved < minApprovedBooking) minApprovedBooking = possibleApproved;
                        if (possibleAvailable < minAvailableStock) minAvailableStock = possibleAvailable;
                        if (possibleBooking < minBookingStock) minBookingStock = possibleBooking;

                        return {
                            sku: c.child_product?.sku || '',
                            name: c.child_product?.name || '',
                            quantity_per_combo: Number(c.quantity),
                            total_needed: Number(item.booked_quantity || item.quantity || 0) * Number(c.quantity),
                            real_stock: childStock,
                            approved_booking_stock: childApproved,
                            available_stock: childAvailable,
                        };
                    });
                }

                const finalRealStock = productType === 'COMBO' ? (minRealStock === Infinity ? 0 : minRealStock) : realStock;
                const finalApprovedBooking = productType === 'COMBO' ? (minApprovedBooking === Infinity ? 0 : minApprovedBooking) : approvedBooking;
                const finalAvailableStock = productType === 'COMBO' ? (minAvailableStock === Infinity ? 0 : minAvailableStock) : availableStock;
                const finalBookingStock = productType === 'COMBO' ? (minBookingStock === Infinity ? 0 : minBookingStock) : bookingStockVal;

                extractedItems.push({
                    ...item,
                    order_code: order.order_code,
                    customer_name: customerName,
                    sku: product?.sku || item.sku,
                    product_name: product?.name || '',
                    product_type: productType,
                    real_stock: finalRealStock,
                    approved_booking_stock: finalApprovedBooking,
                    booking_stock: finalBookingStock,
                    available_stock: finalAvailableStock,
                    combo_components: comboComponents.length > 0 ? comboComponents : undefined,
                });
            }
        }
        return { items: extractedItems, plan: { id: plan.id, name: plan.name || plan.code } };
    }

    // --- MỚI: Revert Booking (CONFIRMED → TEMPORARY) ---
    async revertBooking(itemId: number) {
        const item = await this.orderItemRepo.findOne({
            where: { id: itemId },
            relations: ['product', 'order', 'order.deliveries', 'order.deliveries.items']
        });
        if (!item) throw new NotFoundException('Booking item không tồn tại');
        if (item.booking_status !== BookingStatus.CONFIRMED) {
            throw new BadRequestException('Chỉ có thể revert booking đã duyệt (CONFIRMED)');
        }

        // Kiểm tra đã xuất kho chưa
        const deliveries = item.order?.deliveries || [];
        for (const delivery of deliveries) {
            if (delivery.status === 'SHIPPED') {
                const deliveredItem = delivery.items?.find((di: any) => di.sku === item.sku);
                if (deliveredItem && Number(deliveredItem.quantity) > 0) {
                    throw new BadRequestException(`Sản phẩm ${item.sku} đã xuất kho, không thể revert booking`);
                }
            }
        }

        // Trừ approved_booking_stock
        const product = item.product;
        if (product) {
            const bookedQty = Number(item.booked_quantity || 0);
            if (product.product_type === 'COMBO') {
                const components = await this.productsService.getComboComponents(product.sku);
                for (const comp of components) {
                    if (comp.child_product) {
                        const revertQty = bookedQty * Number(comp.quantity);
                        comp.child_product.approved_booking_stock = Math.max(0, Number(comp.child_product.approved_booking_stock || 0) - revertQty);
                        await this.productsService.update(comp.child_product.id, { approved_booking_stock: comp.child_product.approved_booking_stock } as any);
                    }
                }
            } else {
                product.approved_booking_stock = Math.max(0, Number(product.approved_booking_stock || 0) - bookedQty);
                await this.productsService.update(product.id, { approved_booking_stock: product.approved_booking_stock } as any);
            }
        }

        // Chuyển trạng thái về TEMPORARY với thời hạn 5 ngày mới
        const expires = new Date();
        expires.setDate(expires.getDate() + 5);
        item.booking_status = BookingStatus.TEMPORARY;
        item.booking_expires_at = expires;
        await this.orderItemRepo.save(item);

        return { message: `Đã chuyển booking ${item.sku} về trạng thái chờ duyệt` };
    }

    // --- MỚI: Thống kê bookings theo tháng/năm ---
    async getBookingStats(month?: string, year?: string) {
        const query = this.orderItemRepo.createQueryBuilder('item')
            .leftJoin('item.order', 'order')
            .leftJoin('item.product', 'product')
            .where('item.booking_status IN (:...statuses)', { statuses: [BookingStatus.TEMPORARY, BookingStatus.CONFIRMED] })
            .select([
                'product.sku AS sku',
                'item.booking_status AS status',
                'SUM(item.booked_quantity) AS total_quantity'
            ])
            .groupBy('product.sku, item.booking_status');

        if (month && year) {
            // Lọc theo delivery_date của order
            // MySQL/PostgreSQL support EXTRACT(MONTH FROM date) hoặc YEAR/MONTH function.
            // Để tương thích cao, truyền param dạng string YYYY-MM
            const monthStr = month.padStart(2, '0');
            const startDate = `${year}-${monthStr}-01`;
            const endDate = `${year}-${monthStr}-31`; // Simplified, PostgreSQL handles it if we use >= and <= 
            
            // Cách chuẩn: >= startDate AND < nextMonth
            const nextMonth = Number(month) === 12 ? 1 : Number(month) + 1;
            const nextYear = Number(month) === 12 ? Number(year) + 1 : Number(year);
            const nextMonthStr = String(nextMonth).padStart(2, '0');
            const nextMonthDate = `${nextYear}-${nextMonthStr}-01`;

            query.andWhere('order.delivery_date >= :startDate', { startDate })
                 .andWhere('order.delivery_date < :nextMonthDate', { nextMonthDate });
        } else if (year) {
            const startDate = `${year}-01-01`;
            const nextYearDate = `${Number(year) + 1}-01-01`;
            query.andWhere('order.delivery_date >= :startDate', { startDate })
                 .andWhere('order.delivery_date < :nextYearDate', { nextYearDate });
        }

        const rawData = await query.getRawMany();
        
        // Cần tính gộp cho Combo components
        const statsMap = new Map<string, { booked: number, approved: number }>();

        for (const row of rawData) {
            const sku = row.sku;
            if (!sku) continue;
            
            const qty = Number(row.total_quantity) || 0;
            const isApproved = row.status === BookingStatus.CONFIRMED;

            // Kiểm tra xem SKU này là STANDARD hay COMBO
            const product = await this.productsService.findOneBySku(sku);
            if (!product) continue;

            if (product.product_type === 'COMBO') {
                const components = await this.productsService.getComboComponents(sku);
                for (const comp of components) {
                    if (comp.child_product && comp.child_product.sku) {
                        const childSku = comp.child_product.sku;
                        const childQty = qty * Number(comp.quantity);
                        
                        const current = statsMap.get(childSku) || { booked: 0, approved: 0 };
                        if (isApproved) {
                            current.approved += childQty;
                        } else {
                            current.booked += childQty;
                        }
                        statsMap.set(childSku, current);
                    }
                }
            } else {
                const current = statsMap.get(sku) || { booked: 0, approved: 0 };
                if (isApproved) {
                    current.approved += qty;
                } else {
                    current.booked += qty;
                }
                statsMap.set(sku, current);
            }
        }

        const result = {};
        statsMap.forEach((value, key) => {
            result[key] = {
                booking_stock: value.booked,
                approved_booking_stock: value.approved
            };
        });
        return result;
    }

    // --- MỚI: Đồng bộ lại toàn bộ số lượng booking cho sản phẩm ---
    async syncBookingStock() {
        const stats = await this.getBookingStats();
        // Since productRepo is private in productsService, we use any to access it
        const productRepo = (this.productsService as any).productRepo;
        const allProducts = await productRepo.find();
        
        let updated = 0;
        for (const p of allProducts) {
            const stat = stats[p.sku] || { booking_stock: 0, approved_booking_stock: 0 };
            const bs = Number(stat.booking_stock) || 0;
            const abs = Number(stat.approved_booking_stock) || 0;
            
            if (p.booking_stock !== bs || p.approved_booking_stock !== abs) {
                p.booking_stock = bs;
                p.approved_booking_stock = abs;
                await productRepo.save(p);
                updated++;
            }
        }
        return { message: `Đã đồng bộ lại tồn kho booking cho ${updated} sản phẩm`, updated };
    }

    // --- MỚI: Lấy tất cả bookings ---
    async getAllBookings() {
        const items = await this.orderItemRepo.find({
            where: {
                booking_status: In([BookingStatus.TEMPORARY, BookingStatus.CONFIRMED])
            },
            relations: ['order', 'order.assigned_to', 'order.customer', 'order.production_plan', 'product']
        });

        // Fetch real stock
        const allStocks = await this.inventoryService.getAllStocks();
        const stockMap = new Map<number, number>();
        for (const s of allStocks) {
            if (s.item_type === 'PRODUCT' && s.warehouse_code !== 'KHO_MAU') {
                const key = Number(s.item_id);
                stockMap.set(key, (stockMap.get(key) || 0) + Number(s.quantity));
            }
        }

        const results = [];
        for (const item of items) {
            const product = item.product;
            let comboComponents: any[] = [];
            let minRealStock = Infinity;
            let minApprovedBooking = Infinity;
            let minAvailableStock = Infinity;
            let minBookingStock = Infinity;
            const realStock = product ? (stockMap.get(product.id) || 0) : 0;
            const approvedBooking = Number(product?.approved_booking_stock || 0);
            const bookingStockTotal = Number(product?.booking_stock || 0);
            const availableStock = Math.max(0, realStock - approvedBooking);

            if (product?.product_type === 'COMBO') {
                const components = await this.productsService.getComboComponents(product.sku);
                comboComponents = components.map(c => {
                    const childStock = c.child_product ? (stockMap.get(c.child_product.id) || 0) : 0;
                    const childApproved = Number(c.child_product?.approved_booking_stock || 0);
                    const childAvailable = Math.max(0, childStock - childApproved);
                    const childBooking = Number(c.child_product?.booking_stock || 0);
                    const reqQty = Number(c.quantity) || 1;

                    const possibleStock = Math.floor(childStock / reqQty);
                    const possibleApproved = Math.floor(childApproved / reqQty);
                    const possibleAvailable = Math.floor(childAvailable / reqQty);
                    const possibleBooking = Math.floor(childBooking / reqQty);

                    if (possibleStock < minRealStock) minRealStock = possibleStock;
                    if (possibleApproved < minApprovedBooking) minApprovedBooking = possibleApproved;
                    if (possibleAvailable < minAvailableStock) minAvailableStock = possibleAvailable;
                    if (possibleBooking < minBookingStock) minBookingStock = possibleBooking;

                    return {
                        sku: c.child_product?.sku || '',
                        name: c.child_product?.name || '',
                        quantity_per_combo: Number(c.quantity),
                        total_needed: Number(item.booked_quantity || 0) * Number(c.quantity),
                        real_stock: childStock,
                        approved_booking_stock: childApproved,
                        available_stock: childAvailable,
                    };
                });
            }

            const finalRealStock = product?.product_type === 'COMBO' ? (minRealStock === Infinity ? 0 : minRealStock) : realStock;
            const finalApprovedBooking = product?.product_type === 'COMBO' ? (minApprovedBooking === Infinity ? 0 : minApprovedBooking) : approvedBooking;
            const finalAvailableStock = product?.product_type === 'COMBO' ? (minAvailableStock === Infinity ? 0 : minAvailableStock) : availableStock;
            const finalBookingStock = product?.product_type === 'COMBO' ? (minBookingStock === Infinity ? 0 : minBookingStock) : bookingStockTotal;

            results.push({
                id: item.id,
                sku: item.sku,
                product_name: product?.name || '',
                product_type: product?.product_type || 'STANDARD',
                quantity: Number(item.quantity),
                booked_quantity: Number(item.booked_quantity || 0),
                booking_status: item.booking_status,
                booking_expires_at: item.booking_expires_at,
                order_code: item.order?.order_code || '',
                customer_name: item.order?.customer_name || item.order?.customer?.name || '',
                delivery_date: item.order?.delivery_date,
                assigned_to_name: item.order?.assigned_to?.full_name || '',
                plan_code: item.order?.production_plan?.code || '',
                order_id: item.order?.id,
                real_stock: finalRealStock,
                approved_booking_stock: finalApprovedBooking,
                booking_stock: finalBookingStock,
                available_stock: finalAvailableStock,
                combo_components: comboComponents.length > 0 ? comboComponents : undefined,
            });
        }
        return results;
    }

    // --- MỚI: Lấy bookings theo SKU ---
    async getBookingsBySku(sku: string) {
        const allBookings = await this.getAllBookings();
        const filtered = [];

        for (const item of allBookings) {
            if (item.sku === sku) {
                filtered.push(item);
            } else if (item.combo_components && item.combo_components.length > 0) {
                const comp = item.combo_components.find((c: any) => c.sku === sku);
                if (comp) {
                    filtered.push({
                        ...item,
                        sku: comp.sku, // Override SKU to show the child SKU
                        booked_quantity: (item.booked_quantity || 0) * comp.quantity_per_combo,
                        quantity: (item.quantity || 0) * comp.quantity_per_combo,
                    });
                }
            }
        }
        return filtered;
    }

    // --- MỚI: Dashboard Tổng hợp Nhu cầu NPL & Gia Công ---
    async getSummaryDashboard(query: any) {
        let { from_date, to_date, customers } = query;

        const qb = this.planRepo.createQueryBuilder('p')
            .leftJoinAndSelect('p.sales_orders', 'so')
            .leftJoinAndSelect('so.customer', 'c');

        if (from_date) {
            qb.andWhere('p.start_date >= :fromDate', { fromDate: from_date });
        }
        if (to_date) {
            qb.andWhere('p.start_date <= :toDate', { toDate: to_date });
        }
        
        // Cần lấy tất cả plan thỏa điều kiện thời gian trước, để lấy list KH
        const allPlansInRange = await qb.getMany();

        // Lấy danh sách khách hàng unique có trong khoảng thời gian này
        const customerSet = new Set<string>();
        for (const p of allPlansInRange) {
            if (p.sales_orders) {
                for (const so of p.sales_orders) {
                    const cName = so.customer_name || so.customer?.name;
                    if (cName) customerSet.add(cName);
                }
            }
        }
        const customer_list = Array.from(customerSet).sort();

        // Lọc theo khách hàng nếu có truyền lên
        let plansToProcess = allPlansInRange;
        if (customers) {
            const customerArr = customers.split(',').map((c: string) => c.trim());
            plansToProcess = allPlansInRange.filter(p => {
                if (!p.sales_orders) return false;
                return p.sales_orders.some(so => {
                    const cName = so.customer_name || so.customer?.name;
                    return cName && customerArr.includes(cName);
                });
            });
        }

        const plan_codes = plansToProcess.map(p => p.code);

        // Map để gộp dữ liệu MRP
        const mrpMap = new Map<number, any>();
        
        // Fetch tồn kho real-time cho NPL
        // Để không fetch n+1, ta sẽ thu thập tất cả material_ids trước
        const matIds = new Set<number>();
        plansToProcess.forEach(p => {
            if (p.mrp_data && Array.isArray(p.mrp_data)) {
                p.mrp_data.forEach(item => {
                    if (item.material_id) matIds.add(item.material_id);
                });
            }
        });

        const stockMap = new Map<number, number>();
        if (matIds.size > 0) {
            const mats = await this.materialsService.materialRepo.find({
                where: { id: In(Array.from(matIds)) },
                select: ['id', 'quantity_in_stock']
            });
            mats.forEach(m => stockMap.set(m.id, Number(m.quantity_in_stock || 0)));
        }

        // Gộp dữ liệu MRP
        for (const p of plansToProcess) {
            if (p.mrp_data && Array.isArray(p.mrp_data)) {
                for (const item of p.mrp_data) {
                    const matId = item.material_id;
                    if (!matId) continue;

                    if (!mrpMap.has(matId)) {
                        mrpMap.set(matId, {
                            material_id: item.material_id,
                            material_code: item.material_code,
                            material_name: item.material_name,
                            unit: item.unit,
                            supplier_name: item.supplier_name,
                            reference_price: Number(item.reference_price || 0),
                            wastage_percent: Number(item.wastage_percent || 0),
                            gross_requirement: 0,
                            gross_raw: 0,
                            details: []
                        });
                    }

                    const existing = mrpMap.get(matId);
                    existing.gross_requirement += Number(item.gross_requirement || 0);
                    existing.gross_raw += Number(item.gross_raw || 0);
                    // Cập nhật wastage_percent lớn nhất nếu khác nhau
                    if (Number(item.wastage_percent || 0) > existing.wastage_percent) {
                        existing.wastage_percent = Number(item.wastage_percent || 0);
                    }
                    if (item.details && Array.isArray(item.details)) {
                        existing.details.push(...item.details);
                    }
                }
            }
        }

        const mrp_summary = Array.from(mrpMap.values()).map(item => {
            const currentStock = stockMap.get(item.material_id) || 0;
            const net = Math.max(0, Math.ceil(item.gross_requirement - currentStock));
            
            // Gộp trùng sản phẩm trong details
            const detailMap = new Map<string, any>();
            item.details.forEach((d: any) => {
                const key = d.product_name;
                if (!detailMap.has(key)) {
                    detailMap.set(key, { ...d });
                } else {
                    const ed = detailMap.get(key);
                    ed.qty_needed += Number(d.qty_needed || 0);
                    ed.gross_req += Number(d.gross_req || 0);
                }
            });

            return {
                ...item,
                available_stock: currentStock,
                net_requirement: net,
                details: Array.from(detailMap.values())
            };
        });

        // Gộp dữ liệu Outsourcing
        const outsourcingMap = new Map<string, any>();
        for (const p of plansToProcess) {
            if (p.outsourcing_data && Array.isArray(p.outsourcing_data)) {
                for (const item of p.outsourcing_data) {
                    const key = `${item.product_sku}_${item.step_name}`;
                    if (!outsourcingMap.has(key)) {
                        outsourcingMap.set(key, {
                            product_sku: item.product_sku,
                            step_name: item.step_name,
                            supplier_name: item.supplier_name,
                            unit_price: Number(item.unit_price || 0),
                            quantity: 0,
                            total_cost: 0
                        });
                    }
                    const existing = outsourcingMap.get(key);
                    existing.quantity += Number(item.quantity || 0);
                    existing.total_cost += Number(item.total_cost || 0);
                }
            }
        }
        const outsourcing_summary = Array.from(outsourcingMap.values());

        return {
            customer_list,
            plan_codes,
            mrp_summary,
            outsourcing_summary
        };
    }
}