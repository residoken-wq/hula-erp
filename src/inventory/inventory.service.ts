import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockHistory } from './stock-history.entity';
import { InventoryStock } from './inventory-stock.entity';
import { GoodsReceipt, GoodsReceiptStatus } from './entities/goods-receipt.entity';
import { GoodsReceiptItem } from './entities/goods-receipt-item.entity';
import { ShippingCarrier } from './entities/shipping-carrier.entity';
import { Product } from '../products/product.entity';
import { Material } from '../materials/material.entity';
import { Supplier } from '../suppliers/supplier.entity';
import { PurchaseOrder } from '../purchasing/entities/purchase-order.entity';
import { PurchaseOrderItem } from '../purchasing/entities/purchase-order-item.entity';
import { SalesDelivery } from '../sales/sales-delivery.entity';
import { ProductsService } from '../products/products.service';
import { GoodsIssue, GoodsIssueStatus } from './entities/goods-issue.entity';
import { GoodsIssueItem } from './entities/goods-issue-item.entity';
import * as dayjs from 'dayjs';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(StockHistory) private historyRepo: Repository<StockHistory>,
    @InjectRepository(InventoryStock) private stockRepo: Repository<InventoryStock>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Material) private materialRepo: Repository<Material>,
    @InjectRepository(GoodsReceipt) private receiptRepo: Repository<GoodsReceipt>,
    @InjectRepository(GoodsReceiptItem) private receiptItemRepo: Repository<GoodsReceiptItem>,
    @InjectRepository(ShippingCarrier) private carrierRepo: Repository<ShippingCarrier>,
    @InjectRepository(Supplier) private supplierRepo: Repository<Supplier>,
    @InjectRepository(PurchaseOrder) private poRepo: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem) private poItemRepo: Repository<PurchaseOrderItem>,
    @InjectRepository(SalesDelivery) private deliveryRepo: Repository<SalesDelivery>,
    @InjectRepository(GoodsIssue) private goodsIssueRepo: Repository<GoodsIssue>,
    @InjectRepository(GoodsIssueItem) private giItemRepo: Repository<GoodsIssueItem>,
    private productsService: ProductsService,
  ) { }

  // --- SHIPPING CARRIER MANAGEMENT ---
  async getAllShippingCarriers() {
    return this.carrierRepo.find({ order: { name: 'ASC' } });
  }

  async createShippingCarrier(data: Partial<ShippingCarrier>) {
    const carrier = this.carrierRepo.create(data);
    return this.carrierRepo.save(carrier);
  }

  async updateShippingCarrier(id: number, data: Partial<ShippingCarrier>) {
    await this.carrierRepo.update(id, data);
    return this.carrierRepo.findOne({ where: { id } });
  }

  async deleteShippingCarrier(id: number) {
    await this.carrierRepo.delete(id);
    return { success: true, message: 'Đã xóa đơn vị vận chuyển' };
  }

  // Lấy chi tiết tồn kho của tất cả item
  async getAllStocks() {
    return this.stockRepo.find();
  }

  async getHistory() {
    return this.historyRepo.find({ order: { created_at: 'DESC' }, take: 100 });
  }

  async adjustStock(
    type: 'IMPORT' | 'EXPORT',
    itemType: 'PRODUCT' | 'MATERIAL',
    itemId: number,
    quantity: number,
    refCode: string,
    note: string,
    warehouse: string // <--- Tham số mới
  ) {
    if (!warehouse) throw new BadRequestException('Chưa chọn kho');

    let masterItem: any;
    let itemCode = '';

    // 1. Kiểm tra Item Master
    if (itemType === 'PRODUCT') {
      masterItem = await this.productRepo.findOne({ where: { id: itemId } });
      if (!masterItem) throw new BadRequestException('SP không tồn tại');
      itemCode = masterItem.sku;
    } else {
      masterItem = await this.materialRepo.findOne({ where: { id: itemId } });
      if (!masterItem) throw new BadRequestException('NPL không tồn tại');
      itemCode = masterItem.code;
    }

    // 2. Lấy hoặc Tạo record tồn kho cho KHO CỤ THỂ
    let stockRecord = await this.stockRepo.findOne({
      where: { item_type: itemType, item_id: itemId, warehouse_code: warehouse }
    });

    if (!stockRecord) {
      stockRecord = this.stockRepo.create({
        item_type: itemType, item_id: itemId, warehouse_code: warehouse, quantity: 0
      });
    }

    // 3. Tính toán
    const change = type === 'IMPORT' ? Number(quantity) : -Number(quantity);
    stockRecord.quantity = Number(stockRecord.quantity) + change;

    // Nếu xuất quá tồn kho (tùy nghiệp vụ, ở đây cho phép âm hoặc chặn)
    // if (stockRecord.quantity < 0) throw new BadRequestException('Không đủ tồn kho để xuất');

    await this.stockRepo.save(stockRecord);

    // 4. Cập nhật Tổng Tồn vào Master (để hiển thị nhanh - Bỏ qua KHO_MAU)
    // Tính tổng lại từ bảng inventory_stock cho chính xác
    const allStocks = await this.stockRepo.find({ where: { item_type: itemType, item_id: itemId } });
    const totalQty = allStocks
      .filter(s => s.warehouse_code !== 'KHO_MAU')
      .reduce((sum, s) => sum + Number(s.quantity), 0);

    if (itemType === 'PRODUCT') {
      await this.productRepo.update(itemId, { quantity_in_stock: totalQty });
    } else {
      await this.materialRepo.update(itemId, { quantity_in_stock: totalQty });
    }

    // 5. Ghi Log
    const history = this.historyRepo.create({
      type, item_type: itemType, item_id: itemId, item_code: itemCode,
      quantity: quantity,
      balance_after: stockRecord.quantity, // Balance của riêng kho này
      warehouse: warehouse, // Ghi nhận kho
      reference_code: refCode || 'MANUAL',
      note
    });

    return this.historyRepo.save(history);
  }

  // --- HÀM RESET DỮ LIỆU TỒN KHO ---
  async resetAllStocks() {
    // 1. Xóa lịch sử
    await this.historyRepo.clear();

    // 2. Xóa chi tiết tồn kho
    await this.stockRepo.clear();

    // 3. Reset Master Data về 0
    await this.productRepo.createQueryBuilder().update().set({ quantity_in_stock: 0 }).execute();
    await this.materialRepo.createQueryBuilder().update().set({ quantity_in_stock: 0 }).execute();

    return { message: 'Đã reset toàn bộ tồn kho về 0' };
  }

  // --- HÀM CHUYỂN KHO (ATOMIC) ---
  async transferStock(
    itemType: 'PRODUCT' | 'MATERIAL',
    itemId: number,
    quantity: number,
    fromWh: string,
    toWh: string,
    note: string
  ) {
    if (!fromWh || !toWh) throw new BadRequestException('Vui lòng chọn đủ 2 kho');
    if (fromWh === toWh) throw new BadRequestException('Kho đi và kho đến phải khác nhau');

    // 1. Kiểm tra tồn kho tại kho đi (Optional: Nếu muốn chặn âm)
    // const stockSrc = await this.stockRepo.findOne({ where: { item_type: itemType, item_id: itemId, warehouse_code: fromWh } });
    // if (!stockSrc || Number(stockSrc.quantity) < quantity) throw new BadRequestException('Kho nguồn không đủ tồn');

    // 2. Thực hiện chuyển (Transaction logic could be better, but reuse adjustStock is safe enough for now)
    // Xuất kho nguồn
    await this.adjustStock('EXPORT', itemType, itemId, quantity, `TRANSFER_OUT`, `Chuyển tới ${toWh}: ${note}`, fromWh);

    // Nhập kho đích
    await this.adjustStock('IMPORT', itemType, itemId, quantity, `TRANSFER_IN`, `Nhận từ ${fromWh}: ${note}`, toWh);

    return { message: 'Chuyển kho thành công' };
  }

  // --- GOODS RECEIPT FLOW ---

  async createDraftReceipt(data: { po_id: number; items: any[]; note?: string }) {
    // 1. Create Header
    const receipt = this.receiptRepo.create({
      code: `PNK-${Date.now()}`,
      po_id: data.po_id,
      status: GoodsReceiptStatus.DRAFT,
      note: data.note
    });
    await this.receiptRepo.save(receipt);

    // 2. Create Items
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        const rItem = this.receiptItemRepo.create({
          receipt: receipt,
          material_id: item.material_id, // Assuming material PO for now
          po_item_id: item.po_item_id,
          quantity: item.quantity
        });
        await this.receiptItemRepo.save(rItem);
      }
    }

    return receipt;
  }

  async getPendingReceipts() {
    return this.receiptRepo.find({
      where: { status: GoodsReceiptStatus.DRAFT },
      relations: ['items', 'items.material', 'purchase_order', 'purchase_order.supplier'],
      order: { created_at: 'DESC' }
    });
  }

  async confirmReceipt(id: number, warehouseCode: string = 'KHO_NPL') {
    const receipt = await this.receiptRepo.findOne({
      where: { id },
      relations: ['items', 'purchase_order', 'purchase_order.items']
    });
    if (!receipt) throw new BadRequestException('Phiếu nhập không tồn tại');
    if (receipt.status !== GoodsReceiptStatus.DRAFT) throw new BadRequestException('Phiếu đã xử lý');

    // 1. Loop items and import to stock
    let totalValue = 0;

    for (const item of receipt.items) {
      if (item.material_id) {
        await this.adjustStock(
          'IMPORT',
          'MATERIAL',
          item.material_id,
          item.quantity,
          receipt.code,
          `Nhập kho từ PO ${receipt.po_id ? '#' + receipt.po_id : ''}`,
          warehouseCode
        );

        // Calculate Debt: Find PO Price
        if (receipt.po_id && item.po_item_id) {
          const poItem = await this.poItemRepo.findOne({ where: { id: item.po_item_id } });
          if (poItem) {
            totalValue += Number(item.quantity) * Number(poItem.unit_price);
          }
        }
      }
    }

    // 2. Update Supplier Debt
    if (receipt.purchase_order && receipt.purchase_order.supplier_id && totalValue > 0) {
      const supplier = await this.supplierRepo.findOne({ where: { id: receipt.purchase_order.supplier_id } });
      if (supplier) {
        supplier.debt = Number(supplier.debt || 0) + totalValue;
        await this.supplierRepo.save(supplier);
      }
    }

    // 3. Update Receipt Status
    receipt.delivery_date = new Date().toISOString();
    receipt.status = GoodsReceiptStatus.COMPLETED;
    await this.receiptRepo.save(receipt);

    // 4. --- MỚI: Auto-detect Partial / Full Delivery → Update PO Status ---
    if (receipt.po_id && receipt.purchase_order) {
      await this.updatePODeliveryStatus(receipt.po_id);
    }

    return { message: 'Đã nhập kho thành công', receipt };
  }

  // --- MỚI: Kiểm tra và cập nhật PO delivery status ---
  private async updatePODeliveryStatus(poId: number) {
    try {
      const po = await this.poRepo.findOne({ where: { id: poId }, relations: ['items'] });
      if (!po || !po.items || po.items.length === 0) return;

      // Lấy tất cả phiếu nhập đã confirmed cho PO này
      const allReceipts = await this.receiptRepo.find({
        where: { po_id: poId, status: GoodsReceiptStatus.COMPLETED },
        relations: ['items']
      });

      // Tính tổng đã nhận per PO item
      const totalReceived = new Map<number, number>();
      for (const gr of allReceipts) {
        for (const ri of (gr.items || [])) {
          if (ri.po_item_id) {
            totalReceived.set(
              ri.po_item_id,
              (totalReceived.get(ri.po_item_id) || 0) + Number(ri.quantity)
            );
          }
        }
      }

      // So sánh vs PO items
      let allDelivered = true;
      let anyDelivered = false;

      for (const poItem of po.items) {
        const received = totalReceived.get(poItem.id) || 0;
        if (received > 0) anyDelivered = true;
        if (received < Number(poItem.quantity) * 0.95) allDelivered = false; // Tolerance 5%
      }

      // Update PO status
      if (allDelivered) {
        po.status = 'DELIVERED' as any;
      } else if (anyDelivered) {
        po.status = 'PARTIAL_DELIVERED' as any;
      }
      // Nếu chưa giao gì thì giữ nguyên status

      await this.poRepo.save(po);
    } catch (e) {
      console.error('Auto-update PO delivery status failed:', e);
      // Không throw — không block nhập kho
    }
  }

  // --- SALES DELIVERY CONFIRMATION FLOW ---

  async getPendingDeliveries() {
    return this.deliveryRepo.find({
      where: { status: 'PENDING_EXPORT' }, // Or whatever status was set in SalesService
      relations: ['sales_order', 'sales_order.customer', 'items'],
      order: { created_at: 'ASC' }
    });
  }

  async confirmStockExport(deliveryId: number, warehouseCode: string = 'KHO_TP') {
    const delivery = await this.deliveryRepo.findOne({
      where: { id: deliveryId },
      relations: ['items', 'sales_order']
    });

    if (!delivery) throw new BadRequestException('Phiếu xuất không tồn tại');
    if (delivery.status !== 'PENDING_EXPORT') throw new BadRequestException('Phiếu đã xử lý hoặc không ở trạng thái chờ xuất');

    // Loop items and deduct stock
    for (const item of delivery.items) {
      if (!item.sku) continue;

      const product = await this.productRepo.findOne({ where: { sku: item.sku } });
      if (product) {
        try {
          // Check if Combo (has components)
          const components = await this.productsService.getComboComponents(item.sku);

          if (components && components.length > 0) {
            // Is Combo -> Deduct Components
            for (const comp of components) {
              if (comp.child_product) {
                await this.adjustStock(
                  'EXPORT',
                  'PRODUCT',
                  comp.child_product.id,
                  Number(item.quantity) * Number(comp.quantity),
                  delivery.code,
                  `Xuất Combo ${item.sku} (Đơn ${delivery.sales_order?.order_code})`,
                  warehouseCode
                );
              }
            }
          } else {
            // Is Single Product -> Deduct Itself
            await this.adjustStock(
              'EXPORT',
              'PRODUCT',
              product.id,
              Number(item.quantity),
              delivery.code,
              `Giao hàng đơn ${delivery.sales_order?.order_code}`,
              warehouseCode
            );
          }

        } catch (e) {
          // Log error but generally we might want to stop? 
          // For now continue best effort or throw?
          // Let's throw to ensure data integrity
          throw new BadRequestException(`Lỗi xuất kho ${item.sku}: ${e.message}`);
        }
      }
    }

    // Update Status
    delivery.status = 'SHIPPED'; // Or DELIVERING if you want another step? Plan said SHIPPED.
    // NOTE: SHIPPED means Stock Deducted. Then SalesService can send email later?
    // Current SalesService.sendDeliveryEmail sets status to SHIPPED too.
    // If we set SHIPPED here, sendDeliveryEmail might process it again?
    // SalesService.sendDeliveryEmail checks: delivery.email_sent = true.
    // It is fine.

    await this.deliveryRepo.save(delivery);

    return { message: 'Đã xuất kho thành công', delivery };
  }

  // ==========================================
  // --- GOODS ISSUE (PHIẾU XUẤT KHO NPL) ---
  // ==========================================

  async createGoodsIssue(data: any) {
    const gi = this.goodsIssueRepo.create({
      code: data.code || `PXK-${dayjs().format('YYMMDD')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      type: data.type || 'OUTSOURCING',
      delivery_mode: data.delivery_mode || 'PER_ORDER',
      po_id: data.po_id || null,
      supplier_id: data.supplier_id || null,
      plan_id: data.plan_id || null,
      issue_date: data.issue_date || dayjs().format('YYYY-MM-DD'),
      vehicle: data.vehicle || null,
      note: data.note || null,
      status: GoodsIssueStatus.DRAFT
    });
    const saved = await this.goodsIssueRepo.save(gi);

    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        const giItem = this.giItemRepo.create({
          issue_id: saved.id,
          material_id: item.material_id,
          quantity: Number(item.quantity),
          material_category: item.material_category || null,
          note: item.note || null
        });
        await this.giItemRepo.save(giItem);
      }
    }

    return this.goodsIssueRepo.findOne({ where: { id: saved.id }, relations: ['items', 'items.material', 'supplier'] });
  }

  async getGoodsIssues(query?: { po_id?: number; supplier_id?: number }) {
    const where: any = {};
    if (query?.po_id) where.po_id = query.po_id;
    if (query?.supplier_id) where.supplier_id = query.supplier_id;

    return this.goodsIssueRepo.find({
      where,
      relations: ['items', 'items.material', 'supplier', 'purchase_order'],
      order: { created_at: 'DESC' }
    });
  }

  async getGoodsIssueDetail(id: number) {
    const gi = await this.goodsIssueRepo.findOne({
      where: { id },
      relations: ['items', 'items.material', 'supplier', 'purchase_order']
    });
    if (!gi) throw new BadRequestException('Phiếu xuất kho không tồn tại');
    return gi;
  }

  async confirmGoodsIssue(id: number) {
    const gi = await this.goodsIssueRepo.findOne({
      where: { id },
      relations: ['items', 'items.material']
    });
    if (!gi) throw new BadRequestException('Phiếu xuất kho không tồn tại');
    if (gi.status !== GoodsIssueStatus.DRAFT) throw new BadRequestException('Phiếu đã xử lý');

    // Xuất kho thực tế từng NPL
    for (const item of gi.items) {
      if (item.material_id) {
        await this.adjustStock(
          'EXPORT', 'MATERIAL', item.material_id,
          Number(item.quantity), gi.code,
          `Xuất cho GC: ${gi.note || gi.code}`,
          'KHO_NPL'
        );
      }
    }

    gi.status = GoodsIssueStatus.CONFIRMED;
    return this.goodsIssueRepo.save(gi);
  }

  async markGoodsIssueDelivered(id: number) {
    const gi = await this.goodsIssueRepo.findOne({ where: { id } });
    if (!gi) throw new BadRequestException('Phiếu xuất kho không tồn tại');
    gi.status = GoodsIssueStatus.DELIVERED;
    return this.goodsIssueRepo.save(gi);
  }

  async deleteGoodsIssue(id: number) {
    const gi = await this.goodsIssueRepo.findOne({ where: { id } });
    if (!gi) throw new BadRequestException('Phiếu xuất kho không tồn tại');
    if (gi.status !== GoodsIssueStatus.DRAFT) throw new BadRequestException('Chỉ xóa được phiếu nháp');
    await this.goodsIssueRepo.delete(id);
    return { success: true };
  }
}