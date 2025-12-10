import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supplier } from './supplier.entity';
import { SupplierMaterial } from './supplier-material.entity';
import { SupplierContact } from './supplier-contact.entity'; // MOI
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';
import { MaterialsModule } from '../materials/materials.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Supplier, SupplierMaterial, SupplierContact]), // Them Contact
    MaterialsModule
  ],
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService],
})
export class SuppliersModule {}
