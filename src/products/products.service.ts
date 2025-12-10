import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { BOM } from '../bom/bom.entity';
import { ProductComponent } from './product-component.entity';
import { ProductRouting } from './product-routing.entity';
import { ProductLogistics } from './product-logistics.entity';
import { Supplier } from '../suppliers/supplier.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(BOM) private bomRepo: Repository<BOM>,
    @InjectRepository(ProductComponent) private componentRepo: Repository<ProductComponent>,
    @InjectRepository(ProductRouting) private routingRepo: Repository<ProductRouting>,
    @InjectRepository(ProductLogistics) private logisticRepo: Repository<ProductLogistics>,
    @InjectRepository(Supplier) private supplierRepo: Repository<Supplier>,
  ) {}

  async findAll() { return this.productRepo.find({ order: { id: 'DESC' } }); }
  async findOneBySku(sku: string) { return this.productRepo.findOne({ where: { sku } }); }
  async create(data: Partial<Product>) { return this.productRepo.save(data); }
  async update(id: number, data: Partial<Product>) { await this.productRepo.update(id, data); return this.productRepo.findOne({ where: { id } }); }
  async remove(id: number) { return this.productRepo.delete(id); }

  async getBomByProductSku(sku: string): Promise<BOM[]> {
    const product = await this.productRepo.findOne({ where: { sku } });
    if (!product) return [];
    return this.bomRepo.find({ where: { product_id: product.id }, relations: ['material'] });
  }

  // --- FIX LOI LUU BOM (VERSION 2 - ROBUST) ---
  async saveBoms(productId: number, items: any[]) {
      console.log(`Dang luu BOM cho Product ID: ${productId}`);
      console.log('Du lieu nhan duoc:', items);

      if (!items || !Array.isArray(items)) {
          console.log('Loi: Data khong phai la mang');
          return [];
      }

      // 1. Xoa BOM cu
      await this.bomRepo.delete({ product_id: productId }); 
      
      // 2. Loc va Chuan hoa du lieu
      const validItems = items
        .filter(i => i.material_id) // Chi lay dong da chon NPL
        .map(i => {
            return this.bomRepo.create({
                product_id: Number(productId), // Ep kieu so
                material_id: Number(i.material_id), // Ep kieu so
                quantity: Number(i.quantity) || 0,
                waste_percent: Number(i.waste_percent) || 0
            });
        });

      if (validItems.length === 0) {
          console.log('Khong co dong BOM nao hop le de luu');
          return [];
      }

      // 3. Luu vao DB
      try {
          const result = await this.bomRepo.save(validItems as any);
          console.log('Luu thanh cong:', result.length, 'dong');
          return result;
      } catch (error) {
          console.error('LOI KHI LUU BOM VAO DB:', error);
          throw error; // Nem loi ra de Controller bat duoc
      }
  }
  // -------------------------------------------

  async getRoutings(productId: number) { return this.routingRepo.find({ where: { product_id: productId }, relations: ['supplier'] }); }
  
  async saveRoutings(productId: number, items: any[]) {
      await this.routingRepo.delete({ product_id: productId }); 
      const newItems = items.map(i => this.routingRepo.create({ ...i, product_id: productId }));
      return this.routingRepo.save(newItems as any);
  }

  async getLogistics(productId: number) { return this.logisticRepo.find({ where: { product_id: productId } }); }
  
  async saveLogistics(productId: number, items: any[]) {
      await this.logisticRepo.delete({ product_id: productId });
      const newItems = items.map(i => this.logisticRepo.create({ ...i, product_id: productId }));
      return this.logisticRepo.save(newItems as any);
  }

  // --- MOI: DONG BO DU LIEU SANG CAC BIEN THE KHAC ---
  async syncToVariants(sourceProductId: number) {
      const source = await this.productRepo.findOne({ where: { id: sourceProductId } });
      if (!source) throw new NotFoundException('SP Goc khong ton tai');

      // Tim tat ca bien the cung Ten va Cung Nhom (Tru chinh no ra)
      const variants = await this.productRepo.find({
          where: { name: source.name, category: source.category }
      });

      const targets = variants.filter(v => v.id !== sourceProductId);
      
      // Lay du lieu nguon
      const sourceBoms = await this.bomRepo.find({ where: { product_id: sourceProductId } });
      const sourceRoutings = await this.routingRepo.find({ where: { product_id: sourceProductId } });
      const sourceLogistics = await this.logisticRepo.find({ where: { product_id: sourceProductId } });

      for (const target of targets) {
          // 1. Copy BOM
          await this.bomRepo.delete({ product_id: target.id });
          const newBoms = sourceBoms.map(b => this.bomRepo.create({ ...b, id: undefined, product_id: target.id }));
          await this.bomRepo.save(newBoms as any);

          // 2. Copy Routing
          await this.routingRepo.delete({ product_id: target.id });
          const newRoutings = sourceRoutings.map(r => this.routingRepo.create({ ...r, id: undefined, product_id: target.id }));
          await this.routingRepo.save(newRoutings as any);

          // 3. Copy Logistics
          await this.logisticRepo.delete({ product_id: target.id });
          const newLogistics = sourceLogistics.map(l => this.logisticRepo.create({ ...l, id: undefined, product_id: target.id }));
          await this.logisticRepo.save(newLogistics as any);
          
          // 4. Tinh lai gia von cho target luon
          await this.calculateCostPrice(target.sku);
      }

      return { message: `Đã đồng bộ cho ${targets.length} biến thể` };
  }
  // --------------------------------------------------

  async calculateCostPrice(sku: string): Promise<any> {
    const product = await this.productRepo.findOne({ where: { sku } });
    if (!product) throw new NotFoundException('SP khong ton tai');

    // 0. Check Combo
    const components = await this.componentRepo.find({ where: { parent_product: { id: product.id } }, relations: ['child_product'] });
    if (components.length > 0) {
        let comboCost = 0;
        for (const comp of components) comboCost += Number(comp.child_product.cost_price || 0) * Number(comp.quantity);
        product.cost_price = comboCost;
        await this.productRepo.save(product);
        return { sku, new_cost_price: comboCost, type: 'COMBO' };
    }

    // 1. Nguyen lieu (BOM)
    const boms = await this.bomRepo.find({ where: { product_id: product.id }, relations: ['material'] });
    let materialCost = 0;
    for (const item of boms) {
      const price = Number(item.material.cost_per_unit);
      const qty = Number(item.quantity);
      const waste = Number(item.waste_percent) / 100;
      materialCost += price * qty * (1 + waste);
    }

    // 2. Gia cong
    const routings = await this.routingRepo.find({ where: { product_id: product.id } });
    let laborCost = 0;
    routings.forEach(r => { if(r.is_required) laborCost += Number(r.cost); });

    // 3. Van chuyen
    const logistics = await this.logisticRepo.find({ where: { product_id: product.id } });
    let logisticsCost = 0;
    logistics.forEach(l => { logisticsCost += Number(l.cost); });

    const totalCost = Math.round(materialCost + laborCost + logisticsCost);
    product.cost_price = totalCost;
    await this.productRepo.save(product);

    return { sku, new_cost_price: totalCost };
  }

  async getComboComponents(sku: string) { return []; } 
  async addComponent(p:string, c:string, q:number) { return null; }
  async removeComponent(id:number) { return null; }
  async importFromExcel(b:Buffer) { return 0; }
}
