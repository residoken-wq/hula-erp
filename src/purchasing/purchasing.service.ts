import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { GoodsReceipt } from './entities/goods-receipt.entity';
import { InventoryService } from '../inventory/inventory.service';
import { ProductsService } from '../products/products.service';
import { SuppliersService } from '../suppliers/suppliers.service';
// import { v4 as uuidv4 } from 'uuid'; // Entity đã tự sinh UUID, có thể bỏ

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

  async createPO(data: any) {
    const po = this.poRepo.create({
      po_code: data.po_code,
      supplier_id: data.supplier_id, // Lưu ID nhà cung cấp
      note: data.note,
      status: 'DRAFT' as any,
      total_amount: 0,
      paid_amount: 0 // Khởi tạo 0
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
    return this.poRepo.find({ 
        relations: ['supplier', 'items'], // Load Supplier để hiển thị tên
        order: { created_at: 'DESC' } 
    });
  }

  async getPODetail(id: number) {
      return this.poRepo.findOne({ where: { id }, relations: ['supplier', 'items', 'items.material', 'items.product'] });
  }

  async updatePO(id: number, data: any) {
      const po = await this.poRepo.findOne({ where: { id } });
      if(!po) throw new NotFoundException();
      return this.poRepo.save({ ...po, ...data });
  }

  async getByUuid(uuid: string) {
      return this.poRepo.findOne({ where: { uuid }, relations: ['supplier', 'items'] });
  }

  async supplierAction(uuid: string, action: string, note?: string) {
      const po = await this.poRepo.findOne({ where: { uuid } });
      if(!po) throw new NotFoundException();
      if(action === 'CONFIRM') po.status = 'CONFIRMED' as any;
      if(action === 'REJECT') po.status = 'CANCELLED' as any;
      po.note = note ? `${po.note || ''}\nSupplier: ${note}` : po.note;
      return this.poRepo.save(po);
  }

  // --- HÀM CẬP NHẬT THANH TOÁN (ĐƯỢC GỌI TỪ FINANCE) ---
  async updatePayment(poCode: string, amount: number) {
      const po = await this.poRepo.findOne({ where: { po_code: poCode } });
      if (po) {
          po.paid_amount = Number(po.paid_amount || 0) + Number(amount);
          await this.poRepo.save(po);
      }
  }
  // -----------------------------------------------------

  async createGoodsReceipt(poId: number, data: any) {
      const po = await this.poRepo.findOne({ where: { id: poId }, relations: ['items'] });
      if (!po) throw new NotFoundException('PO not found');

      const gr = this.grRepo.create({
          code: data.code,
          purchase_order: po,
          received_date: data.date,
          note: data.note
      });
      await this.grRepo.save(gr);

      for (const item of data.items) {
          const poItem = po.items.find(pi => pi.id === item.po_item_id);
          if (!poItem) continue;

          if (poItem.material_id) {
              await this.inventoryService.adjustStock(
                  'IMPORT', 'MATERIAL', poItem.material_id, Number(item.quantity), data.code, 'Nhập từ PO ' + po.po_code, 
                  'KHO_NPL' 
              );
          } else if (poItem.product_id) {
              await this.inventoryService.adjustStock(
                  'IMPORT', 'PRODUCT', poItem.product_id, Number(item.quantity), data.code, 'Nhập từ PO ' + po.po_code, 
                  'KHO_TP' 
              );
          }
      }
      po.status = 'COMPLETED' as any;
      return this.poRepo.save(po);
  }
}