import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockHistory } from './stock-history.entity';
import { InventoryStock } from './inventory-stock.entity';
import { Product } from '../products/product.entity';
import { Material } from '../materials/material.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(StockHistory) private historyRepo: Repository<StockHistory>,
    @InjectRepository(InventoryStock) private stockRepo: Repository<InventoryStock>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Material) private materialRepo: Repository<Material>,
  ) { }

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

    // 4. Cập nhật Tổng Tồn vào Master (để hiển thị nhanh)
    // Tính tổng lại từ bảng inventory_stock cho chính xác
    const allStocks = await this.stockRepo.find({ where: { item_type: itemType, item_id: itemId } });
    const totalQty = allStocks.reduce((sum, s) => sum + Number(s.quantity), 0);

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
}