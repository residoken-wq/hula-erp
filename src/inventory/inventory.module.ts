import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockHistory } from './stock-history.entity';
import { InventoryStock } from './inventory-stock.entity';
import { GoodsReceipt } from './entities/goods-receipt.entity'; // <--- Import
import { GoodsReceiptItem } from './entities/goods-receipt-item.entity'; // <--- Import
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { Product } from '../products/product.entity';
import { Material } from '../materials/material.entity';
import { Supplier } from '../suppliers/supplier.entity';
import { PurchaseOrder } from '../purchasing/entities/purchase-order.entity';
import { PurchaseOrderItem } from '../purchasing/entities/purchase-order-item.entity';

@Module({
  imports: [
    // Đăng ký đủ 4 Entity mà Service cần dùng
    TypeOrmModule.forFeature([
      StockHistory,
      InventoryStock,
      Product,
      Material,
      GoodsReceipt, // <--- New
      GoodsReceiptItem // <--- New
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule { }