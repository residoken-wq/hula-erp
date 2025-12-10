import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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

  // 1. Tạo Kế hoạch SX (Gom các đơn hàng)
  async createPlan(data: any) {
    // data: { code, name, orderCodes: ['SO_01', 'SO_02'] }
    
    // Tìm các đơn hàng
    const orders = await this.orderRepo.find({ where: { order_code: In(data.orderCodes) } });
    if (orders.length !== data.orderCodes.length) throw new NotFoundException('Một số đơn hàng không tìm thấy');

    // Validate: Đơn hàng phải ở trạng thái CONFIRMED và chưa vào Plan nào
    for (const so of orders) {
        if (so.status !== SalesOrderStatus.CONFIRMED && so.status !== SalesOrderStatus.DRAFT) {
            throw new BadRequestException(`Đơn ${so.order_code} trạng thái không hợp lệ để lên KH`);
        }
        if (so.plan_id) throw new BadRequestException(`Đơn ${so.order_code} đã thuộc kế hoạch khác`);
    }

    const plan = this.planRepo.create({
        code: data.code,
        name: data.name,
        start_date: data.start_date,
        end_date: data.end_date,
        status: PlanStatus.DRAFT
    });
    
    const savedPlan = await this.planRepo.save(plan);

    // Cập nhật Sales Order: Gán vào Plan và KHÓA ĐƠN
    await this.orderRepo.update(
        { id: In(orders.map(o => o.id)) }, 
        { plan_id: savedPlan.id, status: SalesOrderStatus.PLANNED }
    );

    return savedPlan;
  }

  // 2. Thuật toán MRP (Material Requirements Planning)
  async calculateMaterialNeeds(planId: number) {
    const plan = await this.planRepo.findOne({ 
        where: { id: planId }, 
        relations: ['sales_orders', 'sales_orders.items'] 
    });
    if (!plan) throw new NotFoundException('Kế hoạch không tồn tại');

    // BƯỚC 1: TỔNG HỢP NHU CẦU SẢN PHẨM (Gross Product Demand)
    const productDemand = new Map<string, number>(); // SKU -> Qty
    
    for (const so of plan.sales_orders) {
        for (const item of so.items) {
            const currentQty = productDemand.get(item.sku) || 0;
            productDemand.set(item.sku, currentQty + Number(item.quantity));
        }
    }

    // BƯỚC 2: BUNG BOM (Explosion)
    const materialDemand = new Map<number, number>(); // MaterialID -> Qty Needed
    
    for (const [sku, qty] of productDemand.entries()) {
        // Lấy BOM của sản phẩm
        const boms = await this.productsService.getBomByProductSku(sku);
        
        for (const bomItem of boms) {
            if (bomItem.material_id) {
                // Công thức: Nhu cầu = SL Sản Phẩm * Định mức * (1 + Hao hụt)
                const waste = Number(bomItem.waste_percent) / 100;
                const required = qty * Number(bomItem.quantity) * (1 + waste);
                
                const currentMatQty = materialDemand.get(bomItem.material_id) || 0;
                materialDemand.set(bomItem.material_id, currentMatQty + required);
            }
        }
    }

    // BƯỚC 3: CÂN ĐỐI TỒN KHO (Net Requirement Calculation)
    const result = [];
    for (const [matId, grossQty] of materialDemand.entries()) {
        const material = await this.materialsService.materialRepo.findOne({ where: { id: matId } });
        if (material) {
            const stock = Number(material.quantity_in_stock) || 0;
            const netQty = grossQty - stock; // Nhu cầu ròng = Tổng cần - Tồn kho
            
            result.push({
                material_id: matId,
                material_code: material.code,
                material_name: material.name,
                unit: material.unit,
                gross_requirement: Math.ceil(grossQty * 100)/100, // Làm tròn 2 số lẻ
                available_stock: stock,
                net_requirement: netQty > 0 ? Math.ceil(netQty * 100)/100 : 0, // Chỉ mua nếu thiếu
                purchase_unit: material.purchase_unit,
                conversion_factor: material.conversion_factor,
                suggested_purchase_qty: netQty > 0 ? Math.ceil(netQty / Number(material.conversion_factor || 1)) : 0
            });
        }
    }

    // Cập nhật trạng thái Plan
    plan.status = PlanStatus.CALCULATED;
    await this.planRepo.save(plan);

    return {
        plan_info: { id: plan.id, name: plan.name, code: plan.code },
        mrp_result: result
    };
  }
  
  async findAll() {
      return this.planRepo.find({ order: { id: 'DESC' }, relations: ['sales_orders'] });
  }
}
