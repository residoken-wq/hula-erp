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

import { PriceList } from './pricelist/price-list.entity';
import { PriceListRule } from './pricelist/price-list-rule.entity';
// --- Import User Entity ---
import { User } from '../users/entities/user.entity';

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
    
    // --- Inject User Repo ---
    @InjectRepository(User) private userRepo: Repository<User>, 

    private productsService: ProductsService,
    private inventoryService: InventoryService,
    private customersService: CustomersService,
  ) {}

  private async validateItemsForSO(items: any[]) {
      if(!items) return;
      for (const item of items) {
          if (!item.sku) continue;
          const product = await this.productsService.findOneBySku(item.sku);
          if (!product) throw new NotFoundException(`SP ${item.sku} k tim thay`);
      }
  }

  // --- LOGIC MỚI: CHECK GIÁ THEO USER GROUP ---
  async validatePriceAgainstPriceList(sku: string, unitPrice: number, currentUserId: number): Promise<boolean> {
    const today = new Date();
    
    // 1. Lấy thông tin User và Group của họ
    const user = await this.userRepo.findOne({ 
        where: { id: currentUserId }, 
        relations: ['group'] 
    });

    if (!user || !user.group) return true; // Nếu user không thuộc nhóm nào, bỏ qua check (hoặc chặn tùy logic)

    // 2. Tìm Price List áp dụng cho GROUP này
    const applicableList = await this.priceListRepo.findOne({
        where: {
            group_id: user.group.id, // Check theo Group ID
            is_active: true,
        },
        order: { id: 'DESC' }
    });

    if (!applicableList) return true;
    
    const validFrom = new Date(applicableList.valid_from);
    const validTo = new Date(applicableList.valid_to);
    if (today < validFrom || today > validTo) return true;

    // 3. Tìm Rule và Validate (Giữ nguyên logic cũ)
    const rule = await this.priceListRuleRepo.findOne({
        where: {
            price_list_id: applicableList.id,
            product_sku: sku
        }
    });

    if (!rule) return true; 

    const product = await this.productsService.findOneBySku(sku);
    const costPrice = Number(product?.cost_price || 0);

    if (rule.min_price && unitPrice < Number(rule.min_price)) {
        throw new BadRequestException(`Giá bán thấp hơn mức tối thiểu: ${Number(rule.min_price).toLocaleString()} ₫ (Bảng giá nhóm: ${applicableList.name}).`);
    }
    if (rule.max_price && unitPrice > Number(rule.max_price)) {
        throw new BadRequestException(`Giá bán cao hơn mức tối đa: ${Number(rule.max_price).toLocaleString()} ₫ (Bảng giá nhóm: ${applicableList.name}).`);
    }

    if (costPrice > 0) {
        const margin = ((unitPrice - costPrice) / unitPrice) * 100;
        if (rule.min_margin && margin < Number(rule.min_margin)) {
            throw new BadRequestException(`Lợi nhuận ${margin.toFixed(1)}% thấp hơn mức tối thiểu: ${rule.min_margin}% (Bảng giá nhóm: ${applicableList.name}).`);
        }
        if (rule.max_margin && margin > Number(rule.max_margin)) {
            throw new BadRequestException(`Lợi nhuận ${margin.toFixed(1)}% cao hơn mức tối đa: ${rule.max_margin}% (Bảng giá nhóm: ${applicableList.name}).`);
        }
    }

    return true;
  }
  
  async createOrder(data: any) {
    if (!data.isQuotation) await this.validateItemsForSO(data.items);
    
    // Validate Price (User ID hardcode = 1, thực tế lấy từ token)
    const currentUserId = 1; 
    for (const itemData of (data.items || [])) {
        if (itemData.sku && itemData.price) {
            await this.validatePriceAgainstPriceList(itemData.sku, Number(itemData.price), currentUserId); 
        }
    }

    const order = this.orderRepo.create({
        order_code: data.order_code,
        customer: data.customer_id ? { id: data.customer_id } : null,
        customer_name: data.customer_name,
        vat_company_name: data.vat_company_name, vat_tax_code: data.vat_tax_code, vat_address: data.vat_address, vat_rate: Number(data.vat_rate)||0,
        delivery_date: data.delivery_date, shipping_address: data.shipping_address, receiver_name: data.receiver_name, receiver_phone: data.receiver_phone, shipping_carrier: data.shipping_carrier,
        payment_note: data.payment_note, shipping_fee: Number(data.shipping_fee)||0,
        status: data.isQuotation ? SalesOrderStatus.QUOTATION : SalesOrderStatus.SO_PENDING,
        terms_content: data.terms_content
    });
    
    const validItems = (data.items || []).filter((i:any) => i.sku); 
    let itemsTotal = 0; let totalCost = 0;
    
    order.items = validItems.map((itemData:any) => {
        const qty = Number(itemData.quantity) || 0;
        const price = Number(itemData.price) || 0;
        const sub = qty * price;
        itemsTotal += sub;
        return this.orderRepo.manager.create(SalesOrderItem, {
            sku: itemData.sku, quantity: qty, unit_price: price, subtotal: sub,
            variant_color: itemData.variant_color, is_sample_approved: itemData.is_sample_approved || false,
            sample_image: itemData.sample_image, sample_note: itemData.sample_note
        });
    });

    for (const item of order.items) { try { const costInfo = await this.productsService.calculateCostPrice(item.sku); totalCost += (costInfo.new_cost_price || 0) * item.quantity; } catch (e) {} }
    order.total_amount = itemsTotal * (1 + order.vat_rate / 100) + order.shipping_fee;
    order.total_cost = totalCost;
    return this.orderRepo.save(order);
  }

  // --- CRUD API CHO PRICE LIST (ĐÃ CẬP NHẬT GROUP_ID) ---
  async createPriceList(data: any) {
      const list = new PriceList();
      list.name = data.name;
      list.description = data.description;
      
      // FIX: Lưu group_id thay vì user_id
      list.group_id = Number(data.group_id); 
      
      list.valid_from = new Date(data.valid_from);
      list.valid_to = new Date(data.valid_to);
      list.is_active = true;

      return this.priceListRepo.save(list);
  }

  async createPriceListRule(listId: number, data: any) {
      const list = await this.priceListRepo.findOne({ where: { id: listId } });
      if (!list) throw new NotFoundException('Price List not found');
      
      const existingRule = await this.priceListRuleRepo.findOne({ where: { price_list_id: listId, product_sku: data.product_sku } });
      if (existingRule) {
           throw new BadRequestException(`Sản phẩm ${data.product_sku} đã có quy tắc trong bảng giá này.`);
      }
      const rule = this.priceListRuleRepo.create({ ...data, price_list_id: listId });
      return this.priceListRuleRepo.save(rule);
  }

  async getAllPriceLists() { 
      return this.priceListRepo.find({ order: { id: 'DESC' } }); 
  }
  async getPriceListRules(listId: number) { 
      return this.priceListRuleRepo.find({ where: { price_list_id: listId }, order: { id: 'DESC' } }); 
  }
  
  // ... (Giữ nguyên các hàm khác: findAll, updateQuote, completeOrder...)
  async findAll() { return this.orderRepo.find({ order: { order_date: 'DESC' }, relations: ['customer'] }); }
  async getOrder(code: string) { return this.orderRepo.findOne({ where: { order_code: code }, relations: ['items', 'customer', 'comments'] }); }
  async updateQuote(id: number, data: any) {
      const order = await this.orderRepo.findOne({ where: { id }, relations: ['items'] });
      if (!order) throw new NotFoundException('Not Found');
      const currentUserId = 1; 
      for (const itemData of (data.items || [])) {
          if (itemData.sku && itemData.price) await this.validatePriceAgainstPriceList(itemData.sku, Number(itemData.price), currentUserId); 
      }
      Object.assign(order, {
          vat_company_name: data.vat_company_name, vat_tax_code: data.vat_tax_code, vat_address: data.vat_address, vat_rate: Number(data.vat_rate)||0,
          delivery_date: data.delivery_date, shipping_address: data.shipping_address, receiver_name: data.receiver_name, receiver_phone: data.receiver_phone,
          shipping_fee: Number(data.shipping_fee)||0, payment_note: data.payment_note,
          sample_image_url: data.sample_image_url, sample_note: data.sample_note, terms_content: data.terms_content
      });
      if(data.customer_id) order.customer = { id: data.customer_id } as any;
      let itemsTotal = 0;
      if (data.items && (order.status === SalesOrderStatus.QUOTATION || order.status === SalesOrderStatus.SO_PENDING || order.status === SalesOrderStatus.SAMPLE_APPROVED)) {
          await this.orderRepo.createQueryBuilder().relation(SalesOrder, "items").of(order).remove(order.items);
          const validItems = data.items.filter((i:any) => i.sku);
          order.items = validItems.map((i:any) => {
              const qty = Number(i.quantity) || 0; const price = Number(i.price) || 0; const sub = qty * price; itemsTotal += sub;
              return this.orderRepo.manager.create(SalesOrderItem, { sku: i.sku, quantity: qty, unit_price: price, subtotal: sub, variant_color: i.variant_color, is_sample_approved: i.is_sample_approved, sample_image: i.sample_image, sample_note: i.sample_note });
          });
      } else { itemsTotal = order.items.reduce((s, i) => s + Number(i.subtotal), 0); }
      order.total_amount = itemsTotal * (1 + order.vat_rate / 100) + order.shipping_fee;
      return this.orderRepo.save(order);
  }
  async completeOrder(id: number) { const order = await this.orderRepo.findOne({ where: { id } }); if (!order) throw new NotFoundException(); order.status = SalesOrderStatus.COMPLETED; return this.orderRepo.save(order); }
  async addComment(orderId: number, content: string, sender: 'STAFF'|'CUSTOMER', name?: string) { const order = await this.orderRepo.findOne({ where: { id: orderId } }); if (!order) throw new NotFoundException(); const comment = this.commentRepo.create({ order, content, sender_type: sender, sender_name: name }); return this.commentRepo.save(comment); }
  async getComments(orderId: number) { return this.commentRepo.find({ where: { order: { id: orderId } }, order: { created_at: 'ASC' } }); }
  async toggleCommentVisibility(id: number) { const comment = await this.commentRepo.findOne({ where: { id } }); if (comment) { comment.is_visible = !comment.is_visible; return this.commentRepo.save(comment); } }
  async convertQuoteToSo(id: number, accepted: boolean) { const order = await this.orderRepo.findOne({ where: { id }, relations: ['items'] }); if(!order) throw new NotFoundException(); order.status = accepted ? SalesOrderStatus.SO_PENDING : SalesOrderStatus.CANCELLED; return this.orderRepo.save(order); }
  async approveAllSamples(id: number) { const order = await this.orderRepo.findOne({ where: { id }, relations: ['items'] }); if(!order) throw new NotFoundException(); for(const item of order.items) { item.is_sample_approved = true; await this.orderRepo.manager.save(item); } if (order.status === SalesOrderStatus.SO_PENDING) order.status = SalesOrderStatus.SAMPLE_APPROVED; return this.orderRepo.save(order); }
  async updatePayment(orderCode: string, amount: number) { const order = await this.orderRepo.findOne({ where: { order_code: orderCode } }); if (!order) throw new NotFoundException(); order.paid_amount = Number(order.paid_amount || 0) + Number(amount); if (order.paid_amount > 0 && (order.status === SalesOrderStatus.SO_PENDING || order.status === SalesOrderStatus.SAMPLE_APPROVED)) { order.status = SalesOrderStatus.DEPOSITED; } if (order.paid_amount >= order.total_amount) order.payment_status = PaymentStatus.PAID; else if (order.paid_amount > 0) order.payment_status = PaymentStatus.PARTIAL_PAID; if (order.payment_status === PaymentStatus.PAID && order.status === SalesOrderStatus.DELIVERED) order.status = SalesOrderStatus.COMPLETED; return this.orderRepo.save(order); }
  async deleteQuote(id: number) { const order = await this.orderRepo.findOne({ where: { id } }); if (order && (order.status === 'QUOTATION' || order.status === 'CANCELLED')) return this.orderRepo.remove(order); throw new BadRequestException('Khong the xoa'); }
  async getQuoteByUuid(uuid: string) { const order = await this.orderRepo.findOne({ where: { uuid }, relations: ['items', 'customer', 'comments'] }); if(!order) throw new NotFoundException('Not found'); const deliveries = await this.deliveryRepo.find({ where: { order_id: order.id }, relations: ['items'], order: { created_at: 'DESC' } }); const payments = await this.transRepo.find({ where: { reference_code: order.order_code }, order: { created_at: 'DESC' } }); return { ...order, deliveries, payments }; }
  async customerAction(uuid: string, action: 'ACCEPT' | 'REJECT') { const order = await this.getQuoteByUuid(uuid); if (order.status !== SalesOrderStatus.QUOTATION) throw new BadRequestException('Da xu ly roi'); return this.convertQuoteToSo(order.id, action === 'ACCEPT'); }
  async getDeliveryHistory(orderId: number) { return this.deliveryRepo.find({ where: { order_id: orderId }, relations: ['items'], order: { created_at: 'DESC' } }); }
  async getPaymentHistory(orderCode: string) { return this.transRepo.find({ where: { reference_code: orderCode }, order: { created_at: 'DESC' } }); }
  async createDelivery(orderId: number, data: any) { const order = await this.orderRepo.findOne({ where: { id: orderId }, relations: ['items'] }); if (!order) throw new NotFoundException('Not found'); const delivery = this.deliveryRepo.create({ code: data.code, delivery_date: data.date, note: data.note, sales_order: order, items: data.items.map((i:any) => ({ sku: i.sku, quantity: Math.floor(Number(i.quantity)) })) }); for (const item of data.items) { const product = await this.productsService.findOneBySku(item.sku); if (product) await this.inventoryService.adjustStock('EXPORT', 'PRODUCT', product.id, Math.floor(Number(item.quantity)), delivery.code, `Giao hang ${order.order_code}`); } await this.deliveryRepo.save(delivery); const allDeliveries = await this.deliveryRepo.find({ where: { order_id: orderId }, relations: ['items'] }); let isFullyDelivered = true; for (const orderItem of order.items) { let deliveredQty = 0; allDeliveries.forEach(d => { const dItem = d.items.find(i => i.sku === orderItem.sku); if (dItem) deliveredQty += Number(dItem.quantity); }); if (deliveredQty < Number(orderItem.quantity)) { isFullyDelivered = false; break; } } if (isFullyDelivered) { order.status = SalesOrderStatus.DELIVERED; if (order.payment_status === PaymentStatus.PAID) order.status = SalesOrderStatus.COMPLETED; } else { order.status = SalesOrderStatus.PARTIAL_DELIVERY; } return this.orderRepo.save(order); }
}