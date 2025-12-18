import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockHistory } from './stock-history.entity';
import { InventoryStock } from './inventory-stock.entity'; // <--- Import Entity mới
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { Product } from '../products/product.entity';
import { Material } from '../materials/material.entity';

@Module({
  imports: [
    // Đăng ký đủ 4 Entity mà Service cần dùng
    TypeOrmModule.forFeature([
        StockHistory, 
        InventoryStock, // <--- BẮT BUỘC CÓ DÒNG NÀY (Fix lỗi crash)
        Product, 
        Material
    ]), 
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService], 
})
export class InventoryModule {}