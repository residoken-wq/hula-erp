import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { GoodsReceipt } from './entities/goods-receipt.entity';
import { InventoryService } from '../inventory/inventory.service';
import { ProductsService } from '../products/products.service';
import { SuppliersService } from '../suppliers/suppliers.service';

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
      supplier_id: data.supplier_id,
      expected_date: data.expected_date,
      note: data.note,
      status: 'PENDING',
      total_amount: 0
    });
    
    let total = 0;
    po.items = [];

    if (data.items) {
      for (const i of data.items) {
        const item = new PurchaseOrderItem();
        item.type = i.type; // 'PRODUCT' | 'MATERIAL'
        item.product_id = i.product_id;
        item.material_id = i.material_id;
        item.quantity = i.quantity;
        item.unit_price = i.unit_price;
        item.subtotal = i.quantity * i.unit_price;
        total += item.subtotal;
        po.items.push(item);
      }
    }
    po.total_amount = total;
    return this.poRepo.save(po);
  }

  async getAllPOs() {
    return this.poRepo.find({ 
        relations: ['supplier', 'items'], 
        order: { created_at: 'DESC' } 
    });
  }

  async getPODetail(id: number) {
      return this.poRepo.findOne({ where: { id }, relations: ['supplier', 'items'] });
  }

  // --- HÀM TẠO PHIẾU NHẬP KHO (GRN) ---
  async createGoodsReceipt(poId: number, data: any) {
      const po = await this.poRepo.findOne({ where: { id: poId }, relations: ['items'] });
      if (!po) throw new NotFoundException('PO not found');

      // Tạo phiếu nhập
      const gr = this.grRepo.create({
          code: data.code,
          purchase_order: po,
          received_date: data.date,
          note: data.note
      });
      await this.grRepo.save(gr);

      // Cập nhật tồn kho
      for (const item of data.items) {
          const poItem = po.items.find(pi => pi.id === item.po_item_id);
          if (!poItem) continue;

          // Cập nhật số lượng đã nhập trong PO Item (nếu có cột received_qty)
          // poItem.received_qty += item.quantity;
          // await this.poItemRepo.save(poItem);

          // --- FIX LỖI Ở ĐÂY: Thêm tham số warehouse ---
          if (poItem.type === 'MATERIAL') {
              await this.inventoryService.adjustStock(
                  'IMPORT', 
                  'MATERIAL', 
                  poItem.material_id, 
                  Number(item.quantity), 
                  data.code, 
                  'Nhập từ PO ' + po.po_code,
                  'KHO_NPL' // <--- MẶC ĐỊNH VÀO KHO NGUYÊN LIỆU
              );
          } else {
              await this.inventoryService.adjustStock(
                  'IMPORT', 
                  'PRODUCT', 
                  poItem.product_id, 
                  Number(item.quantity), 
                  data.code, 
                  'Nhập từ PO ' + po.po_code,
                  'KHO_TP' // <--- MẶC ĐỊNH VÀO KHO THÀNH PHẨM (Hàng thương mại)
              );
          }
          // ---------------------------------------------
      }

      // Cập nhật trạng thái PO
      po.status = 'COMPLETED'; // Logic đơn giản, thực tế cần check số lượng
      await this.poRepo.save(po);

      return gr;
  }
}