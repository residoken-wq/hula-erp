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

  async createPlan(data: any) {
    const orders = await this.orderRepo.find({ where: { order_code: In(data.orderCodes) } });
    if (orders.length !== data.orderCodes.length) throw new NotFoundException('Mot so don hang khong tim thay');

    // FIX: Chi cho phep gom don dang o trang thai SO_PENDING (Da chot don/bao gia accepted)
    // Khong cho phep gom don Quotation hoac Draft
    for (const so of orders) {
        if (so.status !== SalesOrderStatus.SO_PENDING) {
            throw new BadRequestException(`Don ${so.order_code} trang thai khong hop le (Phai la SO_PENDING)`);
        }
        if (so.plan_id) throw new BadRequestException(`Don ${so.order_code} da thuoc ke hoach khac`);
    }

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

  async calculateMaterialNeeds(planId: number) {
    const plan = await this.planRepo.findOne({ 
        where: { id: planId }, 
        relations: ['sales_orders', 'sales_orders.items'] 
    });
    if (!plan) throw new NotFoundException('Ke hoach khong ton tai');

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

    const result = [];
    for (const [matId, grossQty] of materialDemand.entries()) {
        const material = await this.materialsService.materialRepo.findOne({ where: { id: matId } });
        if (material) {
            const stock = Number(material.quantity_in_stock) || 0;
            const netQty = grossQty - stock;
            
            result.push({
                material_id: matId,
                material_code: material.code,
                material_name: material.name,
                unit: material.unit,
                gross_requirement: Math.ceil(grossQty * 100)/100,
                available_stock: stock,
                net_requirement: netQty > 0 ? Math.ceil(netQty * 100)/100 : 0,
                purchase_unit: material.purchase_unit,
                conversion_factor: material.conversion_factor,
                suggested_purchase_qty: netQty > 0 ? Math.ceil(netQty / Number(material.conversion_factor || 1)) : 0
            });
        }
    }

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