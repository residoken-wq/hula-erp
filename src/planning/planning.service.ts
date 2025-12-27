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

        // 1. Kiểm tra xem đã có kết quả đã lưu chưa, nếu có thì trả về kết quả đã lưu (Để user có thể "Save" -> "Mở lại vẫn thấy")
        // Nếu user muốn chạy lại thì sẽ có nút "Phân tích lại" (Gọi endpoint reset hoặc truyền flag force)
        // Hiện tại: Nếu đã có dữ liệu saved thì trả về.
        if (plan.mrp_data && plan.outsourcing_data) {
            const ganttData = plan.sales_orders.map(so => ({
                id: so.order_code, name: `SX ${so.order_code}`, start: plan.start_date, end: so.delivery_date || plan.end_date, progress: 0
            }));

            return {
                plan_info: plan,
                mrp_result: plan.mrp_data,
                outsourcing_result: plan.outsourcing_data,
                logistics_result: plan.logistics_data || [],
                gantt_data: ganttData,
                is_saved: true
            };
        }

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
        const materialDemandRaw = new Map<number, number>(); // Nhu cầu gốc (Chưa hao hụt)
        const materialWastageMap = new Map<number, number>(); // Lưu % hao hụt lớn nhất tìm thấy

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
                    const rawReq = qty * Number(bom.quantity);
                    const wastage = Number(bom.waste_percent) || 0;
                    const req = rawReq * (1 + wastage / 100);

                    materialDemand.set(bom.material_id, (materialDemand.get(bom.material_id) || 0) + req);
                    materialDemandRaw.set(bom.material_id, (materialDemandRaw.get(bom.material_id) || 0) + rawReq);

                    // Lưu % hao hụt (Ưu tiên lấy max nếu có nhiều)
                    const currentWastage = materialWastageMap.get(bom.material_id) || 0;
                    if (wastage > currentWastage) materialWastageMap.set(bom.material_id, wastage);
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

        // --- MỚI: Lấy giá mua thực tế từ các PO đã tạo cho Plan này ---
        const existingPos = await this.poRepo.find({ where: { plan_id: planId }, relations: ['items'] });
        const purchasePriceMap = new Map<number, number>(); // MaterialID -> Price
        for (const po of existingPos) {
            for (const item of po.items) {
                if (item.material_id) {
                    purchasePriceMap.set(item.material_id, Number(item.unit_price));
                }
            }
        }
        // -------------------------------------------------------------

        for (const [matId, gross] of materialDemand.entries()) {
            const mat = await this.materialsService.materialRepo.findOne({
                where: { id: matId },
                relations: ['supplier_prices', 'supplier_prices.supplier']
            });

            if (mat) {
                const net = Math.max(0, Math.ceil(gross - Number(mat.quantity_in_stock)));

                // Logic chọn Supplier mặc định (Ưu tiên is_preferred = true)
                let selectedSupplier = mat.supplier_name;
                let selectedCost = Number(mat.cost_per_unit);

                // --- MỚI: Lọc các giá hợp lệ (còn hiệu lực) ---
                const now = new Date();
                const validPrices = mat.supplier_prices?.filter(sp => {
                    if (sp.valid_to) {
                        const validToDate = new Date(sp.valid_to);
                        // Set thời gian là cuối ngày (23:59:59) để tính bao gồm cả ngày hết hạn
                        validToDate.setHours(23, 59, 59, 999);
                        if (validToDate < now) return false;
                    }
                    return true;
                }) || [];

                // --- MỚI: Danh sách NCC khả dĩ để FE lookup giá ---
                const possibleSuppliers = validPrices.map(sp => ({
                    supplier_name: sp.supplier?.name,
                    price: Number(sp.price),
                    is_preferred: sp.is_preferred
                }));
                // ------------------------------------------------

                if (validPrices.length > 0) {
                    // Sắp xếp: Có giá > 0 lên đầu, sau đó đến Preferred, sau đó đến Giá thấp nhất
                    const sortedPrices = validPrices.sort((a, b) => {
                        const priceA = Number(a.price || 0);
                        const priceB = Number(b.price || 0);

                        // 1. Ưu tiên có giá > 0
                        if (priceA > 0 && priceB <= 0) return -1;
                        if (priceA <= 0 && priceB > 0) return 1;

                        // 2. Nếu cùng có giá (hoặc cùng không), ưu tiên Preferred
                        if (a.is_preferred && !b.is_preferred) return -1;
                        if (!a.is_preferred && b.is_preferred) return 1;

                        // 3. Giá thấp nhất
                        return priceA - priceB;
                    });

                    const bestOption = sortedPrices[0];
                    if (bestOption && bestOption.supplier) {
                        selectedSupplier = bestOption.supplier.name;
                        selectedCost = Number(bestOption.price);
                    }
                }

                mrpResult.push({
                    material_id: mat.id,
                    material_code: mat.code,
                    material_name: mat.name,
                    supplier_name: selectedSupplier,
                    gross_requirement: Math.ceil(gross),
                    available_stock: Number(mat.quantity_in_stock),
                    net_requirement: net,
                    unit: mat.unit,
                    reference_price: selectedCost, // Đã đổi tên từ cost -> reference_price
                    purchase_price: purchasePriceMap.get(mat.id) || 0, // --- MỚI: Giá mua từ PO ---
                    possible_suppliers: possibleSuppliers, // --- MỚI: Danh sách giá ---

                    note: '',
                    wastage_percent: materialWastageMap.get(mat.id) || 0,
                    gross_raw: Math.ceil(materialDemandRaw.get(mat.id) || 0)
                });
            }
        }

        // 4. Kết quả Outsourcing (Gia công) - Gom nhóm theo NCC và Công đoạn (Optional)
        // Ở đây ta trả về list raw để FE hiển thị, gom nhóm khi tạo PO
        const outsourcingResult = outsourcingDemand;

        // 5. Kết quả Logistics (Vận chuyển & Chi phí khác) --- MỚI ---
        // Tổng hợp từ ProductLogistics của tất cả sản phẩm trong đơn hàng
        const logisticsResult = [];
        for (const [sku, qty] of totalProductDemand.entries()) {
            const prodId = productInfoMap.get(sku);
            if (prodId) {
                const logs = await this.productsService.getLogistics(prodId);
                for (const l of logs) {
                    logisticsResult.push({
                        product_sku: sku,
                        name: l.name,
                        cost: Number(l.cost),
                        quantity: qty,
                        total_cost: Number(l.cost) * qty,
                        note: l.note
                    });
                }
            }
        }

        const ganttData = plan.sales_orders.map(so => ({
            id: so.order_code, name: `SX ${so.order_code}`, start: plan.start_date, end: so.delivery_date || plan.end_date, progress: 0
        }));

        plan.status = PlanStatus.CALCULATED;

        // --- NEW: Lưu kết quả phân tích vào DB lần đầu ---
        plan.mrp_data = mrpResult;
        plan.outsourcing_data = outsourcingResult;
        plan.logistics_data = logisticsResult;
        // ------------------------------------------------

        await this.planRepo.save(plan);

        return {
            plan_info: plan,
            mrp_result: mrpResult,
            outsourcing_result: outsourcingResult,
            logistics_result: logisticsResult,
            gantt_data: ganttData
        };
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
                    plan_id: planId // --- MỚI: Link item to Plan ---
                } as any) as unknown as PurchaseOrderItem;
            });

            po.total_amount = total;
            await this.poRepo.save(po);
            createdPos.push(po.po_code);
        }
        return { message: `Đã tạo ${createdPos.length} Đơn đặt hàng`, pos: createdPos };
    }

    async findAll() { return this.planRepo.find({ order: { id: 'DESC' }, relations: ['sales_orders'] }); }

    async deletePlan(id: number) {
        // 1. Check if plan exists
        const plan = await this.planRepo.findOne({ where: { id }, relations: ['sales_orders'] });
        if (!plan) throw new NotFoundException('Kế hoạch không tồn tại');

        // 2. Check if any PO created
        const existingPos = await this.poRepo.count({ where: { plan_id: id } });
        if (existingPos > 0) {
            throw new BadRequestException('Không thể xóa kế hoạch đã tạo Đơn mua hàng (PO)');
        }

        // 3. Reset Sales Orders status (optional but recommended)
        if (plan.sales_orders && plan.sales_orders.length > 0) {
            await this.orderRepo.update({ production_plan: { id } }, { production_plan: null });
        }

        // 4. Delete
        await this.planRepo.remove(plan);
        return { message: 'Đã xóa kế hoạch sản xuất' };
    }
}