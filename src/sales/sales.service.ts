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

  // --- BỎ BẮT LỖI BIẾN THỂ TẠI ĐÂY (Sẽ bắt lỗi khi Lập Kế Hoạch SX) ---
  private async validateItemsForSO(items: any[]) {
      for (const item of items) {
          const product = await this.productsService.findOneBySku(item.sku);
          if (!product) throw new NotFoundException(`Sản phẩm ${item.sku} không tồn tại`);
          // REMOVED: Không bắt lỗi color/variant ở bước này nữa
      }
  }

  async createOrder(data: any) {
    // if (!data.isQuotation) await this.validateItemsForSO(data.items); // Tạm bỏ validate chặt
    
    const order = this.orderRepo.create({
        order_code: data.order_code,
        customer: data.customer_id ? { id: data.customer_id } : null,
        customer_name: data.customer_name,
        vat_company_name: data.vat_company_name,
        vat_tax_code: data.vat_tax_code,
        vat_address: data.vat_address,
        vat_rate: Number(data.vat_rate) || 0,
        delivery_date: data.delivery_date,
        shipping_address: data.shipping_address,
        receiver_name: data.receiver_name,
        receiver_phone: data.receiver_phone,
        shipping_carrier: data.shipping_carrier,
        payment_note: data.payment_note,
        shipping_fee: Number(data.shipping_fee) || 0,
        status: data.isQuotation ? SalesOrderStatus.QUOTATION : SalesOrderStatus.SO_PENDING
    });

    let itemsTotal = 0; 
    let totalCost = 0;

    order.items = (data.items || []).map((itemData:any) => {
        const sub = Number(itemData.quantity) * Number(itemData.price);
        itemsTotal += sub;
        return this.orderRepo.manager.create(SalesOrderItem, { // Fix create relation
            sku: itemData.sku,
            quantity: itemData.quantity,
            unit_price: itemData.price,
            subtotal: sub
        });
    });

    // Tinh Cost
    for (const item of order.items) {
        try {
            const costInfo = await this.productsService.calculateCostPrice(item.sku);
            totalCost += (costInfo.new_cost_price || 0) * item.quantity;
        } catch (e) {}
    }

    order.total_amount = itemsTotal * (1 + order.vat_rate / 100) + order.shipping_fee;
    order.total_cost = totalCost;

    return this.orderRepo.save(order);
  }

  async findAll() { return this.orderRepo.find({ order: { order_date: 'DESC' }, relations: ['customer'] }); }
  async getOrder(code: string) { return this.orderRepo.findOne({ where: { order_code: code }, relations: ['items', 'customer'] }); }

  async updateQuote(id: number, data: any) {
      const order = await this.orderRepo.findOne({ where: { id }, relations: ['items'] });
      if (!order) throw new NotFoundException('Not Found');
      
      // Update Info
      Object.assign(order, {
          vat_company_name: data.vat_company_name, vat_tax_code: data.vat_tax_code, vat_address: data.vat_address,
          vat_rate: Number(data.vat_rate) || 0,
          delivery_date: data.delivery_date, shipping_address: data.shipping_address,
          receiver_name: data.receiver_name, receiver_phone: data.receiver_phone,
          shipping_fee: Number(data.shipping_fee) || 0,
          payment_note: data.payment_note,
          shipping_carrier: data.shipping_carrier, tracking_code: data.tracking_code
      });
      if(data.customer_id) order.customer = { id: data.customer_id } as any;

      // Update Items: Cho phép sửa item ngay cả khi là SO_PENDING (để Sale chốt màu)
      if (data.items && (order.status === SalesOrderStatus.QUOTATION || order.status === SalesOrderStatus.SO_PENDING)) {
          // Xóa cũ
          await this.orderRepo.manager.delete(SalesOrderItem, { order: { id: order.id } });
          
          let itemsTotal = 0; let totalCost = 0;
          order.items = data.items.map((i:any) => {
              const sub = Number(i.quantity) * Number(i.price);
              itemsTotal += sub;
              return this.orderRepo.manager.create(SalesOrderItem, { 
                  sku: i.sku, quantity: i.quantity, unit_price: i.price, subtotal: sub 
              });
          });
          
          // Re-calc cost logic here if needed...
          order.total_amount = itemsTotal * (1 + order.vat_rate / 100) + order.shipping_fee;
      }

      return this.orderRepo.save(order);
  }

  async convertQuoteToSo(id: number, accepted: boolean) {
      const order = await this.orderRepo.findOne({ where: { id }, relations: ['items'] });
      if(!order) throw new NotFoundException();
      
      if (accepted) {
          order.status = SalesOrderStatus.SO_PENDING; // Chuyển sang chờ duyệt mẫu/hợp đồng
          // Chưa trừ kho vội
          if(order.customer_id) await this.customersService.convertToCustomer(order.customer_id);
      } else {
          order.status = SalesOrderStatus.CANCELLED;
      }
      return this.orderRepo.save(order);
  }

  async updatePayment(orderCode: string, amount: number) {
    const order = await this.orderRepo.findOne({ where: { order_code: orderCode } });
    if (!order) throw new NotFoundException();
    order.paid_amount = Number(order.paid_amount || 0) + Number(amount);
    if (order.paid_amount >= order.total_amount) order.payment_status = PaymentStatus.PAID;
    else if (order.paid_amount > 0) order.payment_status = PaymentStatus.PARTIAL_PAID;
    
    // Logic trạng thái
    if (order.status === SalesOrderStatus.DELIVERED && order.payment_status === PaymentStatus.PAID) order.status = SalesOrderStatus.COMPLETED;
    else if (order.paid_amount > 0 && order.status === SalesOrderStatus.SO_PENDING) order.status = SalesOrderStatus.DEPOSITED;
    
    return this.orderRepo.save(order);
  }
  
  async deleteQuote(id: number) {
       const order = await this.orderRepo.findOne({ where: { id } });
       if (order && (order.status === 'QUOTATION' || order.status === 'CANCELLED')) return this.orderRepo.remove(order);
       throw new BadRequestException('Khong the xoa');
  }

  async getQuoteByUuid(uuid: string) { return this.orderRepo.findOne({ where: { uuid }, relations: ['items', 'customer'] }); }
  
  async customerAction(uuid: string, action: 'ACCEPT' | 'REJECT') {
      const order = await this.getQuoteByUuid(uuid);
      // Cho phép confirm lại nếu đang ở trạng thái Quote
      if (order.status !== SalesOrderStatus.QUOTATION) throw new BadRequestException('Báo giá đã được xử lý');
      return this.convertQuoteToSo(order.id, action === 'ACCEPT');
  }

  async getDeliveryHistory(orderId: number) { return this.deliveryRepo.find({ where: { order_id: orderId }, relations: ['items'], order: { created_at: 'DESC' } }); }
  async createDelivery(orderId: number, data: any) {
      const order = await this.orderRepo.findOne({ where: { id: orderId } });
      if (!order) throw new NotFoundException();
      const delivery = this.deliveryRepo.create({
          code: data.code, delivery_date: data.date, note: data.note, sales_order: order,
          items: data.items.map((i:any) => ({ sku: i.sku, quantity: i.quantity }))
      });
      await this.deliveryRepo.save(delivery);
      // Tru kho
      for (const item of data.items) {
           const product = await this.productsService.findOneBySku(item.sku);
           if (product) await this.inventoryService.adjustStock('EXPORT', 'PRODUCT', product.id, item.quantity, delivery.code, `Giao hang ${order.order_code}`);
      }
      order.status = SalesOrderStatus.PARTIAL_DELIVERY; 
      return this.orderRepo.save(order);
  }
  async getPaymentHistory(orderCode: string) { return this.transRepo.find({ where: { reference_code: orderCode }, order: { created_at: 'DESC' } }); }
}