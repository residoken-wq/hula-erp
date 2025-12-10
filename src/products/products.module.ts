import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { BOM } from '../bom/bom.entity';
import { ProductComponent } from './product-component.entity';
import { ProductRouting } from './product-routing.entity'; // MOI
import { ProductLogistics } from './product-logistics.entity'; // MOI
import { Supplier } from '../suppliers/supplier.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
        Product, BOM, ProductComponent, 
        ProductRouting, ProductLogistics, // <--- QUAN TRONG
        Supplier
    ])
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
