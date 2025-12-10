import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { MaterialsModule } from '../materials/materials.module';
import { ProductsModule } from '../products/products.module';
// Entities
import { Product } from '../products/product.entity';
import { BOM } from '../bom/bom.entity';
import { ProductComponent } from '../products/product-component.entity';
import { Customer } from '../customers/customer.entity'; // --- FIX: IMPORT CUSTOMER

@Module({
  imports: [
    TypeOrmModule.forFeature([
        Product, BOM, ProductComponent,
        Customer // --- FIX: KHAI BAO ENTITY CUSTOMER
    ]), 
    MaterialsModule, 
    ProductsModule
  ], 
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
