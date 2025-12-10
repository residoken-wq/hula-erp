import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockHistory } from './stock-history.entity';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { Product } from '../products/product.entity';
import { Material } from '../materials/material.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockHistory, Product, Material]), 
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService], // Export de Sales module goi duoc
})
export class InventoryModule {}
