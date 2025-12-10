import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionPlan } from './production-plan.entity';
import { PlanningController } from './planning.controller';
import { PlanningService } from './planning.service';
import { SalesOrder } from '../sales/sales-order.entity';
import { ProductsModule } from '../products/products.module';
import { MaterialsModule } from '../materials/materials.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductionPlan, SalesOrder]),
    ProductsModule,
    MaterialsModule
  ],
  controllers: [PlanningController],
  providers: [PlanningService],
})
export class PlanningModule {}
