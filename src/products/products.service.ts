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

  // --- VERSION "SIÊU AN TOÀN" ---
  async saveBoms(productId: number, items: any[]) {
      // 1. Ép kiểu Product ID về số nguyên
      const pId = Number(productId);
      if (isNaN(pId)) {
          console.error('Lỗi: Product ID không hợp lệ:', productId);
          throw new Error('Invalid Product ID');
      }

      console.log(`Bắt đầu lưu BOM cho Product ${pId}. Số lượng item: ${items?.length}`);

      // 2. Xóa BOM cũ (Dùng transaction để an toàn - nhưng ở đây dùng lệnh đơn giản trước)
      await this.bomRepo.delete({ product_id: pId }); 
      
      if (!items || !Array.isArray(items) || items.length === 0) {
          return { message: 'Đã xóa BOM cũ (Không có dữ liệu mới)' };
      }

      // 3. Chuẩn hóa từng dòng dữ liệu
      const entities = [];
      for (const item of items) {
          // Bỏ qua nếu không có material_id
          if (!item.material_id) continue;

          const mId = Number(item.material_id);
          const qty = Number(item.quantity);
          const waste = Number(item.waste_percent);

          // Kiểm tra kỹ dữ liệu rác
          if (isNaN(mId)) {
              console.warn('Bỏ qua dòng có Material ID sai:', item);
              continue;
          }

          // Tạo đối tượng BOM mới
          const bom = new BOM();
          bom.product_id = pId;
          bom.material_id = mId;
          bom.quantity = isNaN(qty) ? 0 : qty;
          bom.waste_percent = isNaN(waste) ? 0 : waste;
          
          entities.push(bom);
      }

      if (entities.length === 0) {
          return { message: 'Không có dòng BOM hợp lệ nào để lưu' };
      }

      // 4. Lưu vào DB
      try {
          const saved = await this.bomRepo.save(entities);
          console.log(`Đã lưu thành công ${saved.length} dòng BOM.`);
          
          // 5. Tự động tính lại giá vốn ngay lập tức
          await this.calculateCostPrice(String(pId)); // Gọi hàm tính giá (có thể cần sửa tham số này nếu hàm calculate nhận SKU)
          
          return saved;
      } catch (error) {
          console.error('CRITICAL ERROR SAVE BOM:', error);
          throw new Error('Lỗi Database khi lưu BOM: ' + error.message);
      }
  }

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
