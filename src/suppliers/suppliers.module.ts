import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supplier } from './supplier.entity';
import { SupplierContact } from './supplier-contact.entity';
import { SupplierMaterial } from './supplier-material.entity';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { ProductRouting } from '../products/product-routing.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
        Supplier, 
        SupplierContact, 
        SupplierMaterial, 
        ProductRouting
    ])
  ],
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService],
})
export class SuppliersModule {}