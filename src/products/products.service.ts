import { Injectable, NotFoundException, Inject, forwardRef, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Product } from './product.entity';
import { BOM } from '../bom/bom.entity';
import { ProductComponent } from './product-component.entity';
import { ProductRouting } from './product-routing.entity';
import { ProductLogistics } from './product-logistics.entity';
import { Supplier } from '../suppliers/supplier.entity';
import { SupplierMaterial } from '../suppliers/supplier-material.entity';
import { CategoriesService } from '../categories/categories.service';
import { CreateVariantDto } from './dto/create-variant.dto'; 

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
      return this.productRepo.find({ order: { id: 'DESC' }, relations: ['category_link'] }); 
  }
  
  async findOne(id: number) { 
      return this.productRepo.findOne({ where: { id }, relations: ['category_link'] }); 
  }
  
  async findOneBySku(sku: string) { return this.productRepo.findOne({ where: { sku }, relations: ['category_link'] }); }

  private cleanData(data: any) {
      const { boms, routings, logistics, components, color, size, fabric, customer_description, processing_description, ...clean } = data; 
      
      clean.customer_description = customer_description;
      clean.processing_description = processing_description;
      
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

  // --- HÀM TẠO BIẾN THỂ ---
  async createVariant(createVariantDto: CreateVariantDto): Promise<Product> {
    const { baseSku, newSku, newName, attributes } = createVariantDto;

    const baseProduct = await this.productRepo.findOne({ where: { sku: baseSku } });
    if (!baseProduct) {
      throw new NotFoundException(`Sản phẩm gốc với SKU "${baseSku}" không tồn tại.`);
    }

    const existingProduct = await this.productRepo.findOne({ where: { sku: newSku } });
    if (existingProduct) {
        throw new ConflictException(`SKU biến thể "${newSku}" đã tồn tại.`);
    }

    const { routings, logistics, components, ...baseProductClone } = baseProduct as any;

    const newVariant = this.productRepo.create({
      ...baseProductClone, 
      id: undefined, 
      sku: newSku,
      name: newName || baseProduct.name,
      attributes: attributes, 
      quantity_in_stock: 0, 
      cost_price: 0,
      category_link: baseProduct.category_link 
    });

    const savedVariant = await this.productRepo.save(newVariant) as unknown as Product; 

    // Sao chép BOM
    const baseBoms = await this.bomRepo.find({ where: { product_id: baseProduct.id } });
    if(baseBoms.length > 0) {
        const newBoms = baseBoms.map(b => this.bomRepo.create({ ...b, id: undefined, product_id: savedVariant.id }));
        await this.bomRepo.save(newBoms as any);
    }
    
    // Sao chép Routing
    const baseRoutings = await this.routingRepo.find({ where: { product_id: baseProduct.id } });
    if(baseRoutings.length > 0) {
        const newRoutings = baseRoutings.map(r => this.routingRepo.create({ ...r, id: undefined, product_id: savedVariant.id }));
        await this.routingRepo.save(newRoutings as any);
    }

    // Sao chép Logistics
    const baseLogistics = await this.logisticRepo.find({ where: { product_id: baseProduct.id } });
    if(baseLogistics.length > 0) {
        const newLogistics = baseLogistics.map(l => this.logisticRepo.create({ ...l, id: undefined, product_id: savedVariant.id }));
        await this.logisticRepo.save(newLogistics as any);
    }

    await this.calculateCostPrice(savedVariant.sku); 
    return savedVariant; 
  }

  // --- HÀM QUAN TRỌNG: Lấy BOM cho Production Service ---
  async getProductBOM(sku: string): Promise<BOM[]> {
    const product = await this.productRepo.findOne({ where: { sku } });
    if (!product) return [];
    
    return this.bomRepo.find({ 
        where: { product: { id: product.id } },
        relations: ['material']
    });
  }
  // ------------------------------------------------------

  async getBomByProductSku(sku: string): Promise<BOM[]> {
    return this.getProductBOM(sku); // Alias về hàm chuẩn
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

  async getRoutings(productId: number) { 
      return this.routingRepo.find({ 
          where: { product_id: productId }, 
          relations: ['supplier', 'process'] 
      }); 
  }
  
  async saveRoutings(productId: number, items: any[]) {
      if (!items || !Array.isArray(items)) return [];
      const pId = Number(productId);
      await this.routingRepo.delete({ product_id: pId }); 
      
      const newItems: DeepPartial<ProductRouting>[] = [];

      for (const item of items) {
          let cost = Number(item.cost) || 0;
          
          if (cost === 0 && item.supplier_id && item.process_id) {
              const prices = await this.priceRepo.find({ 
                  where: { supplier_id: item.supplier_id, process_id: item.process_id } 
              });
              const productPrice = prices.find(p => p.product_id === pId);
              const generalPrice = prices.find(p => p.product_id === null);
              if (productPrice) cost = Number(productPrice.price);
              else if (generalPrice) cost = Number(generalPrice.price);
          }
          
          newItems.push({
              product_id: pId,
              process_id: item.process_id || null, 
              supplier_id: item.supplier_id || null,
              step_name: item.step_name,
              cost: cost,
              is_required: Boolean(item.is_required) 
          } as DeepPartial<ProductRouting>);
      }
      
      const saved = await this.routingRepo.save(newItems as ProductRouting[]);
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
          if(sourceRoutings.length) {
              const newRoutings = sourceRoutings.map(r => this.routingRepo.create({ 
                  ...r, 
                  id: undefined, 
                  product_id: target.id,
                  product: { id: target.id } as Product 
              }));
              await this.routingRepo.save(newRoutings as any);
          }
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
    
    // Check Combo
    const components = await this.componentRepo.find({ 
        where: { parent_product: { id: product.id } }, 
        relations: ['child_product'] 
    });
    
    if (components.length > 0) {
        for (const comp of components) {
            totalCost += Number(comp.child_product?.base_price ?? 0) * Number(comp.quantity);
        }
    } else {
        // BOM
        const boms = await this.bomRepo.find({ where: { product_id: product.id }, relations: ['material'] });
        for (const item of boms) {
            if(item.material) {
                const waste = Number(item.waste_percent) / 100;
                const materialCost = Number(item.material.cost_price || item.material.cost_per_unit);
                totalCost += materialCost * Number(item.quantity) * (1 + waste);
            }
        }
        // Routing
        const routings = await this.routingRepo.find({ where: { product_id: product.id } });
        routings.forEach(r => { 
            if(r.is_required) totalCost += Number(r.cost); 
        });
        // Logistics
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
      if (!parent || !child) throw new NotFoundException('SP khong ton tai');

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

  async saveComponents(productId: number, items: any[]) {
      if (!items || !Array.isArray(items)) return [];
      const pId = Number(productId);
      
      await this.componentRepo.delete({ parent_product: { id: pId } });

      for (const item of items) {
          const child = await this.productRepo.findOne({ where: { sku: item.sku } });
          if(child) {
              await this.componentRepo.save(this.componentRepo.create({
                  parent_product: { id: pId },
                  child_product: child,
                  quantity: Number(item.quantity)
              }));
          }
      }

      const parent = await this.productRepo.findOne({ where: { id: pId } });
      if(parent) await this.calculateCostPrice(parent.sku);
      
      return { message: 'Updated' };
  }
  
  async importFromExcel(b:Buffer) { return 0; }
}