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

  // --- CRUD NCC ---
  async create(data: Partial<Supplier>) {
    return this.supplierRepo.save(data);
  }

  async findAll() {
    return this.supplierRepo.find({ 
        relations: ['contacts'], 
        order: { id: 'DESC' } 
    });
  }

  async update(id: number, data: any) {
    const { contacts, ...supplierData } = data;
    await this.supplierRepo.update(id, supplierData);
    
    if (contacts && Array.isArray(contacts)) {
        const supplier = await this.supplierRepo.findOne({where: {id}});
        await this.contactRepo.delete({ supplier: { id } });
        for (const c of contacts) {
            const newContact = this.contactRepo.create({ ...c, supplier });
            await this.contactRepo.save(newContact);
        }
    }
    return this.supplierRepo.findOne({ where: { id }, relations: ['contacts'] });
  }

  async remove(id: number) { return this.supplierRepo.delete(id); }

  // --- QUAN LY GIA ---
  async getPriceList(supplierId: number) {
    return this.priceRepo.find({ 
        where: { supplier_id: supplierId },
        relations: ['material', 'process'], 
        order: { updated_at: 'DESC' }
    });
  }

  async addPrice(data: any) {
    // Reset cờ ưu tiên cũ
    if (data.isPreferred) {
        const whereCond = data.itemType === 'MATERIAL' 
            ? { material_id: data.itemId, supplier_id: data.supplierId } 
            : { process_id: data.itemId, supplier_id: data.supplierId };
        await this.priceRepo.update(whereCond, { is_preferred: false });
    }

    // --- FIX: Tạo object thủ công hoặc ép kiểu để tránh lỗi TS2769 ---
    const newPriceData = {
        supplier_id: data.supplierId,
        material_id: data.itemType === 'MATERIAL' ? data.itemId : null,
        process_id: data.itemType === 'PROCESS' ? data.itemId : null,
        price: data.price,
        is_preferred: data.isPreferred || false,
        valid_from: data.validFrom,
        valid_to: data.validTo
    };

    const priceItem = this.priceRepo.create(newPriceData as unknown as SupplierMaterial);
    
    // --- FIX: Ép kiểu kết quả save về object đơn ---
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