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

  async findOne(id: number) {
    const supplier = await this.supplierRepo.findOne({ 
        where: { id },
        relations: ['price_list', 'price_list.material', 'routings', 'routings.product'] // Load chi tiết
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

  // --- FIX: LOGIC THÊM/CẬP NHẬT GIÁ NPL ---
  async addMaterialPrice(supplierId: number, data: any) {
      const { material_id, price } = data;

      // 1. Kiểm tra xem đã có giá của NPL này chưa
      const existing = await this.supplierMaterialRepo.findOne({
          where: {
              supplier: { id: supplierId },
              material: { id: material_id }
          }
      });

      if (existing) {
          // 2. Nếu có rồi -> CẬP NHẬT GIÁ
          existing.price = price;
          return this.supplierMaterialRepo.save(existing);
      } else {
          // 3. Nếu chưa có -> TẠO MỚI
          const newItem = this.supplierMaterialRepo.create({
              supplier: { id: supplierId },
              material: { id: material_id },
              price: price
          });
          return this.supplierMaterialRepo.save(newItem);
      }
  }

  // --- LOGIC KIỂM TRA GIÁ GIA CÔNG (CHO SẢN PHẨM) ---
  async checkPrice(supplierId: number, processId: number) {
      // Logic tạm: Tìm xem NCC này có làm công đoạn này không
      // Trong thực tế có thể cần bảng giá gia công riêng
      return { price: 0 }; 
  }
}