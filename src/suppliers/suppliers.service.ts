import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './supplier.entity';
import { SupplierMaterial } from './supplier-material.entity';
import { SupplierContact } from './supplier-contact.entity';
import { MaterialsService } from '../materials/materials.service';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier) private supplierRepo: Repository<Supplier>,
    @InjectRepository(SupplierMaterial) private priceRepo: Repository<SupplierMaterial>,
    @InjectRepository(SupplierContact) private contactRepo: Repository<SupplierContact>,
    private materialsService: MaterialsService,
  ) {}

  async create(data: Partial<Supplier>) { return this.supplierRepo.save(data); }

  async findAll() {
    return this.supplierRepo.find({ relations: ['contacts'], order: { id: 'DESC' } });
  }

  async update(id: number, data: any) {
    const { contacts, ...supplierData } = data;
    await this.supplierRepo.update(id, supplierData);
    if (contacts && Array.isArray(contacts)) {
        await this.contactRepo.delete({ supplier: { id } });
        for (const c of contacts) {
            await this.contactRepo.save(this.contactRepo.create({ ...c, supplier: { id } }));
        }
    }
    return this.supplierRepo.findOne({ where: { id }, relations: ['contacts'] });
  }

  async remove(id: number) { return this.supplierRepo.delete(id); }

  async getPriceList(supplierId: number) {
    return this.priceRepo.find({ 
        where: { supplier_id: supplierId },
        relations: ['material', 'process', 'product'], 
        order: { updated_at: 'DESC' }
    });
  }

  // --- API MỚI: TRA CỨU GIÁ ---
  async checkPrice(dto: any) {
      // dto: { supplierId, processId, productId }
      // Logic: Ưu tiên giá có ProductId -> Nếu không có thì lấy giá Process chung
      
      const prices = await this.priceRepo.find({
          where: { 
              supplier_id: dto.supplierId, 
              process_id: dto.processId 
          },
          order: { id: 'DESC' }
      });

      // 1. Tìm chính xác Product
      const productMatch = prices.find(p => p.product_id == dto.productId);
      if (productMatch) return { price: Number(productMatch.price) };

      // 2. Tìm giá chung (Product = null)
      const generalMatch = prices.find(p => !p.product_id);
      if (generalMatch) return { price: Number(generalMatch.price) };

      return { price: 0 };
  }
  // ---------------------------

  async addPrice(data: any) {
    if (data.isPreferred) {
        let whereCond: any = { supplier_id: data.supplierId };
        if (data.itemType === 'MATERIAL') {
            whereCond.material_id = data.itemId;
        } else {
            whereCond.process_id = data.itemId;
            if (data.productId) whereCond.product_id = data.productId;
        }
        await this.priceRepo.update(whereCond, { is_preferred: false });
    }

    const newPriceData = {
        supplier_id: data.supplierId,
        material_id: data.itemType === 'MATERIAL' ? data.itemId : null,
        process_id: data.itemType === 'PROCESS' ? data.itemId : null,
        product_id: data.itemType === 'PROCESS' ? data.productId : null,
        price: data.price,
        is_preferred: data.isPreferred || false,
        valid_from: data.validFrom,
        valid_to: data.validTo
    };

    const priceItem = this.priceRepo.create(newPriceData as unknown as SupplierMaterial);
    const saved = await this.priceRepo.save(priceItem) as SupplierMaterial;

    if (saved.is_preferred && data.itemType === 'MATERIAL') {
        const supplier = await this.supplierRepo.findOne({where:{id: data.supplierId}});
        await this.materialsService.materialRepo.update(data.itemId, {
            cost_per_unit: data.price,
            supplier_name: supplier ? supplier.name : ''
        });
    }
    return saved;
  }

  async removePrice(id: number) { return this.priceRepo.delete(id); }
}