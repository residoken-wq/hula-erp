import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanningController } from './planning.controller';
import { PlanningService } from './planning.service';
import { MrpCalculationService } from './mrp-calculation.service';
import { GanttService } from './gantt.service';
import { ProductionPlan } from './production-plan.entity';
import { SalesOrder } from '../sales/sales-order.entity';
import { PurchaseOrder } from '../purchasing/entities/purchase-order.entity';
import { PurchaseOrderItem } from '../purchasing/entities/purchase-order-item.entity';
import { WorkOrder } from '../production/work-order.entity';
import { WorkOrderStep } from '../production/work-order-step.entity';
import { ProductsModule } from '../products/products.module';
import { MaterialsModule } from '../materials/materials.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductionPlan, SalesOrder, PurchaseOrder, PurchaseOrderItem, WorkOrder, WorkOrderStep]),
    ProductsModule,
    MaterialsModule,
    InventoryModule
  ],
  controllers: [PlanningController],
  providers: [PlanningService, MrpCalculationService, GanttService],
  exports: [PlanningService]
})
export class PlanningModule { }