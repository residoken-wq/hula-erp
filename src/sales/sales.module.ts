import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrder } from './sales-order.entity';
import { SalesOrderItem } from './sales-order-item.entity';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { ProductsModule } from '../products/products.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalesOrder, SalesOrderItem]),
    ProductsModule,
    InventoryModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService], // <--- Export de Finance goi duoc
})
export class SalesModule {}
