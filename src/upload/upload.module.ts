import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { MaterialsModule } from '../materials/materials.module';
import { ProductsModule } from '../products/products.module';
import { Product } from '../products/product.entity';
import { BOM } from '../bom/bom.entity';
import { ProductComponent } from '../products/product-component.entity'; // MOI

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, BOM, ProductComponent]), // Them ProductComponent
    MaterialsModule, 
    ProductsModule
  ], 
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
