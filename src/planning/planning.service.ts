import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProductionPlan, PlanStatus } from './production-plan.entity';
import { SalesOrder, SalesOrderStatus } from '../sales/sales-order.entity';
import { ProductsService } from '../products/products.service';
import { MaterialsService } from '../materials/materials.service';
import { PurchaseOrder, POType, POStatus } from '../purchasing/purchase-order.entity';
import { PurchaseOrderItem } from '../purchasing/purchase-order-item.entity';

@Injectable()
export class PlanningService {
  constructor(
    @InjectRepository(ProductionPlan) private planRepo: Repository<ProductionPlan>,
    @InjectRepository(SalesOrder) private orderRepo: Repository<SalesOrder>,
    @InjectRepository(PurchaseOrder) private poRepo: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem) private poItemRepo: Repository<PurchaseOrderItem>,
    private productsService: ProductsService,
    private materialsService: MaterialsService,
  ) {}

  async getSuggestion() {
      return this.orderRepo.find({ where: { status: SalesOrderStatus.DEPOSITED, plan_id: null }, order: { delivery_date: 'ASC' } });
  }

  async createPlan(data: any) {
    const orders = await this.orderRepo.find({ where: { order_code: In(data.orderCodes) } });
    const plan = this.planRepo.create({
        code: data.code, name: data.name, start_date: data.start_date, end_date: data.end_date, status: PlanStatus.DRAFT
    });
    const saved = await this.planRepo.save(plan);
    await this.orderRepo.update({ id: In(orders.map(o => o.id)) }, { plan_id: saved.id, status: SalesOrderStatus.PLANNED });
    return saved;
  }

  async calculateMaterialNeeds(planId: number) {
    const plan = await this.planRepo.findOne({ where: { id: planId }, relations: ['sales_orders', 'sales_orders.items'] });
    if (!plan) throw new NotFoundException();

    const productDemand = new Map<string, number>();
    plan.sales_orders.forEach(so => {
        so.items.forEach(i => productDemand.set(i.sku, (productDemand.get(i.sku)||0) + Number(i.quantity)));
    });

    const materialDemand = new Map<number, number>();
    for (const [sku, qty] of productDemand.entries()) {
        const boms = await this.productsService.getBomByProductSku(sku);
        for (const bom of boms) {
            if (bom.material_id) {
                const req = qty * Number(bom.quantity) * (1 + Number(bom.waste_percent)/100);
                materialDemand.set(bom.material_id, (materialDemand.get(bom.material_id)||0) + req);
            }
        }
    }

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
                cost: mat.cost_per_unit
            });
        }
    }

    const ganttData = plan.sales_orders.map(so => ({
        id: so.order_code, name: `SX ${so.order_code}`, start: plan.start_date, end: so.delivery_date || plan.end_date, progress: 0
    }));

    plan.status = PlanStatus.CALCULATED;
    await this.planRepo.save(plan);

    return { plan_info: plan, mrp_result: mrpResult, gantt_data: ganttData };
  }

  async generatePos(planId: number, mrpData: any[]) {
      const supplierGroups = {};
      for (const item of mrpData) {
          if (item.net_requirement > 0) {
              const suppName = item.supplier_name || 'Unknown';
              if (!supplierGroups[suppName]) supplierGroups[suppName] = [];
              supplierGroups[suppName].push(item);
          }
      }

      const createdPos = [];
      for (const [suppName, items] of Object.entries(supplierGroups)) {
          const po = this.poRepo.create({
              po_code: `PO-${planId}-${Math.floor(Math.random()*1000)}`,
              type: POType.MATERIAL,
              plan_id: planId,
              status: POStatus.DRAFT,
              note: `Tự động tạo từ Kế hoạch ${planId}`
          });
          
          let total = 0;
          
          // --- FIX: Double Cast (as unknown as PurchaseOrderItem) ---
          po.items = (items as any[]).map(i => {
              const sub = i.net_requirement * i.cost;
              total += sub;
              return this.poItemRepo.create({
                  material_id: i.material_id, 
                  description: i.material_name,
                  quantity: i.net_requirement,
                  unit_price: i.cost,
                  subtotal: sub
              } as any) as unknown as PurchaseOrderItem;
          });
          
          po.total_amount = total;
          await this.poRepo.save(po);
          createdPos.push(po.po_code);
      }
      return { message: `Đã tạo ${createdPos.length} PO`, pos: createdPos };
  }

  async findAll() { return this.planRepo.find({ order: { id: 'DESC' }, relations: ['sales_orders'] }); }
}