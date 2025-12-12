import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

  // ... (Giữ nguyên các hàm CRUD, findOne, remove, deleteMaterialPrice) ...

  // Hàm này xử lý logic giá NPL (cho SuppliersPage)
  async addMaterialPrice(supplierId: number, data: any) {
      const { material_id, price, valid_from, valid_to, is_preferred } = data;
      // ... (Logic Upsert và update giá BOM) ...
      let record = await this.supplierMaterialRepo.findOne({
          where: { supplier: { id: supplierId }, material: { id: material_id } }
      });

      if (record) {
          record.price = price;
          if(valid_from) record.valid_from = valid_from;
          if(valid_to) record.valid_to = valid_to;
          record.is_preferred = is_preferred;
      } else {
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

  // --- MỚI: HÀM XỬ LÝ LOGIC CHUNG CHO GIÁ (Dùng cho ManufacturersPage) ---
  async addSupplierPrice(data: any) {
      const { supplierId, itemId, itemType, productId, price, isPreferred, validFrom, validTo } = data;
      
      if (!supplierId || !itemId || !price) {
          throw new BadRequestException('Missing required fields: supplierId, itemId, price');
      }

      if (itemType === 'MATERIAL') {
          // Xử lý giá Nguyên liệu (thường gọi qua addMaterialPrice, nhưng nếu code cũ gọi qua đây thì phải xử lý)
          // Để giữ đơn giản, ta sẽ chỉ lưu vào SupplierMaterial.
          return this.supplierMaterialRepo.save(this.supplierMaterialRepo.create({
              supplier: { id: supplierId },
              material: { id: itemId },
              price: price,
              is_preferred: isPreferred,
              valid_from: validFrom,
              valid_to: validTo,
          }));
      } else if (itemType === 'PROCESS') {
          // LOGIC XỬ LÝ GIÁ GIA CÔNG (Sản phẩm + Công đoạn)
          
          // 1. Kiểm tra bản ghi ProductRouting đã tồn tại chưa
          const existingRouting = await this.routingRepo.findOne({
              where: {
                  supplier: { id: supplierId },
                  product: { id: productId || null }, // productId có thể null nếu là giá chung
                  process: { id: itemId }
              }
          });

          // 2. Nếu đã tồn tại -> Update giá
          if (existingRouting) {
              existingRouting.cost = price;
              // Bổ sung cập nhật các trường ngày nếu có trong ProductRouting Entity
              // existingRouting.valid_from = validFrom;
              // existingRouting.valid_to = validTo;
              return this.routingRepo.save(existingRouting);
          }
          
          // 3. Nếu chưa tồn tại -> Báo lỗi hoặc tạo mới (Tạm thời báo lỗi nếu không tìm thấy routing)
          throw new NotFoundException('Product Routing record not found for update. Please define routing first.');
          
          // Nếu bạn muốn tạo mới routing, cần thêm logic ở đây
          /*
          return this.routingRepo.save(this.routingRepo.create({
              supplier: { id: supplierId },
              process: { id: itemId },
              product: productId ? { id: productId } : null,
              cost: price,
              // ... các field khác của ProductRouting
          }));
          */
      }

      throw new BadRequestException('Invalid itemType');
  }

  async checkPrice(supplierId: number, processId: number) { return { price: 0 }; }
}
