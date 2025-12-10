import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkOrder, WorkOrderStatus } from './work-order.entity';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class ProductionService {
  constructor(
    @InjectRepository(WorkOrder)
    private woRepo: Repository<WorkOrder>,
    private productsService: ProductsService,
    private inventoryService: InventoryService,
  ) {}

  // 1. Tao lenh san xuat
  async createWorkOrder(data: any) {
    const wo = new WorkOrder();
    wo.code = data.code;
    wo.product_sku = data.product_sku;
    wo.quantity = data.quantity;
    wo.note = data.note;
    wo.status = WorkOrderStatus.PENDING;
    
    // Kiem tra SP co ton tai khong
    const product = await this.productsService.findOneBySku(wo.product_sku);
    if (!product) throw new NotFoundException('San pham khong ton tai');

    return this.woRepo.save(wo);
  }

  // 2. Hoan thanh SX (Tru NL, Cong SP)
  async completeWorkOrder(code: string) {
    const wo = await this.woRepo.findOne({ where: { code } });
    if (!wo) throw new NotFoundException('Khong tim thay lenh SX');
    if (wo.status === WorkOrderStatus.COMPLETED) throw new BadRequestException('Lenh nay da hoan thanh roi');

    // Lay cong thuc BOM
    const boms = await this.productsService.getBomByProductSku(wo.product_sku);
    if (boms.length === 0) throw new BadRequestException('San pham nay chua co cong thuc BOM, khong the san xuat tu dong');

    // A. TRU KHO NGUYEN LIEU
    for (const item of boms) {
      // Cong thuc: Dinh muc * So luong SX * (1 + Hao hut)
      const waste = Number(item.waste_percent) / 100;
      const totalMaterialNeeded = item.quantity * wo.quantity * (1 + waste);

      await this.inventoryService.adjustStock(
        'EXPORT',
        'MATERIAL',
        item.material_id,
        totalMaterialNeeded,
        wo.code,
        'San xuat ' + wo.product_sku
      );
    }

    // B. CONG KHO THANH PHAM
    const product = await this.productsService.findOneBySku(wo.product_sku);
    await this.inventoryService.adjustStock(
      'IMPORT',
      'PRODUCT',
      product.id,
      wo.quantity,
      wo.code,
      'Nhap kho thanh pham'
    );

    // C. CAP NHAT TRANG THAI
    wo.status = WorkOrderStatus.COMPLETED;
    return this.woRepo.save(wo);
  }
}
