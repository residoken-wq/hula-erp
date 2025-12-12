import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanningController } from './planning.controller';
import { PlanningService } from './planning.service';
import { ProductionPlan } from './production-plan.entity';
import { SalesOrder } from '../sales/sales-order.entity';
import { PurchaseOrder } from '../purchasing/purchase-order.entity';
import { PurchaseOrderItem } from '../purchasing/purchase-order-item.entity';
import { ProductsModule } from '../products/products.module';
import { MaterialsModule } from '../materials/materials.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductionPlan, SalesOrder, PurchaseOrder, PurchaseOrderItem]),
    ProductsModule,
    MaterialsModule
  ],
  controllers: [PlanningController],
  providers: [PlanningService],
})
export class PlanningModule {}