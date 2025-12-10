import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrder } from './purchase-order.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';
import { PurchasingController } from './purchasing.controller';
import { PurchasingService } from './purchasing.service';
import { MaterialsModule } from '../materials/materials.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PurchaseOrder, PurchaseOrderItem]),
    MaterialsModule,
    InventoryModule
  ],
  controllers: [PurchasingController],
  providers: [PurchasingService],
  exports: [PurchasingService], // <--- Export de Finance goi duoc
})
export class PurchasingModule {}
