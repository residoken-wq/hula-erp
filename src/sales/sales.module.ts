import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrder } from './sales-order.entity';
import { SalesOrderItem } from './sales-order-item.entity';
import { ProductSample } from './product-sample.entity';
import { SalesDelivery } from './sales-delivery.entity';
import { SalesDeliveryItem } from './sales-delivery-item.entity';
import { SalesComment } from './sales-comment.entity';
import { Transaction } from '../finance/transaction.entity';

// Price List Entities
import { PriceList } from './pricelist/price-list.entity';
import { PriceListRule } from './pricelist/price-list-rule.entity';

import { AiSuggestionService } from './ai-suggestion.service';

// User Entity
import { User } from '../users/entities/user.entity';

import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { ProductsModule } from '../products/products.module';
import { InventoryModule } from '../inventory/inventory.module';
import { CustomersModule } from '../customers/customers.module';
import { FinanceModule } from '../finance/finance.module';
import { SystemModule } from '../system/system.module';
import { SalesOrderVersion } from './sales-order-version.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesOrder,
      SalesOrderVersion,
      SalesOrderItem,
      ProductSample,
      SalesDelivery,
      SalesDeliveryItem,
      SalesComment,
      Transaction,
      PriceList,
      PriceListRule,
      User
    ]),
    ProductsModule,
    InventoryModule,
    CustomersModule,
    SystemModule,
    forwardRef(() => FinanceModule)
  ],
  controllers: [SalesController],
  providers: [SalesService, AiSuggestionService],
  exports: [SalesService],
})
export class SalesModule { }