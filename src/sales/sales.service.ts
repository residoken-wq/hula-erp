import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder, SalesOrderStatus, PaymentStatus } from './sales-order.entity';
import { SalesOrderItem } from './sales-order-item.entity';
import { ProductSample } from './product-sample.entity';
import { SalesDelivery } from './sales-delivery.entity';
import { SalesDeliveryItem } from './sales-delivery-item.entity';
import { Transaction } from '../finance/transaction.entity';

import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(SalesOrder) public orderRepo: Repository<SalesOrder>,
    @InjectRepository(ProductSample) public sampleRepo: Repository<ProductSample>,
    @InjectRepository(SalesDelivery) private deliveryRepo: Repository<SalesDelivery>,
    @InjectRepository(Transaction) private transRepo: Repository<Transaction>,
    private productsService: ProductsService,
    private inventoryService: InventoryService,
    private customersService: CustomersService,
  ) {}

  // ... (validateItemsForSO giu nguyen)
  private async validateItemsForSO(items: any[]) {
      for (const item of items) {
          const product = await this.productsService.findOneBySku(item.sku);
          if (!product) throw new NotFoundException(`Sản phẩm ${item.sku} không tồn tại`);
          const hasColor = product.attributes && product.attributes.color;
          const isCombo = (product.category || '').toLowerCase().includes('combo');
          if (!hasColor && !isCombo) {
              throw new BadRequestException(`Lỗi dòng hàng "${product.name}": SP phải có màu/biến thể.`);
          }
      }
  }

  async createOrder(data: any) {
    if (!data.isQuotation) await this.validateItemsForSO(data.items);
    
    const order = new SalesOrder();
    order.order_code = data.order_code;
    if(data.customer_id) order.customer = { id: data.customer_id } as any;
    order.customer_name = data.customer_name;
    // ... Map cac truong khac (VAT, Ship)
    order.vat_company_name = data.vat_company_name;
    order.vat_tax_code = data.vat_tax_code;
    order.vat_address = data.vat_address;
    order.delivery_date = data.delivery_date; // Quan trong cho SX
    order.shipping_address = data.shipping_address;
    order.receiver_name = data.receiver_name;
    order.receiver_phone = data.receiver_phone;
    order.shipping_carrier = data.shipping_carrier;
    order.payment_note = data.payment_note;

    order.items = [];
    let totalAmount = 0; let totalCost = 0;

    for (const itemData of data.items) {
      const item = new SalesOrderItem();
      item.sku = itemData.sku; item.quantity = itemData.quantity; item.unit_price = itemData.price;
      item.subtotal = item.quantity * item.unit_price;
      totalAmount += item.subtotal;
      try {
        const costInfo = await this.productsService.calculateCostPrice(item.sku);
        totalCost += (costInfo.new_cost_price || 0) * item.quantity;
      } catch (e) {}
      
      // LUU Y: KHONG TRU KHO O DAY NUA (Doi giao hang moi tru)
      order.items.push(item);
    }

    order.total_amount = totalAmount; order.total_cost = totalCost;
    order.status = data.isQuotation ? SalesOrderStatus.QUOTATION : SalesOrderStatus.SO_PENDING;
    return this.orderRepo.save(order);
  }

  async findAll() { return this.orderRepo.find({ order: { order_date: 'DESC' }, relations: ['customer'] }); }
  async getOrder(code: string) { return this.orderRepo.findOne({ where: { order_code: code }, relations: ['items', 'customer'] }); }

  async convertQuoteToSo(id: number, accepted: boolean) {
      const order = await this.orderRepo.findOne({ where: { id }, relations: ['items'] });
      if(!order) throw new NotFoundException('Không tìm thấy báo giá');
      
      if (!accepted) { 
          order.status = SalesOrderStatus.CANCELLED; 
      } else {
          await this.validateItemsForSO(order.items);
          // KHONG TRU KHO NGAY - Chi chuyen trang thai
          order.status = SalesOrderStatus.SO_PENDING;
          if(order.customer_id) await this.customersService.convertToCustomer(order.customer_id);
      }
      return this.orderRepo.save(order);
  }

  async updatePayment(orderCode: string, amount: number) {
    const order = await this.orderRepo.findOne({ where: { order_code: orderCode } });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    
    order.paid_amount = Number(order.paid_amount || 0) + Number(amount);
    
    // Cap nhat Payment Status
    if (order.paid_amount >= order.total_amount) order.payment_status = PaymentStatus.PAID;
    else if (order.paid_amount > 0) order.payment_status = PaymentStatus.PARTIAL_PAID;
    else order.payment_status = PaymentStatus.UNPAID;

    // Neu da Giao xong va Tra du -> Completed
    if (order.status === SalesOrderStatus.DELIVERED && order.payment_status === PaymentStatus.PAID) {
        order.status = SalesOrderStatus.COMPLETED;
    } else if (order.paid_amount > 0 && order.status === SalesOrderStatus.SO_PENDING) {
        // Neu da coc tien -> Chuyen sang DEPOSITED (De Planning biet ma SX)
        order.status = SalesOrderStatus.DEPOSITED;
    }

    return this.orderRepo.save(order);
  }
  
  async updateQuote(id: number, data: any) {
      // (Giữ nguyên logic update như cũ, chỉ map thêm các trường mới)
      const order = await this.orderRepo.findOne({ where: { id }, relations: ['items'] });
      if (!order) throw new NotFoundException('Not Found');
      // Update Info fields...
      Object.assign(order, {
          vat_company_name: data.vat_company_name,
          vat_tax_code: data.vat_tax_code,
          vat_address: data.vat_address,
          delivery_date: data.delivery_date,
          shipping_address: data.shipping_address,
          receiver_name: data.receiver_name,
          receiver_phone: data.receiver_phone,
          shipping_carrier: data.shipping_carrier,
          shipping_fee: data.shipping_fee,
          payment_note: data.payment_note
      });
      // Update items if Quotation...
      return this.orderRepo.save(order);
  }

  async deleteQuote(id: number) {
       const order = await this.orderRepo.findOne({ where: { id } });
       if (order && (order.status === 'QUOTATION' || order.status === 'CANCELLED')) return this.orderRepo.remove(order);
       throw new BadRequestException('Khong the xoa');
  }

  // --- NEW: QUAN LY GIAO HANG (DELIVERY) ---
  
  async getDeliveryHistory(orderId: number) {
      return this.deliveryRepo.find({ where: { order_id: orderId }, relations: ['items'], order: { created_at: 'DESC' } });
  }

  async createDelivery(orderId: number, data: any) {
      // data: { code, date, note, items: [{sku, quantity}] }
      const order = await this.orderRepo.findOne({ where: { id: orderId } });
      if (!order) throw new NotFoundException('Don hang khong ton tai');

      // 1. Tao Phieu Giao
      const delivery = new SalesDelivery();
      delivery.code = data.code;
      delivery.delivery_date = data.date;
      delivery.note = data.note;
      delivery.sales_order = order;
      delivery.items = [];

      for (const item of data.items) {
          if (item.quantity > 0) {
              const dItem = new SalesDeliveryItem();
              dItem.sku = item.sku;
              dItem.quantity = item.quantity;
              delivery.items.push(dItem);

              // 2. TRU KHO (Inventory Adjustment)
              const product = await this.productsService.findOneBySku(item.sku);
              if (product) {
                  await this.inventoryService.adjustStock(
                      'EXPORT', 'PRODUCT', product.id, item.quantity, delivery.code, 
                      `Giao hàng cho đơn ${order.order_code}`
                  );
              }
          }
      }

      await this.deliveryRepo.save(delivery);

      // 3. Cap nhat trang thai Don hang
      // Logic don gian: Neu da giao -> set Partial hoac Delivered. 
      // De chinh xac can so sanh tong giao vs tong dat, o day ta tam set Partial truoc
      order.status = SalesOrderStatus.PARTIAL_DELIVERY; 
      // (Nang cao: query sum quantity de check full)
      
      return this.orderRepo.save(order);
  }

  async getPaymentHistory(orderCode: string) {
      return this.transRepo.find({ where: { reference_code: orderCode }, order: { created_at: 'DESC' } });
  }
}