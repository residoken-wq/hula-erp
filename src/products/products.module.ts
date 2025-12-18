import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

// Entities
import { Product } from './product.entity';
import { BOM } from '../bom/bom.entity';
import { ProductComponent } from './product-component.entity';
import { ProductRouting } from './product-routing.entity';
import { ProductLogistics } from './product-logistics.entity';
import { ProductPattern } from './product-pattern.entity'; // <--- MỚI: Import Entity Pattern

import { Supplier } from '../suppliers/supplier.entity';
import { SupplierMaterial } from '../suppliers/supplier-material.entity';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product, 
      BOM, 
      ProductComponent, 
      ProductRouting, 
      ProductLogistics,
      ProductPattern, // <--- MỚI: Đăng ký Entity Pattern
      Supplier, 
      SupplierMaterial
    ]),
    forwardRef(() => CategoriesModule),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}