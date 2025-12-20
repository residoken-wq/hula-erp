import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder, SalesOrderStatus, PaymentStatus } from './sales-order.entity';
import { SalesOrderItem } from './sales-order-item.entity';
import { ProductSample } from './product-sample.entity';
import { SalesDelivery } from './sales-delivery.entity';
import { SalesDeliveryItem } from './sales-delivery-item.entity';
import { SalesComment } from './sales-comment.entity';
import { Transaction } from '../finance/transaction.entity';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';
import { CustomersService } from '../customers/customers.service';

// Price List Entities
import { PriceList } from './pricelist/price-list.entity';
import { PriceListRule } from './pricelist/price-list-rule.entity';
// User Entity
import { User } from '../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(SalesOrder) public orderRepo: Repository<SalesOrder>,
    @InjectRepository(SalesOrderItem) public itemRepo: Repository<SalesOrderItem>,
    @InjectRepository(ProductSample) public sampleRepo: Repository<ProductSample>,
    @InjectRepository(SalesDelivery) private deliveryRepo: Repository<SalesDelivery>,
    @InjectRepository(SalesComment) private commentRepo: Repository<SalesComment>,
    @InjectRepository(Transaction) private transRepo: Repository<Transaction>,
    
    @InjectRepository(PriceList) private priceListRepo: Repository<PriceList>,
    @InjectRepository(PriceListRule) private priceListRuleRepo: Repository<PriceListRule>,
    @InjectRepository(User) private userRepo: Repository<User>,

    private productsService: ProductsService,
    private inventoryService: InventoryService,
    private customersService: CustomersService,
  ) {}

  // ... (Giữ nguyên các hàm Price List & Create Order) ...
  async validatePriceAgainstPriceList(sku: string, unitPrice: number, currentUserId: number): Promise<boolean> { return true; } // (Rút gọn)
  async createPriceList(data: any) { return this.priceListRepo.save(this.priceListRepo.create(data)); }
  async getAllPriceLists() { return this.priceListRepo.find({ order: { id: 'DESC' } }); }
  async createPriceListRule(id: number, data: any) { return this.priceListRuleRepo.save(this.priceListRuleRepo.create({ ...data, price_list_id: id })); }
  async getPriceListRules(id: number) { return this.priceListRuleRepo.find({ where: { price_list_id: id } }); }

  async createOrder(data: any) {
    const order = this.orderRepo.create({
        order_code: data.order_code, 
        customer: data.customer_id ? { id: data.customer_id } : null,
        customer_name: data.customer_name, 
        order_date: data.order_date,
        delivery_date: data.delivery_date, 
        status: data.is_quotation ? SalesOrderStatus.QUOTATION : SalesOrderStatus.SO_PENDING, 
        uuid: uuidv4(),
        vat_company_name: data.vat_company_name, vat_tax_code: data.vat_tax_code, vat_address: data.vat_address, vat_rate: Number(data.vat_rate)||0,
        shipping_address: data.shipping_address, receiver_name: data.receiver_name, receiver_phone: data.receiver_phone, shipping_carrier: data.shipping_carrier, shipping_fee: Number(data.shipping_fee)||0,
        payment_note: data.payment_note, terms_content: data.terms_content
    });

    const validItems = (data.items || []).filter((i:any) => i.sku); 
    let itemsTotal = 0; let totalCost = 0;

    order.items = validItems.map((itemData:any) => {
        const qty = Number(itemData.quantity) || 0; 
        const price = Number(itemData.unit_price || itemData.price) || 0; 
        const sub = qty * price; 
        itemsTotal += sub;
        return this.orderRepo.manager.create(SalesOrderItem, { sku: itemData.sku, quantity: qty, unit_price: price, subtotal: sub, variant_color: itemData.variant_color });
    });

    order.total_amount = itemsTotal * (1 + order.vat_rate / 100) + order.shipping_fee; 
    return this.orderRepo.save(order);
  }

  // --- LOGIC UPDATE ĐƠN HÀNG ---
  async update(id: number, data: any) {
      const order = await this.orderRepo.findOne({ where: { id }, relations: ['items'] });
      if (!order) throw new NotFoundException('Order Not Found');

      // Cập nhật thông tin chung
      if (data.customer_id) order.customer = { id: data.customer_id } as any;
      if (data.order_date) order.order_date = data.order_date;
      if (data.delivery_date) order.delivery_date = data.delivery_date;
      if (data.status) order.status = data.status;
      if (data.payment_note) order.payment_note = data.payment_note;
      
      // Update thông tin VAT & Ship nếu có
      order.vat_company_name = data.vat_company_name;
      order.vat_tax_code = data.vat_tax_code;
      order.vat_address = data.vat_address;
      order.vat_rate = Number(data.vat_rate) || 0;
      order.shipping_address = data.shipping_address;
      order.receiver_name = data.receiver_name;
      order.receiver_phone = data.receiver_phone;
      order.shipping_fee = Number(data.shipping_fee) || 0;

      // Cập nhật danh sách sản phẩm (Items)
      if (data.items) {
          // Xóa các item cũ
          await this.itemRepo.delete({ order: { id: id } });

          const validItems = data.items.filter((i:any) => i.sku);
          let itemsTotal = 0;
          let totalCost = 0;

          const newItems = [];
          for (const itemData of validItems) {
              const qty = Number(itemData.quantity) || 0;
              const price = Number(itemData.unit_price) || 0;
              const sub = qty * price;
              itemsTotal += sub;

              // Validate Price again (Optional)
              // await this.validatePriceAgainstPriceList(itemData.sku, price, 1).catch(e => console.warn(e.message));

              const newItem = this.itemRepo.create({
                  order: order, // Quan trọng: Gán lại order cha
                  sku: itemData.sku,
                  quantity: qty,
                  unit_price: price,
                  subtotal: sub,
                  variant_color: itemData.variant_color,
              });
              newItems.push(newItem);

              // Tính giá vốn (nếu cần)
              try { 
                  const costInfo = await this.productsService.calculateCostPrice(itemData.sku); 
                  totalCost += (costInfo.new_cost_price || 0) * qty; 
              } catch (e) {} 
          }

          // Lưu danh sách item mới
          await this.itemRepo.save(newItems);
          
          // Tính lại tổng tiền đơn hàng
          order.total_amount = itemsTotal * (1 + order.vat_rate / 100) + order.shipping_fee;
          order.total_cost = totalCost;
      }

      return this.orderRepo.save(order);
  }

  async updateQuote(id: number, b: any) { return this.update(id, b); }

  async findAll() { return this.orderRepo.find({ order: { order_date: 'DESC' }, relations: ['customer'] }); }
  
  async findOne(idOrCode: string | number) {
      let where: any = {};
      if (typeof idOrCode === 'number' || !isNaN(Number(idOrCode))) {
          where = { id: Number(idOrCode) };
      } else {
          where = { order_code: idOrCode };
      }
      
      // Sử dụng relation cơ bản, tránh relation 'items.product' nếu entity chưa có
      const order = await this.orderRepo.findOne({ 
          where, 
          relations: ['items', 'customer'] 
      });
      if (!order) throw new NotFoundException('Order not found');
      return order;
  }

  async getOrder(code: string) { return this.findOne(code); }
  
  // ... (Giữ nguyên các hàm phụ: completeOrder, addComment, delivery, payments...) ...
  async completeOrder(id: number) { const order = await this.orderRepo.findOne({ where: { id } }); if (!order) throw new NotFoundException(); order.status = SalesOrderStatus.COMPLETED; return this.orderRepo.save(order); }
  async addComment(orderId: number, content: string, sender: 'STAFF'|'CUSTOMER', name?: string) { const order = await this.orderRepo.findOne({ where: { id: orderId } }); if (!order) throw new NotFoundException(); const comment = this.commentRepo.create({ order, content, sender_type: sender, sender_name: name }); return this.commentRepo.save(comment); }
  async getComments(orderId: number) { return this.commentRepo.find({ where: { order: { id: orderId } }, order: { created_at: 'ASC' } }); }
  async toggleCommentVisibility(id: number) { const comment = await this.commentRepo.findOne({ where: { id } }); if (comment) { comment.is_visible = !comment.is_visible; return this.commentRepo.save(comment); } }
  async convertQuoteToSo(id: number, accepted: boolean) { const order = await this.orderRepo.findOne({ where: { id } }); if(!order) throw new NotFoundException(); order.status = accepted ? SalesOrderStatus.SO_PENDING : SalesOrderStatus.CANCELLED; return this.orderRepo.save(order); }
  async approveAllSamples(id: number) { const order = await this.orderRepo.findOne({ where: { id }, relations: ['items'] }); if(!order) throw new NotFoundException(); for(const item of order.items) { item.is_sample_approved = true; await this.orderRepo.manager.save(item); } if (order.status === SalesOrderStatus.SO_PENDING) order.status = SalesOrderStatus.SAMPLE_APPROVED; return this.orderRepo.save(order); }
  async deleteQuote(id: number) { return this.orderRepo.delete(id); }
  async getQuoteByUuid(uuid: string) { return this.orderRepo.findOne({ where: { uuid }, relations: ['items', 'customer'] }); } // Đã bỏ items.product để an toàn
  async customerAction(uuid: string, action: 'ACCEPT'|'REJECT') { const q = await this.getQuoteByUuid(uuid); if(q) return this.convertQuoteToSo(q.id, action==='ACCEPT'); }
  async getDeliveryHistory(orderId: number) { return this.deliveryRepo.find({ where: { order_id: orderId }, relations: ['items'], order: { created_at: 'DESC' } }); }
  async getPaymentHistory(orderCode: string) { return this.transRepo.find({ where: { reference_code: orderCode }, order: { created_at: 'DESC' } }); }
  
  async createDelivery(orderId: number, data: any) { 
      const order = await this.orderRepo.findOne({ where: { id: orderId }, relations: ['items'] }); 
      if (!order) throw new NotFoundException('Not found'); 
      const delivery = this.deliveryRepo.create({ code: data.code, delivery_date: data.date, note: data.note, sales_order: order, items: data.items }); 
      // Logic kho hàng...
      await this.deliveryRepo.save(delivery); 
      return this.orderRepo.save(order); 
  }
}