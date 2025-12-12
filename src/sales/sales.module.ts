import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrder } from './sales-order.entity';
import { SalesOrderItem } from './sales-order-item.entity';
import { ProductSample } from './product-sample.entity';
import { SalesDelivery } from './sales-delivery.entity';
import { SalesDeliveryItem } from './sales-delivery-item.entity';
import { Transaction } from '../finance/transaction.entity';

import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { ProductsModule } from '../products/products.module';
import { InventoryModule } from '../inventory/inventory.module';
import { CustomersModule } from '../customers/customers.module';
import { FinanceModule } from '../finance/finance.module'; // Import Finance

@Module({
  imports: [
    TypeOrmModule.forFeature([
        SalesOrder, SalesOrderItem, ProductSample, 
        SalesDelivery, SalesDeliveryItem,
        Transaction
    ]),
    ProductsModule,
    InventoryModule,
    CustomersModule,
    forwardRef(() => FinanceModule) // Them Finance
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}