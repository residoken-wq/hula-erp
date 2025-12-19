import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder, POType } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { GoodsReceipt } from './entities/goods-receipt.entity';
import { InventoryService } from '../inventory/inventory.service';
import { ProductsService } from '../products/products.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { v4 as uuidv4 } from 'uuid'; 

@Injectable()
export class PurchasingService {
  constructor(
    @InjectRepository(PurchaseOrder) private poRepo: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem) private poItemRepo: Repository<PurchaseOrderItem>,
    @InjectRepository(GoodsReceipt) private grRepo: Repository<GoodsReceipt>,
    private inventoryService: InventoryService,
    private productsService: ProductsService,
    private suppliersService: SuppliersService,
  ) {}

  // ... (Các hàm createPO, getAllPOs, getPODetail, updatePayment giữ nguyên) ...
  async createPO(data: any) {
    const po = this.poRepo.create({
      po_code: data.po_code,
      uuid: uuidv4(),
      supplier_id: data.supplier_id,
      note: data.note,
      status: 'DRAFT' as any,
      total_amount: 0,
      paid_amount: 0
    });
    
    let total = 0;
    po.items = [];
    if (data.items) {
      for (const i of data.items) {
        const item = new PurchaseOrderItem();
        item.material_id = i.material_id;
        item.product_id = i.product_id;
        item.description = i.description || '';
        item.quantity = Number(i.quantity);
        item.unit_price = Number(i.unit_price);
        item.subtotal = item.quantity * item.unit_price;
        total += item.subtotal;
        po.items.push(item);
      }
    }
    po.total_amount = total;
    return this.poRepo.save(po);
  }

  async getAllPOs() {
    return this.poRepo.find({ relations: ['supplier', 'items'], order: { created_at: 'DESC' } });
  }

  async getPODetail(id: number) {
      return this.poRepo.findOne({ where: { id }, relations: ['supplier', 'items', 'items.material', 'items.product'] });
  }

  async updatePO(id: number, data: any) {
      const po = await this.poRepo.findOne({ where: { id } });
      if(!po) throw new NotFoundException();
      // Nếu update thông tin giao NPL
      if (data.outsourcing_delivery_info) {
          po.outsourcing_delivery_info = data.outsourcing_delivery_info;
      }
      // Các trường khác
      if (data.status) po.status = data.status;
      
      return this.poRepo.save(po);
  }

  async updatePayment(poCode: string, amount: number) {
      const po = await this.poRepo.findOne({ where: { po_code: poCode } });
      if (po) {
          po.paid_amount = Number(po.paid_amount || 0) + Number(amount);
          await this.poRepo.save(po);
      }
  }

  // --- MỚI: TÍNH TOÁN NPL CẦN THIẾT CHO ĐƠN GIA CÔNG ---
  async getOutsourcingMaterials(poId: number) {
      const po = await this.poRepo.findOne({ where: { id: poId }, relations: ['items', 'items.product'] });
      if (!po || po.type !== POType.OUTSOURCING) return [];

      const materialNeeds = new Map<number, any>();

      for (const item of po.items) {
          if (item.product_id && item.product?.sku) {
              const boms = await this.productsService.getBomByProductSku(item.product.sku);
              for (const bom of boms) {
                  if (bom.material) {
                      const matId = bom.material.id;
                      const needQty = Number(bom.quantity) * Number(item.quantity) * (1 + Number(bom.waste_percent)/100);
                      
                      if (materialNeeds.has(matId)) {
                          const exist = materialNeeds.get(matId);
                          exist.quantity += needQty;
                      } else {
                          materialNeeds.set(matId, {
                              material_id: matId,
                              code: bom.material.code || bom.material.sku, // Tùy tên cột
                              name: bom.material.name,
                              unit: bom.material.unit,
                              quantity: needQty,
                              stock: Number(bom.material.quantity_in_stock || 0), // Tồn kho hiện tại
                              image: bom.material.image_url
                          });
                      }
                  }
              }
          }
      }
      return Array.from(materialNeeds.values());
  }
  // ------------------------------------------------------

  // --- FIX: BỔ SUNG HÀM DELETE MÀ TRƯỚC ĐÓ BỊ THIẾU ---
  async remove(id: number) {
      return this.poRepo.delete(id);
  }
  // ----------------------------------------------------

  async createGoodsReceipt(poId: number, data: any) {
      const po = await this.poRepo.findOne({ where: { id: poId }, relations: ['items'] });
      if (!po) throw new NotFoundException('PO not found');
      
      const gr = this.grRepo.create({
          code: data.code, purchase_order: po, received_date: data.date, note: data.note
      });
      await this.grRepo.save(gr);

      for (const item of data.items) {
          const poItem = po.items.find(pi => pi.id === item.po_item_id);
          if (!poItem) continue;
          if (poItem.material_id) {
              await this.inventoryService.adjustStock('IMPORT', 'MATERIAL', poItem.material_id, Number(item.quantity), data.code, 'Nhập từ PO ' + po.po_code, 'KHO_NPL');
          } else if (poItem.product_id) {
              await this.inventoryService.adjustStock('IMPORT', 'PRODUCT', poItem.product_id, Number(item.quantity), data.code, 'Nhập từ PO ' + po.po_code, 'KHO_TP');
          }
      }
      po.status = 'COMPLETED' as any;
      return this.poRepo.save(po);
  }
  
  async getByUuid(uuid: string) { return this.poRepo.findOne({ where: { uuid }, relations: ['supplier', 'items'] }); }
  async supplierAction(uuid: string, action: string, note?: string) { return null; }
}