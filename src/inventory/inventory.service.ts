import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockHistory } from './stock-history.entity';
import { Product } from '../products/product.entity';
import { Material } from '../materials/material.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(StockHistory) private stockRepo: Repository<StockHistory>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Material) private materialRepo: Repository<Material>,
  ) {}

  // --- MỚI: LẤY LỊCH SỬ GIAO DỊCH ---
  async getHistory() {
    // Lấy 100 giao dịch gần nhất, sắp xếp mới nhất trước
    return this.stockRepo.find({
        order: { created_at: 'DESC' },
        take: 100 
    });
  }
  // ----------------------------------

  async adjustStock(
    type: 'IMPORT' | 'EXPORT',
    itemType: 'PRODUCT' | 'MATERIAL',
    itemId: number,
    quantity: number,
    refCode: string,
    note: string
  ) {
    if (!type) throw new BadRequestException('Thiếu loại giao dịch (IMPORT/EXPORT)');
    if (!itemId) throw new BadRequestException('Thiếu ID sản phẩm/nguyen lieu');

    let currentStock = 0;
    let itemCode = '';
    let itemName = ''; // Lưu thêm tên để dễ trace (nếu entity hỗ trợ, ở đây tạm dùng logic cũ)

    // 1. Cập nhật Master Data
    if (itemType === 'PRODUCT') {
      const product = await this.productRepo.findOne({ where: { id: itemId } });
      if (!product) throw new BadRequestException('Không tìm thấy sản phẩm ID: ' + itemId);
      
      const change = type === 'IMPORT' ? Number(quantity) : -Number(quantity);
      product.quantity_in_stock = Number(product.quantity_in_stock || 0) + change;
      
      await this.productRepo.save(product);
      currentStock = product.quantity_in_stock;
      itemCode = product.sku;
    } else {
      const material = await this.materialRepo.findOne({ where: { id: itemId } });
      if (!material) throw new BadRequestException('Không tìm thấy nguyên liệu ID: ' + itemId);

      const change = type === 'IMPORT' ? Number(quantity) : -Number(quantity);
      material.quantity_in_stock = Number(material.quantity_in_stock || 0) + change;
      
      await this.materialRepo.save(material);
      currentStock = material.quantity_in_stock;
      itemCode = material.code;
    }

    // 2. Ghi Log
    const history = new StockHistory();
    history.type = type;
    history.item_type = itemType;
    history.item_id = itemId;
    history.item_code = itemCode;
    history.quantity = quantity;
    history.balance_after = currentStock;
    history.reference_code = refCode || 'MANUAL'; // Mặc định là Manual nếu ko có reference
    history.note = note || '';

    return this.stockRepo.save(history);
  }
}