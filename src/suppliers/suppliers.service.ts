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
    @InjectRepository(Supplier)
    private supplierRepo: Repository<Supplier>,
    
    @InjectRepository(SupplierMaterial)
    private supplierMaterialRepo: Repository<SupplierMaterial>,

    @InjectRepository(ProductRouting)
    private routingRepo: Repository<ProductRouting>,

    @InjectRepository(Material)
    private materialRepo: Repository<Material>,
  ) {}

  async create(data: any) {
    const supplier = this.supplierRepo.create(data);
    return this.supplierRepo.save(supplier);
  }

  async findAll() {
    return this.supplierRepo.find({ order: { created_at: 'DESC' } });
  }

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

  async remove(id: number) {
    await this.supplierRepo.delete(id);
    return { deleted: true };
  }

  async addMaterialPrice(supplierId: number, data: any) {
      const { material_id, price, valid_from, is_preferred } = data;

      // 1. Upsert: Tìm xem đã có chưa
      let record = await this.supplierMaterialRepo.findOne({
          where: {
              supplier: { id: supplierId },
              material: { id: material_id }
          }
      });

      if (record) {
          record.price = price;
          record.valid_from = valid_from;
          record.is_preferred = is_preferred;
      } else {
          record = this.supplierMaterialRepo.create({
              supplier: { id: supplierId },
              material: { id: material_id },
              price: price,
              valid_from: valid_from,
              is_preferred: is_preferred
          });
      }
      
      const saved = await this.supplierMaterialRepo.save(record);

      // 2. Nếu là giá mặc định -> Update vào bảng Material gốc
      if (is_preferred) {
          await this.materialRepo.update(material_id, { cost_price: price });
      }

      return saved;
  }

  async checkPrice(supplierId: number, processId: number) {
      return { price: 0 }; 
  }
}