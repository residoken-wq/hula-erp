import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanningController } from './planning.controller';
import { PlanningService } from './planning.service';
import { ProductionPlan } from './production-plan.entity';
import { SalesOrder } from '../sales/sales-order.entity';
import { PurchaseOrder } from '../purchasing/entities/purchase-order.entity';
import { PurchaseOrderItem } from '../purchasing/entities/purchase-order-item.entity';
import { ProductsModule } from '../products/products.module';
import { MaterialsModule } from '../materials/materials.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductionPlan, SalesOrder, PurchaseOrder, PurchaseOrderItem]),
    ProductsModule,
    MaterialsModule,
    InventoryModule
  ],
  controllers: [PlanningController],
  providers: [PlanningService],
  exports: [PlanningService] // --- MỚI: Export để Purchasing dùng ---
})
export class PlanningModule { }