import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder, POStatus, POType } from './purchase-order.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';
import { PurchaseDelivery } from './purchase-delivery.entity';
import { InventoryService } from '../inventory/inventory.service';
import { SuppliersService } from '../suppliers/suppliers.service';

@Injectable()
export class PurchasingService {
  constructor(
    @InjectRepository(PurchaseOrder) private poRepo: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem) private itemRepo: Repository<PurchaseOrderItem>,
    @InjectRepository(PurchaseDelivery) private deliveryRepo: Repository<PurchaseDelivery>,
    private inventoryService: InventoryService,
    private suppliersService: SuppliersService,
  ) {}

  async create(data: any) {
      const po = this.poRepo.create({
          po_code: data.po_code,
          supplier_id: data.supplier_id,
          type: data.type || POType.MATERIAL,
          plan_id: data.plan_id || null,
          expected_delivery_date: data.expected_delivery_date,
          payment_term: data.payment_term,
          delivery_address: data.delivery_address,
          vat_rate: data.vat_rate || 0,
          shipping_fee: data.shipping_fee || 0,
          note: data.note,
          status: POStatus.DRAFT
      });
      
      let itemsTotal = 0;
      // FIX: Tạo items bằng itemRepo.create thay vì gán thẳng mảng object để TypeORM xử lý quan hệ
      const itemsEntities = data.items.map((i:any) => {
          const sub = Number(i.quantity) * Number(i.price);
          itemsTotal += sub;
          return this.itemRepo.create({
              // FIX: Ép kiểu as any để tránh lỗi TS2769 nếu strict mode
              material_id: i.material_id || null, 
              product_id: i.product_id || null,   
              description: i.description,
              quantity: i.quantity,
              unit_price: i.price,
              subtotal: sub
          } as any); 
      });
      
      po.items = itemsEntities;
      po.total_amount = itemsTotal * (1 + po.vat_rate/100) + Number(po.shipping_fee);
      return this.poRepo.save(po);
  }

  async findAll() { 
      return this.poRepo.find({ 
          order: { id: 'DESC' }, 
          relations: ['supplier', 'production_plan'] 
      }); 
  }
  
  async findOne(id: number) { 
      return this.poRepo.findOne({ where: { id }, relations: ['items', 'supplier', 'items.material', 'items.product'] }); 
  }

  async update(id: number, data: any) {
      const po = await this.findOne(id);
      if(!po) throw new NotFoundException();
      Object.assign(po, { ...data, items: undefined }); 
      return this.poRepo.save(po);
  }

  async getByUuid(uuid: string) {
      const po = await this.poRepo.findOne({ where: { uuid }, relations: ['items', 'supplier', 'items.material', 'items.product'] });
      if(!po) throw new NotFoundException('PO Not Found');
      return po;
  }

  async supplierAction(uuid: string, action: 'CONFIRM' | 'REJECT', note?: string) {
      const po = await this.getByUuid(uuid);
      if (po.status !== POStatus.SENT) throw new BadRequestException('Trạng thái không hợp lệ');
      po.status = action === 'CONFIRM' ? POStatus.CONFIRMED : POStatus.DRAFT; 
      po.note = (po.note || '') + `\n[NCC ${action}]: ${note || ''}`;
      return this.poRepo.save(po);
  }

  async receiveGoods(id: number, data: any) {
      const po = await this.findOne(id);
      if(!po) throw new NotFoundException();

      const delivery = this.deliveryRepo.create({
          po_id: id,
          receipt_code: data.code,
          delivery_date: data.date,
          items: data.items 
      });
      await this.deliveryRepo.save(delivery);

      for(const item of data.items) {
          const poItem = po.items.find(i => i.id === item.id);
          if (poItem) {
              if (po.type === POType.MATERIAL && poItem.material_id) {
                  await this.inventoryService.adjustStock('IMPORT', 'MATERIAL', poItem.material_id, item.quantity, data.code, 'Nhập từ PO ' + po.po_code);
              }
              if (po.type === POType.OUTSOURCING && poItem.product_id) {
                  await this.inventoryService.adjustStock('IMPORT', 'PRODUCT', poItem.product_id, item.quantity, data.code, 'Nhập hàng gia công ' + po.po_code);
              }
          }
      }
      po.status = POStatus.RECEIVED; 
      return this.poRepo.save(po);
  }

  // --- FIX: THEM HAM UPDATE PAYMENT ---
  async updatePayment(poCode: string, amount: number) {
      const po = await this.poRepo.findOne({ where: { po_code: poCode } });
      if (!po) throw new NotFoundException('PO Not Found'); // Hoặc return null để FinanceService biết đây là SO
      po.paid_amount = Number(po.paid_amount || 0) + Number(amount);
      if (po.paid_amount >= po.total_amount && po.status === POStatus.RECEIVED) {
          po.status = POStatus.COMPLETED;
      }
      return this.poRepo.save(po);
  }
}