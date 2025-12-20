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

  // --- LOGIC PRICE LIST (GIỮ NGUYÊN) ---
  async validatePriceAgainstPriceList(sku: string, unitPrice: number, currentUserId: number): Promise<boolean> {
    const today = new Date();
    const user = await this.userRepo.findOne({ where: { id: currentUserId }, relations: ['group'] });
    if (!user || !user.group) return true; 

    const applicableList = await this.priceListRepo.findOne({
        where: { group_id: user.group.id, is_active: true },
        order: { id: 'DESC' }
    });

    if (!applicableList) return true;
    
    const validFrom = new Date(applicableList.valid_from);
    const validTo = new Date(applicableList.valid_to);
    if (today < validFrom || today > validTo) return true;

    const rule = await this.priceListRuleRepo.findOne({ where: { price_list_id: applicableList.id, product_sku: sku } });
    if (!rule) return true;

    const product = await this.productsService.findOneBySku(sku);
    const costPrice = Number(product?.cost_price || 0);

    if (rule.min_price && unitPrice < Number(rule.min_price)) throw new BadRequestException(`Giá thấp hơn min: ${Number(rule.min_price).toLocaleString()} ₫ (Bảng giá: ${applicableList.name}).`);
    if (rule.max_price && unitPrice > Number(rule.max_price)) throw new BadRequestException(`Giá cao hơn max: ${Number(rule.max_price).toLocaleString()} ₫ (Bảng giá: ${applicableList.name}).`);

    // Kiểm tra margin nếu có giá vốn
    if (costPrice > 0) {
        const margin = ((unitPrice - costPrice) / unitPrice) * 100;
        if (rule.min_margin && margin < Number(rule.min_margin)) throw new BadRequestException(`Lợi nhuận thấp hơn min: ${rule.min_margin}% (Bảng giá: ${applicableList.name}).`);
    }
    return true;
  }

  async createPriceList(data: any) {
      const list = new PriceList();
      list.name = data.name;
      list.description = data.description;
      const gid = Number(data.group_id);
      list.group_id = !isNaN(gid) ? gid : null;
      list.valid_from = new Date(data.valid_from);
      list.valid_to = new Date(data.valid_to);
      list.is_active = true;
      return this.priceListRepo.save(list);
  }

  async getAllPriceLists() { return this.priceListRepo.find({ order: { id: 'DESC' } }); }
  async createPriceListRule(listId: number, data: any) {
      const list = await this.priceListRepo.findOne({ where: { id: listId } });
      if (!list) throw new NotFoundException('Price List not found');
      const rule = this.priceListRuleRepo.create({ ...data, price_list_id: listId });
      return this.priceListRuleRepo.save(rule);
  }
  async getPriceListRules(listId: number) { return this.priceListRuleRepo.find({ where: { price_list_id: listId }, order: { id: 'DESC' } }); }

  // --- SALES ORDER LOGIC ---

  async createOrder(data: any) {
    // Validate Price
    const currentUserId = 1; 
    for (const itemData of (data.items || [])) {
        if (itemData.sku && itemData.price) await this.validatePriceAgainstPriceList(itemData.sku, Number(itemData.price), currentUserId);
    }

    const order = this.orderRepo.create({
        order_code: data.order_code, 
        customer: data.customer_id ? { id: data.customer_id } : null,
        customer_name: data.customer_name, 
        order_date: data.order_date,
        delivery_date: data.delivery_date, 
        status: data.is_quotation ? SalesOrderStatus.QUOTATION : SalesOrderStatus.SO_PENDING, 
        uuid: uuidv4(),
        
        // VAT & Shipping info
        vat_company_name: data.vat_company_name, vat_tax_code: data.vat_tax_code, vat_address: data.vat_address, vat_rate: Number(data.vat_rate)||0,
        shipping_address: data.shipping_address, receiver_name: data.receiver_name, receiver_phone: data.receiver_phone, shipping_carrier: data.shipping_carrier, shipping_fee: Number(data.shipping_fee)||0,
        payment_note: data.payment_note, terms_content: data.terms_content
    });

    const validItems = (data.items || []).filter((i:any) => i.sku); 
    let itemsTotal = 0; 
    let totalCost = 0;

    order.items = validItems.map((itemData:any) => {
        const qty = Number(itemData.quantity) || 0; 
        const price = Number(itemData.unit_price || itemData.price) || 0; 
        const sub = qty * price; 
        itemsTotal += sub;
        
        return this.orderRepo.manager.create(SalesOrderItem, { 
            sku: itemData.sku, 
            quantity: qty, 
            unit_price: price, 
            subtotal: sub, 
            variant_color: itemData.variant_color, 
            is_sample_approved: itemData.is_sample_approved || false, 
            sample_image: itemData.sample_image, 
            sample_note: itemData.sample_note 
        });
    });

    // Calculate total cost (for profit reporting)
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

  // --- FIX: HÀM UPDATE ĐƠN HÀNG ---
  async update(id: number, data: any) {
      const order = await this.orderRepo.findOne({ where: { id }, relations: ['items'] });
      if (!order) throw new NotFoundException('Order Not Found');

      // 1. Cập nhật thông tin chung
      if (data.customer_id) order.customer = { id: data.customer_id } as any;
      if (data.order_date) order.order_date = data.order_date;
      if (data.delivery_date) order.delivery_date = data.delivery_date;
      if (data.status) order.status = data.status;
      if (data.payment_note) order.payment_note = data.payment_note;
      
      // Update các trường khác nếu có
      order.vat_company_name = data.vat_company_name;
      order.vat_tax_code = data.vat_tax_code;
      order.vat_address = data.vat_address;
      order.vat_rate = Number(data.vat_rate) || 0;
      order.shipping_address = data.shipping_address;
      order.receiver_name = data.receiver_name;
      order.receiver_phone = data.receiver_phone;
      order.shipping_fee = Number(data.shipping_fee) || 0;

      // 2. Cập nhật sản phẩm (Xóa cũ -> Thêm mới)
      if (data.items) {
          // Xóa items cũ
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

              // Validate Price List again
              await this.validatePriceAgainstPriceList(itemData.sku, price, 1).catch(e => console.warn(e.message));

              const newItem = this.itemRepo.create({
                  order: order, // Link lại với order
                  sku: itemData.sku,
                  quantity: qty,
                  unit_price: price,
                  subtotal: sub,
                  variant_color: itemData.variant_color,
                  // Copy các trường khác nếu cần
              });
              newItems.push(newItem);

              // Calc cost
              try { 
                  const costInfo = await this.productsService.calculateCostPrice(itemData.sku); 
                  totalCost += (costInfo.new_cost_price || 0) * qty; 
              } catch (e) {} 
          }

          // Lưu items mới
          await this.itemRepo.save(newItems);
          
          // Cập nhật tổng tiền đơn hàng
          order.total_amount = itemsTotal * (1 + order.vat_rate / 100) + order.shipping_fee;
          order.total_cost = totalCost;
      }

      return this.orderRepo.save(order);
  }
  // --------------------------------

  async findAll() { return this.orderRepo.find({ order: { order_date: 'DESC' }, relations: ['customer'] }); }
  
  async findOne(idOrCode: string | number) {
      let where: any = {};
      if (typeof idOrCode === 'number' || !isNaN(Number(idOrCode))) {
          where = { id: Number(idOrCode) };
      } else {
          where = { order_code: idOrCode };
      }
      const order = await this.orderRepo.findOne({ 
          where, 
          relations: ['items', 'customer', 'items.product'] 
      });
      if (!order) throw new NotFoundException('Order not found');
      return order;
  }

  // --- SUB FUNCTIONS (Payment, Delivery, etc.) ---
  async getOrder(code: string) { return this.findOne(code); }
  async completeOrder(id: number) { const order = await this.orderRepo.findOne({ where: { id } }); if (!order) throw new NotFoundException(); order.status = SalesOrderStatus.COMPLETED; return this.orderRepo.save(order); }
  async addComment(orderId: number, content: string, sender: 'STAFF'|'CUSTOMER', name?: string) { const order = await this.orderRepo.findOne({ where: { id: orderId } }); if (!order) throw new NotFoundException(); const comment = this.commentRepo.create({ order, content, sender_type: sender, sender_name: name }); return this.commentRepo.save(comment); }
  async getComments(orderId: number) { return this.commentRepo.find({ where: { order: { id: orderId } }, order: { created_at: 'ASC' } }); }
  async toggleCommentVisibility(id: number) { const comment = await this.commentRepo.findOne({ where: { id } }); if (comment) { comment.is_visible = !comment.is_visible; return this.commentRepo.save(comment); } }
  
  async convertQuoteToSo(id: number, accepted: boolean) { 
      const order = await this.orderRepo.findOne({ where: { id }, relations: ['items'] }); 
      if(!order) throw new NotFoundException(); 
      order.status = accepted ? SalesOrderStatus.SO_PENDING : SalesOrderStatus.CANCELLED; 
      // Nếu accept, có thể đổi mã từ QUOTE -> SO (Tuỳ logic)
      if(accepted && order.order_code.includes('QUOTE')) {
          order.order_code = order.order_code.replace('QUOTE', 'SO');
      }
      return this.orderRepo.save(order); 
  }
  
  async approveAllSamples(id: number) { const order = await this.orderRepo.findOne({ where: { id }, relations: ['items'] }); if(!order) throw new NotFoundException(); for(const item of order.items) { item.is_sample_approved = true; await this.orderRepo.manager.save(item); } if (order.status === SalesOrderStatus.SO_PENDING) order.status = SalesOrderStatus.SAMPLE_APPROVED; return this.orderRepo.save(order); }
  
  async deleteQuote(id: number) { const order = await this.orderRepo.findOne({ where: { id } }); if (order && (order.status === 'QUOTATION' || order.status === 'CANCELLED')) return this.orderRepo.remove(order); throw new BadRequestException('Khong the xoa'); }
  
  async getQuoteByUuid(uuid: string) { 
      const order = await this.orderRepo.findOne({ where: { uuid }, relations: ['items', 'customer', 'comments'] });
      if(!order) throw new NotFoundException('Not found');
      
      const itemsWithDesc = await Promise.all(order.items.map(async (item) => {
          const product = await this.productsService.findOneBySku(item.sku);
          return {
              ...item,
              product_desc: product?.customer_description || '', 
              product_name_real: product?.name || ''
          };
      }));
      
      const deliveries = await this.deliveryRepo.find({ where: { order_id: order.id }, relations: ['items'], order: { created_at: 'DESC' } });
      const payments = await this.transRepo.find({ where: { reference_code: order.order_code }, order: { created_at: 'DESC' } });
      return { ...order, items: itemsWithDesc, deliveries, payments };
  }

  async customerAction(uuid: string, action: 'ACCEPT' | 'REJECT') { const order = await this.getQuoteByUuid(uuid); if (order.status !== SalesOrderStatus.QUOTATION) throw new BadRequestException('Da xu ly roi'); return this.convertQuoteToSo(order.id, action === 'ACCEPT'); }
  
  async getDeliveryHistory(orderId: number) { return this.deliveryRepo.find({ where: { order_id: orderId }, relations: ['items'], order: { created_at: 'DESC' } }); }
  async getPaymentHistory(orderCode: string) { return this.transRepo.find({ where: { reference_code: orderCode }, order: { created_at: 'DESC' } }); }
  
  async createDelivery(orderId: number, data: any) { 
      const order = await this.orderRepo.findOne({ where: { id: orderId }, relations: ['items'] }); 
      if (!order) throw new NotFoundException('Not found'); 
      
      const delivery = this.deliveryRepo.create({ 
          code: data.code, 
          delivery_date: data.date, 
          note: data.note, 
          sales_order: order, 
          items: data.items.map((i:any) => ({ sku: i.sku, quantity: Math.floor(Number(i.quantity)) })) 
      }); 
      
      for (const item of data.items) { 
          const product = await this.productsService.findOneBySku(item.sku); 
          if (product) {
              await this.inventoryService.adjustStock(
                  'EXPORT', 'PRODUCT', product.id, Math.floor(Number(item.quantity)), 
                  delivery.code, `Giao hang ${order.order_code}`, 'KHO_TP' 
              ); 
          }
      } 
      
      await this.deliveryRepo.save(delivery); 
      return this.orderRepo.save(order); 
  }
}