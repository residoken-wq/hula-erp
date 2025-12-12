import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrder } from './sales-order.entity';
import { SalesOrderItem } from './sales-order-item.entity';
import { ProductSample } from './product-sample.entity';
import { SalesDelivery } from './sales-delivery.entity';      // MOI
import { SalesDeliveryItem } from './sales-delivery-item.entity'; // MOI
import { Transaction } from '../finance/transaction.entity'; // De query payment history

import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { ProductsModule } from '../products/products.module';
import { InventoryModule } from '../inventory/inventory.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
        SalesOrder, SalesOrderItem, ProductSample, 
        SalesDelivery, SalesDeliveryItem,
        Transaction
    ]),
    ProductsModule,
    InventoryModule,
    CustomersModule
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}