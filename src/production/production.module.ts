import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionService } from './production.service';
import { ProductionController } from './production.controller';

// Entities
import { ProductionOrder } from './entities/production-order.entity';

// External Modules
import { InventoryModule } from '../inventory/inventory.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
        ProductionOrder // <--- Đảm bảo đã đăng ký
    ]),
    InventoryModule,
    ProductsModule
  ],
  controllers: [ProductionController],
  providers: [ProductionService],
  exports: [ProductionService]
})
export class ProductionModule {}