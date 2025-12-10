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

  private cleanData(data: any) {
      const { boms, routings, logistics, components, color, size, fabric, ...clean } = data; 
      if (!clean.attributes && (color || size || fabric)) {
          clean.attributes = { color, size, fabric };
      }
      return clean;
  }

  async create(data: Partial<Product>) { 
      return this.productRepo.save(this.cleanData(data)); 
  }

  async update(id: number, data: Partial<Product>) { 
      await this.productRepo.update(id, this.cleanData(data)); 
      return this.productRepo.findOne({ where: { id } }); 
  }

  async remove(id: number) { return this.productRepo.delete(id); }

  async getBomByProductSku(sku: string): Promise<BOM[]> {
    const product = await this.productRepo.findOne({ where: { sku } });
    if (!product) return [];
    return this.bomRepo.find({ where: { product_id: product.id }, relations: ['material'] });
  }

  async saveBoms(productId: number, items: any[]) {
      if (!items || !Array.isArray(items)) return [];
      const pId = Number(productId);
      await this.bomRepo.delete({ product_id: pId });
      const newItems = items.filter(i => i.material_id).map(i => this.bomRepo.create({
          product_id: pId,
          material_id: Number(i.material_id),
          quantity: Number(i.quantity) || 0,
          waste_percent: Number(i.waste_percent) || 0
      }));
      const saved = await this.bomRepo.save(newItems as any);
      const product = await this.productRepo.findOne({ where: { id: pId } });
      if(product) await this.calculateCostPrice(product.sku);
      return saved;
  }

  async getRoutings(productId: number) { return this.routingRepo.find({ where: { product_id: productId }, relations: ['supplier'] }); }
  async saveRoutings(productId: number, items: any[]) {
      if (!items || !Array.isArray(items)) return [];
      const pId = Number(productId);
      await this.routingRepo.delete({ product_id: pId }); 
      const newItems = items.map(i => this.routingRepo.create({ 
          ...i, product_id: pId, is_required: Boolean(i.is_required), cost: Number(i.cost) || 0
      }));
      const saved = await this.routingRepo.save(newItems as any);
      const product = await this.productRepo.findOne({ where: { id: pId } });
      if(product) await this.calculateCostPrice(product.sku);
      return saved;
  }

  async getLogistics(productId: number) { return this.logisticRepo.find({ where: { product_id: productId } }); }
  async saveLogistics(productId: number, items: any[]) {
      if (!items || !Array.isArray(items)) return [];
      const pId = Number(productId);
      await this.logisticRepo.delete({ product_id: pId });
      const newItems = items.map(i => this.logisticRepo.create({ ...i, product_id: pId, cost: Number(i.cost) || 0 }));
      const saved = await this.logisticRepo.save(newItems as any);
      const product = await this.productRepo.findOne({ where: { id: pId } });
      if(product) await this.calculateCostPrice(product.sku);
      return saved;
  }

  async syncToVariants(sourceProductId: number) {
      const source = await this.productRepo.findOne({ where: { id: sourceProductId } });
      if (!source) throw new NotFoundException('SP Goc khong ton tai');
      const variants = await this.productRepo.find({ where: { name: source.name, category: source.category } });
      const targets = variants.filter(v => v.id !== sourceProductId);
      
      const sourceBoms = await this.bomRepo.find({ where: { product_id: sourceProductId } });
      const sourceRoutings = await this.routingRepo.find({ where: { product_id: sourceProductId } });
      const sourceLogistics = await this.logisticRepo.find({ where: { product_id: sourceProductId } });

      for (const target of targets) {
          await this.bomRepo.delete({ product_id: target.id });
          if(sourceBoms.length) await this.bomRepo.save(sourceBoms.map(b => this.bomRepo.create({ ...b, id: undefined, product_id: target.id })) as any);

          await this.routingRepo.delete({ product_id: target.id });
          if(sourceRoutings.length) await this.routingRepo.save(sourceRoutings.map(r => this.routingRepo.create({ ...r, id: undefined, product_id: target.id })) as any);

          await this.logisticRepo.delete({ product_id: target.id });
          if(sourceLogistics.length) await this.logisticRepo.save(sourceLogistics.map(l => this.logisticRepo.create({ ...l, id: undefined, product_id: target.id })) as any);
          
          await this.calculateCostPrice(target.sku);
      }
      return { message: `Đã đồng bộ cho ${targets.length} biến thể` };
  }

  async calculateCostPrice(sku: string): Promise<any> {
    const product = await this.productRepo.findOne({ where: { sku } });
    if (!product) throw new NotFoundException('SP khong ton tai');

    const components = await this.componentRepo.find({ where: { parent_product: { id: product.id } }, relations: ['child_product'] });
    if (components.length > 0) {
        let comboCost = 0;
        for (const comp of components) comboCost += Number(comp.child_product?.cost_price ?? 0) * Number(comp.quantity);
        product.cost_price = comboCost;
        await this.productRepo.save(product);
        return { sku, new_cost_price: comboCost, type: 'COMBO' };
    }

    const boms = await this.bomRepo.find({ where: { product_id: product.id }, relations: ['material'] });
    let materialCost = 0;
    for (const item of boms) {
      if(item.material) {
          const price = Number(item.material.cost_per_unit);
          const qty = Number(item.quantity);
          const waste = Number(item.waste_percent) / 100;
          materialCost += price * qty * (1 + waste);
      }
    }

    const routings = await this.routingRepo.find({ where: { product_id: product.id } });
    let laborCost = 0;
    routings.forEach(r => { if(r.is_required) laborCost += Number(r.cost); });

    const logistics = await this.logisticRepo.find({ where: { product_id: product.id } });
    let logisticsCost = 0;
    logistics.forEach(l => { logisticsCost += Number(l.cost); });

    const totalCost = Math.round(materialCost + laborCost + logisticsCost);
    product.cost_price = totalCost;
    await this.productRepo.save(product);

    return { sku, new_cost_price: totalCost, breakdown: { material: materialCost, labor: laborCost, logistic: logisticsCost } };
  }

  // --- LOGIC COMBO (MỚI TRIỂN KHAI) ---
  async getComboComponents(sku: string) {
      const product = await this.productRepo.findOne({ where: { sku } });
      if (!product) return [];
      return this.componentRepo.find({ 
          where: { parent_product: { id: product.id } },
          relations: ['child_product']
      });
  }

  async addComponent(parentSku: string, childSku: string, quantity: number) {
      const parent = await this.productRepo.findOne({ where: { sku: parentSku } });
      const child = await this.productRepo.findOne({ where: { sku: childSku } });
      
      if (!parent || !child) throw new NotFoundException('Không tìm thấy sản phẩm (Cha hoặc Con)');

      let comp = await this.componentRepo.findOne({ 
          where: { parent_product: { id: parent.id }, child_product: { id: child.id } } 
      });

      if (comp) {
          comp.quantity = quantity;
      } else {
          comp = this.componentRepo.create({
              parent_product: parent,
              child_product: child,
              quantity: quantity
          });
      }
      
      const saved = await this.componentRepo.save(comp);
      // Tinh lai gia von cho Combo cha
      await this.calculateCostPrice(parent.sku);
      return saved;
  }

  async removeComponent(id: number) {
      const comp = await this.componentRepo.findOne({ where: { id }, relations: ['parent_product'] });
      if(comp) {
          const parentSku = comp.parent_product.sku;
          await this.componentRepo.delete(id);
          await this.calculateCostPrice(parentSku);
      }
      return { message: 'Deleted' };
  }
  
  async importFromExcel(b:Buffer) { return 0; }
}