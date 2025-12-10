import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder, POStatus } from './purchase-order.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';
import { MaterialsService } from '../materials/materials.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class PurchasingService {
  constructor(
    @InjectRepository(PurchaseOrder) private poRepo: Repository<PurchaseOrder>,
    private materialsService: MaterialsService,
    private inventoryService: InventoryService,
  ) {}

  async createPO(data: any) {
    const po = new PurchaseOrder();
    po.code = data.code;
    po.supplier_name = data.supplier_name;
    po.items = [];
    let total = 0;

    for (const itemData of data.items) {
      const item = new PurchaseOrderItem();
      item.material_code = itemData.material_code;
      item.quantity = itemData.quantity; // So luong nay la theo DON VI MUA (VD: 10 Tam)
      item.unit_price = itemData.unit_price; // Gia nay la gia cua DON VI MUA (VD: 240k/Tam)
      item.subtotal = item.quantity * item.unit_price;
      
      const material = await this.materialsService.findOneByCode(item.material_code);
      if (!material) throw new NotFoundException('Khong tim thay nguyen lieu: ' + item.material_code);

      total += item.subtotal;
      po.items.push(item);
    }

    po.total_amount = total;
    po.status = POStatus.ORDERED;
    return this.poRepo.save(po);
  }

  // --- LOGIC NHAP KHO & QUY DOI ---
  async receiveGoods(code: string) {
    const po = await this.poRepo.findOne({ where: { code }, relations: ['items'] });
    if (!po) throw new NotFoundException('Khong tim thay PO');
    if (po.status === POStatus.RECEIVED) throw new BadRequestException('Don nay da nhap kho roi');

    for (const item of po.items) {
      const material = await this.materialsService.findOneByCode(item.material_code);
      if (material) {
        // 1. Xu ly quy doi
        const factor = Number(material.conversion_factor) || 1;
        
        // So luong thuc nhap vao kho (Base Unit)
        // VD: Mua 10 Tam, Factor 2.4 -> Nhap 24m
        const qtyToStock = Number(item.quantity) * factor;
        
        // Gia von thuc te cua 1 don vi co ban
        // VD: Gia mua 240k/Tam -> Gia von = 240k / 2.4 = 100k/m
        const pricePerBaseUnit = Number(item.unit_price) / factor;

        // 2. Tinh gia binh quan gia quyen (MAP)
        const oldStock = Number(material.quantity_in_stock || 0);
        const oldPrice = Number(material.cost_per_unit || 0);
        
        const totalValue = (oldStock * oldPrice) + (qtyToStock * pricePerBaseUnit);
        const totalQty = oldStock + qtyToStock;
        const avgPrice = totalQty > 0 ? totalValue / totalQty : pricePerBaseUnit;

        // 3. Cap nhat Material
        await this.materialsService.updatePriceAndStock(material.id, avgPrice);

        // 4. Tang kho
        await this.inventoryService.adjustStock(
            'IMPORT', 'MATERIAL', material.id, qtyToStock, po.code, 
            `Nhap tu PO (Quy doi: 1 ${material.purchase_unit || material.unit} = ${factor} ${material.unit})`
        );
      }
    }
    po.status = POStatus.RECEIVED;
    return this.poRepo.save(po);
  }
  // --------------------------------

  async updatePayment(code: string, amount: number) {
    const po = await this.poRepo.findOne({ where: { code } });
    if (!po) throw new NotFoundException('Khong tim thay PO');
    po.paid_amount = Number(po.paid_amount) + Number(amount);
    return this.poRepo.save(po);
  }
}
