import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './supplier.entity';
import { SupplierMaterial } from './supplier-material.entity';
import { ProductRouting } from '../products/product-routing.entity';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepo: Repository<Supplier>,
    
    @InjectRepository(SupplierMaterial)
    private supplierMaterialRepo: Repository<SupplierMaterial>,

    @InjectRepository(ProductRouting)
    private routingRepo: Repository<ProductRouting>,
  ) {}

  async create(data: any) {
    const supplier = this.supplierRepo.create(data);
    return this.supplierRepo.save(supplier);
  }

  async findAll() {
    return this.supplierRepo.find({ order: { created_at: 'DESC' } });
  }

  // Hàm này sẽ hoạt động OK sau khi Entity đã được sửa ở Bước 1
  async findOne(id: number) {
    const supplier = await this.supplierRepo.findOne({ 
        where: { id },
        // Load đầy đủ quan hệ để lấy ĐVT (material) và Giá GC (routings)
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

  // --- FIX LOGIC THÊM GIÁ (Tránh lỗi duplicate key) ---
  async addMaterialPrice(supplierId: number, data: any) {
      const { material_id, price } = data;

      // 1. Tìm xem đã có giá chưa
      const existing = await this.supplierMaterialRepo.findOne({
          where: {
              supplier: { id: supplierId },
              material: { id: material_id }
          }
      });

      if (existing) {
          // 2. Có rồi -> Cập nhật giá mới
          existing.price = price;
          return this.supplierMaterialRepo.save(existing);
      } else {
          // 3. Chưa có -> Tạo mới
          const newItem = this.supplierMaterialRepo.create({
              supplier: { id: supplierId },
              material: { id: material_id },
              price: price
          });
          return this.supplierMaterialRepo.save(newItem);
      }
  }

  async checkPrice(supplierId: number, processId: number) {
      return { price: 0 }; 
  }
}