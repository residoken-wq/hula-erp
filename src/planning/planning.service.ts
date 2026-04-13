import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { ProductionPlan, PlanStatus } from './production-plan.entity';
import { SalesOrder, SalesOrderStatus } from '../sales/sales-order.entity';
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

        stocks.forEach(s => {
            if (s.item_type === 'PRODUCT' && s.warehouse_code === 'KHO_TP') {
                const key = String(s.item_id);
                stockMap.set(key, (stockMap.get(key) || 0) + Number(s.quantity));
            }
        });

        return orders.map(o => {
            let canFulfill = true;
            let totalItems = 0;

            const enrichedItems = o.items.map(item => {
                let stock = 0;
                if (item.product) {
                    stock = stockMap.get(String(item.product.id)) || 0;
                }
                totalItems++;
                if (stock < Number(item.quantity)) canFulfill = false;
                return { ...item, available_stock_tp: stock };
            });

            if (!o.customer_name && o.customer) {
                o.customer_name = o.customer.name;
            }
            return { ...o, items: enrichedItems, can_fulfill_stock: (totalItems > 0 && canFulfill) };
        });
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
        return { message: `Đã tạo ${createdPos.length} Đơn đặt hàng`, pos: createdPos };
    }

    async findAll() { return this.planRepo.find({ order: { id: 'DESC' }, relations: ['sales_orders'] }); }

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

        // Validate transition
        const validTransitions: Record<string, string[]> = {
            'DRAFT': ['CALCULATED'],
            'CALCULATED': ['IN_PRODUCTION', 'DRAFT'],
            'IN_PRODUCTION': ['COMPLETED', 'CALCULATED'],
            'COMPLETED': ['IN_PRODUCTION'] // Cho phép reopen
        };

        const allowed = validTransitions[plan.status] || [];
        if (!allowed.includes(status)) {
            throw new BadRequestException(`Không thể chuyển từ ${plan.status} sang ${status}`);
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
}