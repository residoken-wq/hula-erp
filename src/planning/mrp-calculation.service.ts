import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProductionPlan, PlanStatus } from './production-plan.entity';
import { SalesOrder } from '../sales/sales-order.entity';
import { ProductsService } from '../products/products.service';
import { MaterialsService } from '../materials/materials.service';
import { PurchaseOrder, POStatus } from '../purchasing/entities/purchase-order.entity';

@Injectable()
export class MrpCalculationService {
    constructor(
        @InjectRepository(ProductionPlan) private planRepo: Repository<ProductionPlan>,
        @InjectRepository(SalesOrder) private orderRepo: Repository<SalesOrder>,
        @InjectRepository(PurchaseOrder) private poRepo: Repository<PurchaseOrder>,
        private productsService: ProductsService,
        private materialsService: MaterialsService,
    ) { }

    // --- LOGIC PHÂN TÍCH KẾ HOẠCH (MRP & GIA CÔNG) ---
    async calculateMaterialNeeds(planId: number) {
        const plan = await this.planRepo.findOne({
            where: { id: planId },
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
        if (!plan) throw new NotFoundException();

        // 1. Kiểm tra xem đã có kết quả đã lưu chưa
        if (plan.mrp_data && plan.outsourcing_data) {
            // --- FIX: Update Real-time Stock for Display ---
            if (Array.isArray(plan.mrp_data)) {
                const matIds = plan.mrp_data.map((i: any) => i.material_id).filter(id => !!id);
                if (matIds.length > 0) {
                    const mats = await this.materialsService.materialRepo.find({
                        where: { id: In(matIds) },
                        select: ['id', 'quantity_in_stock']
                    });
                    const stockMap = new Map(mats.map(m => [m.id, Number(m.quantity_in_stock)]));

                    plan.mrp_data = plan.mrp_data.map((item: any) => {
                        if (item.material_id && stockMap.has(item.material_id)) {
                            const currentStock = stockMap.get(item.material_id);
                            item.available_stock = currentStock;
                            const gross = Number(item.gross_requirement) || 0;
                            item.net_requirement = Math.max(0, gross - currentStock);
                        }
                        return item;
                    });
                }
            }

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

        const productDemand = new Map<string, number>();
        const productInfoMap = new Map<string, number>();
        const productStockMap = new Map<string, number>();

        // 1. Tổng hợp nhu cầu sản phẩm (chỉ tính các item chưa được duyệt booking)
        for (const so of plan.sales_orders) {
            for (const item of so.items) {
                // Bỏ qua sản phẩm đã được duyệt booking (CONFIRMED) — kho đã giữ hàng
                if (item.booking_status === 'CONFIRMED') continue;

                productDemand.set(item.sku, (productDemand.get(item.sku) || 0) + Number(item.quantity));
                if (!productInfoMap.has(item.sku)) {
                    const prod = await this.productsService.findOneBySku(item.sku);
                    if (prod) {
                        productInfoMap.set(item.sku, prod.id);
                        const available = Number(prod.quantity_in_stock || 0) - Number(prod.approved_booking_stock || 0);
                        productStockMap.set(item.sku, Math.max(0, available));
                    }
                }
            }
        }

        const materialDemand = new Map<number, number>();
        const materialDemandRaw = new Map<number, number>();
        const materialWastageMap = new Map<number, number>();
        const outsourcingDemand = [];

        // 2. Phân tích BOM & ROUTING — Phân giải Combos (BOM đa cấp)
        const totalProductDemand = new Map<string, number>();
        const processingQueue = [];

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

            if (!productInfoMap.has(sku)) {
                const prod = await this.productsService.findOneBySku(sku);
                if (prod) {
                    productInfoMap.set(sku, prod.id);
                    const available = Number(prod.quantity_in_stock || 0) - Number(prod.approved_booking_stock || 0);
                    productStockMap.set(sku, Math.max(0, available));
                } else {
                    productStockMap.set(sku, 0);
                }
            }

            // Deduct from stock
            let currentStock = productStockMap.get(sku) || 0;
            let netQty = qty;

            if (currentStock > 0) {
                 if (currentStock >= netQty) {
                      productStockMap.set(sku, currentStock - netQty);
                      netQty = 0;
                 } else {
                      productStockMap.set(sku, 0);
                      netQty = netQty - currentStock;
                 }
            }

            if (netQty <= 0) {
                continue; // Stock covers it, no need to explode BOM
            }

            totalProductDemand.set(sku, (totalProductDemand.get(sku) || 0) + netQty);

            const components = await this.productsService.getComboComponents(sku);
            if (components && components.length > 0) {
                for (const comp of components) {
                    if (comp.child_product) {
                        const childQty = netQty * Number(comp.quantity);
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

                    const currentWastage = materialWastageMap.get(bom.material_id) || 0;
                    if (wastage > currentWastage) materialWastageMap.set(bom.material_id, wastage);
                }
            }

            // B. Tính Gia Công (Routing)
            const routings = await this.productsService.getRoutings(prodId);
            for (const route of routings) {
                if (route.supplier_id) {
                    outsourcingDemand.push({
                        product_id: prodId,
                        product_sku: sku,
                        step_name: route.step_name,
                        supplier_id: route.supplier_id,
                        supplier_name: route.supplier?.name,
                        quantity: qty,
                        unit_price: Number(route.cost),
                        total_cost: qty * Number(route.cost)
                    });
                }
            }
        }

        // 3. Kết quả MRP (NPL)
        const mrpResult = [];

        // Lấy giá mua thực tế từ các PO đã tạo cho Plan này
        const existingPos = await this.poRepo.find({ where: { plan_id: planId }, relations: ['items'] });
        const purchasePriceMap = new Map<number, number>();
        for (const po of existingPos) {
            for (const item of po.items) {
                if (item.material_id) {
                    purchasePriceMap.set(item.material_id, Number(item.unit_price));
                }
            }
        }

        for (const [matId, gross] of materialDemand.entries()) {
            const mat = await this.materialsService.materialRepo.findOne({
                where: { id: matId },
                relations: ['supplier_prices', 'supplier_prices.supplier']
            });

            if (mat) {
                const net = Math.max(0, Math.ceil(gross - Number(mat.quantity_in_stock)));

                let selectedSupplier = mat.supplier_name;
                let selectedCost = Number(mat.cost_per_unit);

                // Lọc các giá hợp lệ (còn hiệu lực)
                const now = new Date();
                const validPrices = mat.supplier_prices?.filter(sp => {
                    if (sp.valid_to) {
                        const validToDate = new Date(sp.valid_to);
                        validToDate.setHours(23, 59, 59, 999);
                        if (validToDate < now) return false;
                    }
                    return true;
                }) || [];

                // Danh sách NCC khả dĩ để FE lookup giá
                const possibleSuppliers = validPrices.map(sp => ({
                    supplier_name: sp.supplier?.name,
                    price: Number(sp.price),
                    is_preferred: sp.is_preferred
                }));

                if (validPrices.length > 0) {
                    const sortedPrices = validPrices.sort((a, b) => {
                        const priceA = Number(a.price || 0);
                        const priceB = Number(b.price || 0);
                        if (priceA > 0 && priceB <= 0) return -1;
                        if (priceA <= 0 && priceB > 0) return 1;
                        if (a.is_preferred && !b.is_preferred) return -1;
                        if (!a.is_preferred && b.is_preferred) return 1;
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
                    reference_price: selectedCost,
                    purchase_price: purchasePriceMap.get(mat.id) || 0,
                    possible_suppliers: possibleSuppliers,
                    note: '',
                    wastage_percent: materialWastageMap.get(mat.id) || 0,
                    gross_raw: Math.ceil(materialDemandRaw.get(mat.id) || 0)
                });
            }
        }

        const outsourcingResult = outsourcingDemand;

        // 5. Kết quả Logistics
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
        plan.mrp_data = mrpResult;
        plan.outsourcing_data = outsourcingResult;
        plan.logistics_data = logisticsResult;
        await this.planRepo.save(plan);

        return {
            plan_info: plan,
            mrp_result: mrpResult,
            outsourcing_result: outsourcingResult,
            logistics_result: logisticsResult,
            gantt_data: ganttData
        };
    }

    async syncPoPrices(planId: number) {
        const plan = await this.planRepo.findOne({ where: { id: planId } });
        if (!plan) return;

        const pos = await this.poRepo.find({
            where: {
                plan_id: planId,
                status: In([POStatus.CONFIRMED, POStatus.COMPLETED, 'ORDERED' as POStatus])
            },
            relations: ['items']
        });

        const priceMap = new Map<number, number>();
        const outsourcePriceMap = new Map<string, number>();

        for (const po of pos) {
            for (const item of po.items) {
                if (item.material_id) {
                    priceMap.set(item.material_id, Number(item.unit_price));
                } else {
                    outsourcePriceMap.set(item.description, Number(item.unit_price));
                }
            }
        }

        let changed = false;
        if (plan.mrp_result && Array.isArray(plan.mrp_result)) {
            plan.mrp_result = plan.mrp_result.map((item: any) => {
                if (item.material_id && priceMap.has(item.material_id)) {
                    const newPrice = priceMap.get(item.material_id);
                    if (item.purchase_price !== newPrice) {
                        changed = true;
                        return { ...item, purchase_price: newPrice };
                    }
                }
                return item;
            });
        }

        if (plan.outsourcing_result && Array.isArray(plan.outsourcing_result)) {
            plan.outsourcing_result = plan.outsourcing_result.map((item: any) => {
                const desc = `${item.step_name} (${item.product_sku})`;
                if (outsourcePriceMap.has(desc)) {
                    const newPrice = outsourcePriceMap.get(desc);
                    if (item.unit_price !== newPrice) {
                        changed = true;
                        return { ...item, unit_price: newPrice, total_cost: Number(item.quantity) * Number(newPrice) };
                    }
                }
                return item;
            });
        }

        if (changed) {
            await this.planRepo.save(plan);
        }
    }
}
