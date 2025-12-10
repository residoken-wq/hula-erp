import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkOrder } from './work-order.entity';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';
import { ProductsModule } from '../products/products.module';
import { InventoryModule } from '../inventory/inventory.module'; // De goi tru kho
import { BomModule } from '../bom/bom.module'; // De lay cong thuc

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkOrder]),
    ProductsModule,
    InventoryModule,
    BomModule
  ],
  controllers: [ProductionController],
  providers: [ProductionService],
})
export class ProductionModule {}
