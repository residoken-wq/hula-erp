import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { ProductionPlan, PlanStatus } from './production-plan.entity';
import { SalesOrder, SalesOrderStatus } from '../sales/sales-order.entity';
import { ProductsService } from '../products/products.service';
import { MaterialsService } from '../materials/materials.service';
import { PurchaseOrder, POType, POStatus } from '../purchasing/entities/purchase-order.entity';
import { PurchaseOrderItem } from '../purchasing/entities/purchase-order-item.entity';

@Injectable()
export class PlanningService {
    constructor(
        @InjectRepository(ProductionPlan) private planRepo: Repository<ProductionPlan>,
        @InjectRepository(SalesOrder) private orderRepo: Repository<SalesOrder>,
        @InjectRepository(PurchaseOrder) private poRepo: Repository<PurchaseOrder>,
        @InjectRepository(PurchaseOrderItem) private poItemRepo: Repository<PurchaseOrderItem>,
        private productsService: ProductsService,
        private materialsService: MaterialsService,
    ) { }

    async getSuggestion() {
        const orders = await this.orderRepo.find({
            where: {
                status: In([SalesOrderStatus.SO_PENDING, SalesOrderStatus.SAMPLE_APPROVED, SalesOrderStatus.DEPOSITED]),
                plan_id: IsNull()
            },
            relations: ['customer'],
            order: { delivery_date: 'ASC' }
        });

        return orders.map(o => {
            if (!o.customer_name && o.customer) {
                o.customer_name = o.customer.name;
            }
            return o;
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

    // --- LOGIC PHÂN TÍCH KẾ HOẠCH (MRP & GIA CÔNG) ---
    async calculateMaterialNeeds(planId: number) {
        const plan = await this.planRepo.findOne({ where: { id: planId }, relations: ['sales_orders', 'sales_orders.items'] });
        if (!plan) throw new NotFoundException();

        const productDemand = new Map<string, number>(); // SKU -> Quantity
        const productInfoMap = new Map<string, number>(); // SKU -> ProductID

        // 1. Tổng hợp nhu cầu sản phẩm
        for (const so of plan.sales_orders) {
            for (const item of so.items) {
                productDemand.set(item.sku, (productDemand.get(item.sku) || 0) + Number(item.quantity));

                // Cache Product ID để query Routing sau này
                if (!productInfoMap.has(item.sku)) {
                    const prod = await this.productsService.findOneBySku(item.sku);
                    if (prod) productInfoMap.set(item.sku, prod.id);
                }
            }
        }

        const materialDemand = new Map<number, number>();
        const outsourcingDemand = []; // --- MỚI: Danh sách nhu cầu gia công

        // 2. Phân tích BOM & ROUTING
        // --- FIX: Phân giải Combos (BOM đa cấp cho Product Components) ---
        const totalProductDemand = new Map<string, number>(); // SKU -> Qty (Bao gồm cả Parent và Child)
        const processingQueue = [];

        // Init queue
        for (const [sku, qty] of productDemand.entries()) {
            processingQueue.push({ sku, qty });
        }

        let safetyCounter = 0;
        const MAX_ITERATIONS = 20000;

        while (processingQueue.length > 0) {
            if (safetyCounter++ > MAX_ITERATIONS) {
                console.warn('MRP Loop Limit Reached - Possible Cycle in Product Components');
                break;
            }

            const { sku, qty } = processingQueue.shift();

            // Cộng dồn nhu cầu cho SKU này
            totalProductDemand.set(sku, (totalProductDemand.get(sku) || 0) + qty);

            // Đảm bảo có ID để query Routing
            if (!productInfoMap.has(sku)) {
                const prod = await this.productsService.findOneBySku(sku);
                if (prod) productInfoMap.set(sku, prod.id);
            }

            // Kiểm tra xem có phải Combo không (có components con)
            // Lưu ý: getComboComponents trả về components mà parent là SKU này
            const components = await this.productsService.getComboComponents(sku);

            if (components && components.length > 0) {
                for (const comp of components) {
                    if (comp.child_product) {
                        const childQty = qty * Number(comp.quantity);
                        processingQueue.push({ sku: comp.child_product.sku, qty: childQty });
                    }
                }
            }
        }

        // --- Loop qua danh sách đã mở rộng ---
        for (const [sku, qty] of totalProductDemand.entries()) {
            const prodId = productInfoMap.get(sku);
            if (!prodId) continue;

            // A. Tính NPL (BOM)
            const boms = await this.productsService.getBomByProductSku(sku);
            for (const bom of boms) {
                if (bom.material_id) {
                    const req = qty * Number(bom.quantity) * (1 + Number(bom.waste_percent) / 100);
                    materialDemand.set(bom.material_id, (materialDemand.get(bom.material_id) || 0) + req);
                }
            }

            // B. Tính Gia Công (Routing) --- MỚI ---
            const routings = await this.productsService.getRoutings(prodId);
            for (const route of routings) {
                // Chỉ lấy các công đoạn có gán Nhà cung cấp (Gia công ngoài)
                if (route.supplier_id) {
                    outsourcingDemand.push({
                        product_sku: sku,
                        step_name: route.step_name,
                        supplier_id: route.supplier_id,
                        supplier_name: route.supplier?.name, // Cần relation trong service getRoutings
                        quantity: qty,
                        unit_price: Number(route.cost),
                        total_cost: qty * Number(route.cost)
                    });
                }
            }
        }

        // 3. Kết quả MRP (NPL)
        const mrpResult = [];
        for (const [matId, gross] of materialDemand.entries()) {
            const mat = await this.materialsService.materialRepo.findOne({ where: { id: matId } });
            if (mat) {
                const net = Math.max(0, Math.ceil(gross - Number(mat.quantity_in_stock)));
                mrpResult.push({
                    material_id: mat.id,
                    material_code: mat.code,
                    material_name: mat.name,
                    supplier_name: mat.supplier_name,
                    gross_requirement: Math.ceil(gross),
                    available_stock: Number(mat.quantity_in_stock),
                    net_requirement: net,
                    unit: mat.unit,
                    cost: mat.cost_per_unit,
                    note: '' // Placeholder cho FE nhập
                });
            }
        }

        // 4. Kết quả Outsourcing (Gia công) - Gom nhóm theo NCC và Công đoạn (Optional)
        // Ở đây ta trả về list raw để FE hiển thị, gom nhóm khi tạo PO
        const outsourcingResult = outsourcingDemand;

        const ganttData = plan.sales_orders.map(so => ({
            id: so.order_code, name: `SX ${so.order_code}`, start: plan.start_date, end: so.delivery_date || plan.end_date, progress: 0
        }));

        plan.status = PlanStatus.CALCULATED;
        await this.planRepo.save(plan);

        return {
            plan_info: plan,
            mrp_result: mrpResult,
            outsourcing_result: outsourcingResult, // <--- Trả về dữ liệu gia công
            gantt_data: ganttData
        };
    }

    // --- HÀM TẠO PO (Dùng chung cho NPL và Gia Công) ---
    async generatePos(planId: number, data: any[]) {
        // data: mảng các item (NPL hoặc Dịch vụ) kèm theo field 'note' từ Frontend
        const supplierGroups = {};

        for (const item of data) {
            // Logic lọc: Với NPL là net > 0, với Gia công thì luôn tạo (quantity > 0)
            const qty = item.net_requirement !== undefined ? item.net_requirement : item.quantity;

            if (qty > 0) {
                const suppName = item.supplier_name || 'Unknown';
                if (!supplierGroups[suppName]) supplierGroups[suppName] = [];
                supplierGroups[suppName].push({ ...item, qtyToBuy: qty });
            }
        }

        const createdPos = [];
        for (const [suppName, items] of Object.entries(supplierGroups)) {
            // Xác định loại PO dựa trên item đầu tiên (có material_id => NPL, không => Gia công)
            const isMaterial = (items as any)[0].material_id !== undefined;

            const po = this.poRepo.create({
                po_code: `PO-${isMaterial ? 'NPL' : 'GC'}-${planId}-${Math.floor(Math.random() * 1000)}`,
                type: isMaterial ? POType.MATERIAL : 'OUTSOURCING' as any, // Giả sử có type OUTSOURCING hoặc dùng SERVICE
                plan_id: planId,
                status: POStatus.DRAFT,
                note: `Tự động từ Kế hoạch ${planId}. NCC: ${suppName}`
            });

            let total = 0;

            po.items = (items as any[]).map(i => {
                const price = isMaterial ? i.cost : i.unit_price;
                const sub = i.qtyToBuy * price;
                total += sub;

                // Ghép ghi chú từ FE vào mô tả item hoặc PO
                const desc = isMaterial
                    ? i.material_name
                    : `${i.step_name} (${i.product_sku})`;

                return this.poItemRepo.create({
                    material_id: isMaterial ? i.material_id : null,
                    description: desc,
                    quantity: i.qtyToBuy,
                    unit_price: price,
                    subtotal: sub,
                    note: i.note // <--- Lưu ghi chú dòng
                } as any) as unknown as PurchaseOrderItem;
            });

            po.total_amount = total;
            await this.poRepo.save(po);
            createdPos.push(po.po_code);
        }
        return { message: `Đã tạo ${createdPos.length} Đơn đặt hàng`, pos: createdPos };
    }

    async findAll() { return this.planRepo.find({ order: { id: 'DESC' }, relations: ['sales_orders'] }); }
}