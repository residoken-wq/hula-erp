import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThanOrEqual } from 'typeorm';
import { ProductionPlan, PlanStatus } from './production-plan.entity';
import { SalesOrder, SalesOrderStatus } from '../sales/sales-order.entity';
import { ProductsService } from '../products/products.service';
import { MaterialsService } from '../materials/materials.service';

@Injectable()
export class PlanningService {
  constructor(
    @InjectRepository(ProductionPlan) private planRepo: Repository<ProductionPlan>,
    @InjectRepository(SalesOrder) private orderRepo: Repository<SalesOrder>,
    private productsService: ProductsService,
    private materialsService: MaterialsService,
  ) {}

  // 1. Gợi ý lập kế hoạch (Các đơn đã cọc, sắp đến hạn giao)
  async getSuggestion() {
      // Lấy các đơn DEPOSITED chưa có Plan
      const orders = await this.orderRepo.find({ 
          where: { 
              status: SalesOrderStatus.DEPOSITED, 
              plan_id: null 
          },
          order: { delivery_date: 'ASC' } // Ưu tiên giao sớm
      });
      return orders;
  }

  // 2. Tạo Kế hoạch SX
  async createPlan(data: any) {
    const orders = await this.orderRepo.find({ where: { order_code: In(data.orderCodes) } });
    if (orders.length !== data.orderCodes.length) throw new NotFoundException('Lỗi đơn hàng');

    const plan = this.planRepo.create({
        code: data.code,
        name: data.name,
        start_date: data.start_date,
        end_date: data.end_date,
        status: PlanStatus.DRAFT
    });
    const savedPlan = await this.planRepo.save(plan);

    // Update Sales Order -> PLANNED
    await this.orderRepo.update(
        { id: In(orders.map(o => o.id)) }, 
        { plan_id: savedPlan.id, status: SalesOrderStatus.PLANNED }
    );
    return savedPlan;
  }

  // 3. MRP & Gantt Data
  async calculateMaterialNeeds(planId: number) {
    const plan = await this.planRepo.findOne({ 
        where: { id: planId }, 
        relations: ['sales_orders', 'sales_orders.items'] 
    });
    if (!plan) throw new NotFoundException('Kế hoạch không tồn tại');

    // TÍNH TOÁN NPL
    const productDemand = new Map<string, number>();
    for (const so of plan.sales_orders) {
        for (const item of so.items) {
            const currentQty = productDemand.get(item.sku) || 0;
            productDemand.set(item.sku, currentQty + Number(item.quantity));
        }
    }

    const materialDemand = new Map<number, number>();
    for (const [sku, qty] of productDemand.entries()) {
        const boms = await this.productsService.getBomByProductSku(sku);
        for (const bomItem of boms) {
            if (bomItem.material_id) {
                const waste = Number(bomItem.waste_percent) / 100;
                const required = qty * Number(bomItem.quantity) * (1 + waste);
                const currentMatQty = materialDemand.get(bomItem.material_id) || 0;
                materialDemand.set(bomItem.material_id, currentMatQty + required);
            }
        }
    }

    const mrpResult = [];
    for (const [matId, grossQty] of materialDemand.entries()) {
        const material = await this.materialsService.materialRepo.findOne({ where: { id: matId } });
        if (material) {
            const stock = Number(material.quantity_in_stock) || 0;
            const netQty = grossQty - stock;
            mrpResult.push({
                material_code: material.code,
                material_name: material.name,
                unit: material.unit,
                gross_requirement: Math.ceil(grossQty),
                available_stock: stock,
                net_requirement: netQty > 0 ? Math.ceil(netQty) : 0,
                status: netQty > 0 ? 'THIẾU' : 'ĐỦ'
            });
        }
    }

    // DỮ LIỆU GANTT (Giả lập tiến độ dựa trên ngày giao hàng)
    // Mỗi Sales Order là 1 thanh Gantt
    const ganttData = plan.sales_orders.map(so => ({
        id: so.order_code,
        name: `SX Đơn ${so.order_code} (${so.customer_name})`,
        start: plan.start_date, // Ngày bắt đầu kế hoạch
        end: so.delivery_date || plan.end_date, // Ngày giao hàng
        progress: 0, // Tiến độ thực tế (sau này lấy từ WorkOrder)
        dependencies: []
    }));

    plan.status = PlanStatus.CALCULATED;
    await this.planRepo.save(plan);

    return {
        plan_info: { id: plan.id, name: plan.name, code: plan.code, start: plan.start_date, end: plan.end_date },
        mrp_result: mrpResult,
        gantt_data: ganttData
    };
  }
  
  async findAll() {
      return this.planRepo.find({ order: { id: 'DESC' }, relations: ['sales_orders'] });
  }
}