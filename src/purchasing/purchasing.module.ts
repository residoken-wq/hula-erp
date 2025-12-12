import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchasingController } from './purchasing.controller';
import { PurchasingService } from './purchasing.service';
import { PurchaseOrder } from './purchase-order.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';
import { PurchaseDelivery } from './purchase-delivery.entity';
import { InventoryModule } from '../inventory/inventory.module';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { FinanceModule } from '../finance/finance.module'; // Import Finance

@Module({
  imports: [
    TypeOrmModule.forFeature([PurchaseOrder, PurchaseOrderItem, PurchaseDelivery]),
    InventoryModule,
    SuppliersModule,
    forwardRef(() => FinanceModule) // Them Finance
  ],
  controllers: [PurchasingController],
  providers: [PurchasingService],
  exports: [PurchasingService],
})
export class PurchasingModule {}