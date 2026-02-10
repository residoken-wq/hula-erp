import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProductionPlan, PlanStatus } from './production-plan.entity';
import { PurchaseOrder } from '../purchasing/entities/purchase-order.entity';

@Injectable()
export class GanttService {
    constructor(
        @InjectRepository(ProductionPlan) private planRepo: Repository<ProductionPlan>,
        @InjectRepository(PurchaseOrder) private poRepo: Repository<PurchaseOrder>,
    ) { }

    // --- Gantt Chart: Lấy các kế hoạch chưa hoàn thiện kèm công đoạn sản phẩm ---
    async getGanttData() {
        const plans = await this.planRepo.find({
            where: { status: In([PlanStatus.DRAFT, PlanStatus.CALCULATED]) },
            relations: [
                'sales_orders',
                'sales_orders.items',
                'sales_orders.items.product',
                'sales_orders.items.product.routings',
                'sales_orders.items.product.routings.process'
            ],
            order: { id: 'DESC' }
        });

        // Batch load POs for all plans
        const planIds = plans.map(p => p.id);
        let allPos: any[] = [];
        if (planIds.length > 0) {
            allPos = await this.poRepo.find({
                where: { plan_id: In(planIds) },
                relations: ['items'],
                select: ['id', 'plan_id', 'status', 'type']
            });
        }

        const now = new Date();

        return plans.map(plan => {
            // --- NPL Status ---
            const planPos = allPos.filter(po => po.plan_id === plan.id);
            const materialPos = planPos.filter(po => po.type === 'MATERIAL');
            const mrpItems = Array.isArray(plan.mrp_data) ? plan.mrp_data : [];
            const totalMaterials = mrpItems.filter((m: any) => (m.net_requirement || 0) > 0).length;

            const orderedMaterialIds = new Set<number>();
            for (const po of materialPos) {
                if (['ORDERED', 'CONFIRMED', 'DELIVERED', 'COMPLETED'].includes(po.status)) {
                    for (const item of (po.items || [])) {
                        if (item.material_id) orderedMaterialIds.add(item.material_id);
                    }
                }
            }
            const purchasedCount = mrpItems.filter((m: any) =>
                (m.net_requirement || 0) > 0 && orderedMaterialIds.has(m.material_id)
            ).length;

            let nplStatus: 'FULL' | 'PARTIAL' | 'NONE' = 'NONE';
            if (totalMaterials > 0 && purchasedCount >= totalMaterials) nplStatus = 'FULL';
            else if (purchasedCount > 0) nplStatus = 'PARTIAL';

            // --- Delivery Warnings ---
            const deliveryWarnings: any[] = [];
            for (const so of (plan.sales_orders || [])) {
                if (so.delivery_date) {
                    const deliveryDate = new Date(so.delivery_date);
                    const diffMs = deliveryDate.getTime() - now.getTime();
                    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                    if (daysLeft <= 7) {
                        deliveryWarnings.push({
                            order_code: so.order_code,
                            delivery_date: so.delivery_date,
                            days_left: daysLeft,
                            level: daysLeft <= 0 ? 'OVERDUE' : 'URGENT'
                        });
                    }
                }
            }

            // --- Products & Steps ---
            const productMap = new Map<string, { sku: string; product_name: string; steps: any[] }>();
            for (const so of (plan.sales_orders || [])) {
                for (const item of (so.items || [])) {
                    if (!item.product) continue;
                    const sku = item.sku || item.product.sku;
                    if (productMap.has(sku)) continue;

                    const config = plan.gantt_config?.[sku];

                    const steps = (item.product.routings || [])
                        .sort((a, b) => (a.step_order || 0) - (b.step_order || 0))
                        .map((r, idx) => {
                            const configStep = config?.steps?.find((cs: any) => cs.step_name === (r.step_name || r.process?.name));
                            return {
                                step_name: r.step_name || r.process?.name || 'N/A',
                                step_order: config?.step_order?.[idx] ?? r.step_order ?? idx,
                                process_code: r.process?.code || '',
                                supplier_name: r.supplier?.name || null,
                                start_date: configStep?.start_date || null,
                                end_date: configStep?.end_date || null
                            };
                        });

                    if (config?.step_order) {
                        steps.sort((a, b) => a.step_order - b.step_order);
                    }

                    productMap.set(sku, {
                        sku,
                        product_name: item.product.name || sku,
                        steps
                    });
                }
            }

            return {
                plan_id: plan.id,
                plan_code: plan.code,
                plan_name: plan.name,
                start_date: plan.start_date,
                end_date: plan.end_date,
                status: plan.status,
                products: Array.from(productMap.values()),
                npl_status: { total: totalMaterials, purchased: purchasedCount, status: nplStatus },
                delivery_warnings: deliveryWarnings
            };
        });
    }

    // --- Lưu cấu hình Gantt (step order + timing) ---
    async saveGanttConfig(planId: number, config: any) {
        const plan = await this.planRepo.findOneBy({ id: planId });
        if (!plan) throw new NotFoundException('Kế hoạch không tồn tại');
        plan.gantt_config = config;
        await this.planRepo.save(plan);
        return { message: 'Đã lưu cấu hình Gantt' };
    }
}
