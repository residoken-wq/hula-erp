import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { BOM } from '../bom/bom.entity';
import { ProductComponent } from './product-component.entity';
import { ProductRouting } from './product-routing.entity';
import { ProductLogistics } from './product-logistics.entity';
import { Supplier } from '../suppliers/supplier.entity';
import { SupplierMaterial } from '../suppliers/supplier-material.entity';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(BOM) private bomRepo: Repository<BOM>,
    @InjectRepository(ProductComponent) private componentRepo: Repository<ProductComponent>,
    @InjectRepository(ProductRouting) private routingRepo: Repository<ProductRouting>,
    @InjectRepository(ProductLogistics) private logisticRepo: Repository<ProductLogistics>,
    @InjectRepository(Supplier) private supplierRepo: Repository<Supplier>,
    @InjectRepository(SupplierMaterial) private priceRepo: Repository<SupplierMaterial>,
    @Inject(forwardRef(() => CategoriesService)) private categoriesService: CategoriesService,
  ) {}

  async findAll() { 
      return this.productRepo.find({ 
          order: { id: 'DESC' },
          relations: ['category_link']
      }); 
  }
  
  async findOneBySku(sku: string) { return this.productRepo.findOne({ where: { sku }, relations: ['category_link'] }); }

  private cleanData(data: any) {
      const { boms, routings, logistics, components, color, size, fabric, ...clean } = data; 
      if (!clean.attributes && (color || size || fabric)) {
          clean.attributes = { color, size, fabric };
      }
      return clean;
  }

  async create(data: Partial<Product>) { return this.productRepo.save(this.cleanData(data)); }
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
      await this.bomRepo.save(newItems as any);
      const product = await this.productRepo.findOne({ where: { id: pId } });
      if(product) await this.calculateCostPrice(product.sku);
      return { message: 'Saved' };
  }

  async getRoutings(productId: number) { return this.routingRepo.find({ where: { product_id: productId }, relations: ['supplier'] }); }
  
  // --- FIX: LOGIC SAVE ROUTING ---
  async saveRoutings(productId: number, items: any[]) {
      if (!items || !Array.isArray(items)) return [];
      const pId = Number(productId);
      await this.routingRepo.delete({ product_id: pId }); 
      
      const newItems = [];
      for (const item of items) {
          let cost = Number(item.cost) || 0;
          
          // Chỉ tự động tìm giá nếu User để trống (cost = 0) và có đủ thông tin
          if (cost === 0 && item.supplier_id && item.process_id) {
              const prices = await this.priceRepo.find({ where: { supplier_id: item.supplier_id, process_id: item.process_id } });
              const productPrice = prices.find(p => p.product_id === pId);
              const generalPrice = prices.find(p => p.product_id === null);
              
              if (productPrice) cost = Number(productPrice.price);
              else if (generalPrice) cost = Number(generalPrice.price);
          }

          newItems.push(this.routingRepo.create({
              product_id: pId,
              step_name: item.step_name,
              is_required: Boolean(item.is_required),
              supplier_id: item.supplier_id || null,
              cost: cost
          }));
      }
      const saved = await this.routingRepo.save(newItems);
      const product = await this.productRepo.findOne({ where: { id: pId } });
      if(product) await this.calculateCostPrice(product.sku);
      return saved;
  }
  // ------------------------------

  async getLogistics(productId: number) { return this.logisticRepo.find({ where: { product_id: productId } }); }
  async saveLogistics(productId: number, items: any[]) {
      if (!items || !Array.isArray(items)) return [];
      const pId = Number(productId);
      await this.logisticRepo.delete({ product_id: pId });
      const newItems = items.map(i => this.logisticRepo.create({ ...i, product_id: pId, cost: Number(i.cost) || 0 }));
      await this.logisticRepo.save(newItems as any);
      const product = await this.productRepo.findOne({ where: { id: pId } });
      if(product) await this.calculateCostPrice(product.sku);
      return { message: 'Saved' };
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
      return { message: 'Synced' };
  }

  private calculateSellingPrice(cost: number, marginPercent: number): number {
      if (marginPercent >= 100 || marginPercent < 0) return cost;
      const marginDecimal = marginPercent / 100;
      const price = cost / (1 - marginDecimal);
      return Math.ceil(price / 1000) * 1000;
  }

  async calculateCostPrice(sku: string): Promise<any> {
    const product = await this.productRepo.findOne({ where: { sku }, relations: ['category_link'] });
    if (!product) throw new NotFoundException('SP khong ton tai');

    let totalCost = 0;
    
    const components = await this.componentRepo.find({ where: { parent_product: { id: product.id } }, relations: ['child_product'] });
    if (components.length > 0) {
        for (const comp of components) totalCost += Number(comp.child_product?.cost_price ?? 0) * Number(comp.quantity);
    } else {
        const boms = await this.bomRepo.find({ where: { product_id: product.id }, relations: ['material'] });
        for (const item of boms) {
            if(item.material) {
                const waste = Number(item.waste_percent) / 100;
                totalCost += Number(item.material.cost_per_unit) * Number(item.quantity) * (1 + waste);
            }
        }
        const routings = await this.routingRepo.find({ where: { product_id: product.id } });
        routings.forEach(r => { if(r.is_required) totalCost += Number(r.cost); });
        const logistics = await this.logisticRepo.find({ where: { product_id: product.id } });
        logistics.forEach(l => { totalCost += Number(l.cost); });
    }

    totalCost = Math.round(totalCost);

    let margin = Number(product.profit_margin); 
    if (!margin && product.category_link) {
        margin = Number(product.category_link.profit_margin);
    }
    if (!margin) margin = 30;

    const sellingPrice = this.calculateSellingPrice(totalCost, margin);

    product.cost_price = totalCost;
    product.base_price = sellingPrice;
    await this.productRepo.save(product);

    return { sku, new_cost_price: totalCost, new_base_price: sellingPrice, margin_used: margin };
  }

  async updatePricesByCategory(categoryId: number, newMargin: number) {
      const products = await this.productRepo.find({ where: { category_id: categoryId } });
      for (const p of products) {
          if (!p.profit_margin) { 
              const newPrice = this.calculateSellingPrice(Number(p.cost_price), newMargin);
              p.base_price = newPrice;
              await this.productRepo.save(p);
          }
      }
  }

  async getComboComponents(sku: string) { return []; } 
  async addComponent(p:string, c:string, q:number) { return null; }
  async removeComponent(id:number) { return null; }
  async saveComponents(id:number, items:any[]) { return null; }
  async importFromExcel(b:Buffer) { return 0; }
}