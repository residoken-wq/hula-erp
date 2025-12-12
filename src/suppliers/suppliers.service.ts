import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './supplier.entity';
import { SupplierMaterial } from './supplier-material.entity';
import { ProductRouting } from '../products/product-routing.entity';
import { Material } from '../materials/material.entity';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier) private supplierRepo: Repository<Supplier>,
    @InjectRepository(SupplierMaterial) private supplierMaterialRepo: Repository<SupplierMaterial>,
    @InjectRepository(ProductRouting) private routingRepo: Repository<ProductRouting>,
    @InjectRepository(Material) private materialRepo: Repository<Material>,
  ) {}

  async create(data: any) { return this.supplierRepo.save(this.supplierRepo.create(data)); }
  async findAll() { return this.supplierRepo.find({ order: { created_at: 'DESC' } }); }
  async remove(id: number) { await this.supplierRepo.delete(id); return { deleted: true }; }
  
  async findOne(id: number) {
    const supplier = await this.supplierRepo.findOne({ 
        where: { id },
        relations: ['price_list', 'price_list.material', 'routings', 'routings.product'] 
    });
    if (!supplier) throw new NotFoundException('Not found');
    return supplier;
  }

  async update(id: number, data: any) {
    await this.supplierRepo.update(id, data);
    return this.findOne(id);
  }

  // --- FIX: UPSERT PRICE ---
  async addMaterialPrice(supplierId: number, data: any) {
      const { material_id, price, valid_from, valid_to, is_preferred } = data;

      let record = await this.supplierMaterialRepo.findOne({
          where: { supplier: { id: supplierId }, material: { id: material_id } }
      });

      if (record) {
          // Update
          record.price = price;
          if(valid_from) record.valid_from = valid_from;
          if(valid_to) record.valid_to = valid_to;
          record.is_preferred = is_preferred;
      } else {
          // Create
          record = this.supplierMaterialRepo.create({
              supplier: { id: supplierId },
              material: { id: material_id },
              price: price,
              valid_from: valid_from,
              valid_to: valid_to,
              is_preferred: is_preferred
          });
      }
      
      const saved = await this.supplierMaterialRepo.save(record);

      if (is_preferred) {
          await this.materialRepo.update(material_id, { cost_price: price });
      }
      return saved;
  }

  async deleteMaterialPrice(id: number) {
      return this.supplierMaterialRepo.delete(id);
  }

  async checkPrice(supplierId: number, processId: number) { return { price: 0 }; }
}