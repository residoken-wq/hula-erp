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

  // --- CRUD NCC (Bao gom ca Contacts) ---
  async create(data: Partial<Supplier>) {
    // TypeORM se tu dong luu contacts nho cascade: true
    return this.supplierRepo.save(data);
  }

  async findAll() {
    return this.supplierRepo.find({ 
        relations: ['contacts'], // Lay luon danh sach lien he
        order: { id: 'DESC' } 
    });
  }

  async update(id: number, data: any) {
    // Xu ly rieng cho viec update co relation
    // 1. Luu thong tin co ban
    const { contacts, ...supplierData } = data;
    await this.supplierRepo.update(id, supplierData);
    
    // 2. Xu ly contacts (Neu co gui len)
    if (contacts && Array.isArray(contacts)) {
        const supplier = await this.supplierRepo.findOne({where: {id}});
        // Xoa cu tao moi (don gian nhat) hoac update tung cai
        // O day ta se xu ly don gian: Xoa het contact cu cua NCC nay roi luu lai list moi
        // (Luu y: Cach nay hoi "tho" nhung an toan cho logic don gian)
        await this.contactRepo.delete({ supplier: { id } });
        
        for (const c of contacts) {
            const newContact = this.contactRepo.create({ ...c, supplier });
            await this.contactRepo.save(newContact);
        }
    }

    return this.supplierRepo.findOne({ where: { id }, relations: ['contacts'] });
  }

  async remove(id: number) { return this.supplierRepo.delete(id); }

  // --- QUAN LY GIA (Co them Date) ---
  async getPriceList(supplierId: number) {
    return this.priceRepo.find({ 
        where: { supplier_id: supplierId },
        relations: ['material'],
        order: { updated_at: 'DESC' }
    });
  }

  async addPrice(data: any) {
    // data: { supplierId, materialId, price, isPreferred, validFrom, validTo }
    
    if (data.isPreferred) {
        await this.priceRepo.update({ material_id: data.materialId }, { is_preferred: false });
    }

    const priceItem = this.priceRepo.create({
        supplier_id: data.supplierId,
        material_id: data.materialId,
        price: data.price,
        is_preferred: data.isPreferred || false,
        valid_from: data.validFrom, // Luu ngay bat dau
        valid_to: data.validTo      // Luu ngay ket thuc
    });
    
    const saved = await this.priceRepo.save(priceItem);

    if (saved.is_preferred) {
        // Cap nhat lai gia vao Material Master
        const supplier = await this.supplierRepo.findOne({where:{id: data.supplierId}});
        await this.materialsService.materialRepo.update(data.materialId, {
            cost_per_unit: data.price,
            supplier_name: supplier.name
        });
    }

    return saved;
  }

  async removePrice(id: number) { return this.priceRepo.delete(id); }
}
