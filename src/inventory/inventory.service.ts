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

  async adjustStock(
    type: 'IMPORT' | 'EXPORT',
    itemType: 'PRODUCT' | 'MATERIAL',
    itemId: number,
    quantity: number,
    refCode: string,
    note: string
  ) {
    // --- KIEM TRA DAU VAO (FIX LOI NULL) ---
    if (!type) {
        console.error('LOI: Thieu tham so TYPE');
        throw new BadRequestException('Loai giao dich (type) khong duoc de trong! (IMPORT hoac EXPORT)');
    }
    if (!itemId) {
        throw new BadRequestException('Thieu ID san pham/nguyen lieu (itemId)');
    }
    // ----------------------------------------

    let currentStock = 0;
    let itemCode = '';

    // 1. Cap nhat so luong Ton kho Master
    if (itemType === 'PRODUCT') {
      const product = await this.productRepo.findOne({ where: { id: itemId } });
      if (!product) throw new BadRequestException('Khong tim thay san pham co ID: ' + itemId);
      
      const change = type === 'IMPORT' ? Number(quantity) : -Number(quantity);
      product.quantity_in_stock = Number(product.quantity_in_stock || 0) + change;
      
      await this.productRepo.save(product);
      currentStock = product.quantity_in_stock;
      itemCode = product.sku;

    } else {
      const material = await this.materialRepo.findOne({ where: { id: itemId } });
      if (!material) throw new BadRequestException('Khong tim thay nguyen lieu co ID: ' + itemId);

      const change = type === 'IMPORT' ? Number(quantity) : -Number(quantity);
      material.quantity_in_stock = Number(material.quantity_in_stock || 0) + change;
      
      await this.materialRepo.save(material);
      currentStock = material.quantity_in_stock;
      itemCode = material.code;
    }

    // 2. Ghi So cai (Log History)
    const history = new StockHistory();
    history.type = type; // Gan gia tri da kiem tra
    history.item_type = itemType;
    history.item_id = itemId;
    history.item_code = itemCode;
    history.quantity = quantity;
    history.balance_after = currentStock;
    history.reference_code = refCode || 'N/A';
    history.note = note || '';

    return this.stockRepo.save(history);
  }
}
