import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder, SalesOrderStatus } from './sales-order.entity';
import { SalesOrderItem } from './sales-order-item.entity';
import { ProductSample } from './product-sample.entity';
import { SalesDelivery } from './sales-delivery.entity';
import { SalesComment } from './sales-comment.entity';
import { Transaction } from '../finance/transaction.entity';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';
import { CustomersService } from '../customers/customers.service';
import { PriceList } from './pricelist/price-list.entity';
import { PriceListRule } from './pricelist/price-list-rule.entity';
import { User } from '../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SalesService {
    private readonly logger = new Logger(SalesService.name);

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
    ) { }

    // ... (Price List Functions - Giữ nguyên) ...
    async validatePriceAgainstPriceList(sku: string, unitPrice: number, currentUserId: number): Promise<boolean> { return true; }
    async createPriceList(data: any) { return this.priceListRepo.save(this.priceListRepo.create(data)); }
    async getAllPriceLists() { return this.priceListRepo.find({ order: { id: 'DESC' } }); }
    async createPriceListRule(id: number, data: any) { return this.priceListRuleRepo.save(this.priceListRuleRepo.create({ ...data, price_list_id: id })); }
    async getPriceListRules(id: number) { return this.priceListRuleRepo.find({ where: { price_list_id: id } }); }

    // --- HELPER: GENERATE ORDER CODE ---
    async generateOrderCode(type: 'SO' | 'QUOTE'): Promise<string> {
        const prefix = type === 'SO' ? 'SO' : 'BG'; // BG = Báo Giá
        const now = new Date();
        const year = String(now.getFullYear()).slice(-2);
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const codePrefix = `${prefix}-${year}${month}-`;

        // Tìm mã lớn nhất trong tháng hiện tại để tăng số thứ tự
        const lastOrder = await this.orderRepo.createQueryBuilder('order')
            .where('order.order_code LIKE :code', { code: `${codePrefix}%` })
            .orderBy('order.id', 'DESC')
            .getOne();

        let sequence = 1;
        if (lastOrder) {
            const parts = lastOrder.order_code.split('-');
            const lastSeq = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastSeq)) sequence = lastSeq + 1;
        }

        return `${codePrefix}${String(sequence).padStart(4, '0')}`;
    }

    async createOrder(data: any) {
        // --- AUTO GENERATE CODE IF NEEDED ---
        let orderCode = data.order_code;
        if (!orderCode || orderCode.startsWith('AUTO-')) {
            orderCode = await this.generateOrderCode(data.is_quotation ? 'QUOTE' : 'SO');
        }

        const order = this.orderRepo.create({
            order_code: orderCode,
            customer: data.customer_id ? { id: data.customer_id } : null,
            customer_name: data.customer_name,
            order_date: data.order_date,
            delivery_date: data.delivery_date,
            status: data.is_quotation ? SalesOrderStatus.QUOTATION : SalesOrderStatus.SO_PENDING,
            uuid: uuidv4(),
            vat_company_name: data.vat_company_name, vat_tax_code: data.vat_tax_code, vat_address: data.vat_address, vat_rate: Number(data.vat_rate) || 0,
            shipping_address: data.shipping_address, receiver_name: data.receiver_name, receiver_phone: data.receiver_phone, shipping_carrier: data.shipping_carrier, shipping_fee: Number(data.shipping_fee) || 0,
            discount_rate: Number(data.discount_rate) || 0,
            discount_amount: Number(data.discount_amount) || 0,
            payment_note: data.payment_note, terms_content: data.terms_content, note: data.note,
            paid_amount: 0 // Init
        });

        const validItems = (data.items || []).filter((i: any) => i.sku);
        let itemsTotal = 0;

        const orderItems = await Promise.all(validItems.map(async (itemData: any) => {
            const qty = Number(itemData.quantity) || 0;
            const price = Number(itemData.unit_price || itemData.price) || 0;
            const sub = qty * price;
            itemsTotal += sub;

            const product = await this.productsService.findOneBySku(itemData.sku);

            return this.orderRepo.manager.create(SalesOrderItem, {
                sku: itemData.sku,
                product: product,
                quantity: qty,
                unit_price: price,
                subtotal: sub,
                variant_color: itemData.variant_color,
                vat_content: itemData.vat_content,
                sample_image: itemData.sample_image,
                position: validItems.indexOf(itemData) + 1 // Save Position
            });
        }));

        order.items = orderItems;

        const subtotal = itemsTotal;
        const discountAmount = order.discount_amount; // Đã chốt số tiền giảm từ FE hoặc tính toán trước
        // Công thức: (Subtotal - Discount) * (1 + VAT) + Shipping
        const taxable = Math.max(0, subtotal - discountAmount);
        order.total_amount = taxable * (1 + order.vat_rate / 100) + order.shipping_fee;
        return this.orderRepo.save(order);
    }

    // --- CANCEL ORDER ---
    async cancelOrder(id: number, reason: string) {
        const order = await this.orderRepo.findOne({ where: { id } });
        if (!order) throw new NotFoundException('Order not found');
        order.status = SalesOrderStatus.CANCELLED;
        order.cancel_reason = reason;
        return this.orderRepo.save(order);
    }

    // --- LOGIC TÍNH TOÁN THANH TOÁN (Helper) ---
    private async calculatePaidAmount(orderCode: string): Promise<number> {
        const payments = await this.transRepo.find({ where: { reference_code: orderCode } });
        return payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    }

    // --- FIND ALL (FIX: Tính tổng tiền đã trả) ---
    async findAll() {
        const orders = await this.orderRepo.find({
            order: { order_date: 'DESC' }, // Sắp xếp theo ngày tạo mới nhất
            relations: ['customer', 'assigned_to']
        });

        // Map qua từng order để tính tiền đã trả từ bảng Transaction
        const ordersWithPayment = await Promise.all(orders.map(async (order) => {
            const paid = await this.calculatePaidAmount(order.order_code);
            return { ...order, paid_amount: paid };
        }));

        return ordersWithPayment;
    }

    // --- FIND ONE (FIX: Tính tổng tiền đã trả) ---
    async findOne(idOrCode: string | number) {
        const query = this.orderRepo.createQueryBuilder('order')
            .leftJoinAndSelect('order.customer', 'customer')
            .leftJoinAndSelect('order.assigned_to', 'assigned_to')
            .leftJoinAndSelect('order.items', 'items')
            .leftJoinAndSelect('items.product', 'product');

        if (typeof idOrCode === 'number' || !isNaN(Number(idOrCode))) {
            query.where('order.id = :id', { id: Number(idOrCode) });
        } else {
            query.where('order.order_code = :code', { code: String(idOrCode) });
        }

        query.orderBy('items.position', 'ASC'); // SORT BY POSITION

        const order = await query.getOne();
        if (!order) throw new NotFoundException('Order not found');

        // Tính toán số tiền đã trả
        const paid = await this.calculatePaidAmount(order.order_code);

        return { ...order, paid_amount: paid }; // Trả về paid_amount realtime
    }

    // --- UPDATE ---
    async update(id: number, data: any) {
        const order = await this.orderRepo.findOne({ where: { id }, relations: ['items'] });
        if (!order) throw new NotFoundException('Order Not Found');

        if (data.customer_id) order.customer = { id: data.customer_id } as any;
        if (data.order_date) order.order_date = data.order_date;
        if (data.delivery_date) order.delivery_date = data.delivery_date;
        if (data.delivery_date) order.delivery_date = data.delivery_date;
        if (data.status) order.status = data.status;
        if (data.note !== undefined) order.note = data.note;

        order.vat_rate = Number(data.vat_rate) || 0;
        order.shipping_fee = Number(data.shipping_fee) || 0;

        if (data.discount_rate !== undefined) order.discount_rate = Number(data.discount_rate);
        if (data.discount_amount !== undefined) order.discount_amount = Number(data.discount_amount);

        if (data.items) {
            console.log('--- UPDATING ITEMS ---');                    // DEBUG
            console.log(JSON.stringify(data.items, null, 2));         // DEBUG
            await this.itemRepo.delete({ order: { id: id } });
            const validItems = data.items.filter((i: any) => i.sku);
            let itemsTotal = 0;

            const newItems = await Promise.all(validItems.map(async (itemData: any) => {
                const qty = Number(itemData.quantity) || 0;
                const price = Number(itemData.unit_price) || 0;
                const sub = qty * price;
                itemsTotal += sub;

                const product = await this.productsService.findOneBySku(itemData.sku);

                return this.itemRepo.create({
                    order,
                    sku: itemData.sku,
                    product: product,
                    quantity: qty,
                    unit_price: price,
                    subtotal: sub,
                    variant_color: itemData.variant_color,
                    vat_content: itemData.vat_content,
                    sample_image: itemData.sample_image, // <--- Ensure this is mapped
                    position: validItems.indexOf(itemData) + 1 // Save Position
                });
            }));

            await this.itemRepo.save(newItems);

            // --- QUAN TRỌNG: Cập nhật lại relation trong object Order để save(order) ko bị cascade lại items cũ ---
            order.items = newItems;

            // Recalculate Total
            const subtotal = itemsTotal;
            const discount = Number(order.discount_amount) || 0;
            const taxable = Math.max(0, subtotal - discount);
            order.total_amount = taxable * (1 + order.vat_rate / 100) + order.shipping_fee;
        }

        const saved = await this.orderRepo.save(order);
        // Return fresh data with payment info
        return this.findOne(saved.id);
    }

    async updateQuote(id: number, b: any) { return this.update(id, b); }
    async getOrder(code: string) { return this.findOne(code); }

    // ... (Các hàm phụ khác giữ nguyên) ...
    async completeOrder(id: number) { const order = await this.orderRepo.findOne({ where: { id } }); if (!order) throw new NotFoundException(); order.status = SalesOrderStatus.COMPLETED; return this.orderRepo.save(order); }
    async addComment(orderId: number, content: string, sender: 'STAFF' | 'CUSTOMER', name?: string) { const order = await this.orderRepo.findOne({ where: { id: orderId } }); if (!order) throw new NotFoundException(); const comment = this.commentRepo.create({ order, content, sender_type: sender, sender_name: name }); return this.commentRepo.save(comment); }
    async getComments(orderId: number) { return this.commentRepo.find({ where: { order: { id: orderId } }, order: { created_at: 'ASC' } }); }
    async toggleCommentVisibility(id: number) { const comment = await this.commentRepo.findOne({ where: { id } }); if (comment) { comment.is_visible = !comment.is_visible; return this.commentRepo.save(comment); } }
    async convertQuoteToSo(id: number, accepted: boolean) { const order = await this.orderRepo.findOne({ where: { id } }); if (!order) throw new NotFoundException(); order.status = accepted ? SalesOrderStatus.SO_PENDING : SalesOrderStatus.CANCELLED; return this.orderRepo.save(order); }
    async approveAllSamples(id: number) { const order = await this.orderRepo.findOne({ where: { id }, relations: ['items'] }); if (!order) throw new NotFoundException(); for (const item of order.items) { item.is_sample_approved = true; await this.orderRepo.manager.save(item); } if (order.status === SalesOrderStatus.SO_PENDING) order.status = SalesOrderStatus.SAMPLE_APPROVED; return this.orderRepo.save(order); }
    async deleteQuote(id: number) { return this.orderRepo.delete(id); }
    async getQuoteByUuid(uuid: string) {
        const order = await this.orderRepo.findOne({
            where: { uuid },
            relations: ['customer', 'customer.contacts', 'items', 'items.product', 'comments', 'deliveries', 'deliveries.items']
        });
        if (!order) throw new NotFoundException('Quote not found');

        // FIX: Ensure product relationship for items if missing (for legacy data)
        for (const item of order.items) {
            if (!item.product && item.sku) {
                item.product = await this.productsService.findOneBySku(item.sku);
            }
        }

        // Fetch Payments manually
        const transactions = await this.transRepo.find({
            where: { reference_code: order.order_code, reference_type: 'SALES' },
            order: { date: 'DESC' }
        });

        const paid = await this.calculatePaidAmount(order.order_code);
        return { ...order, paid_amount: paid, payments: transactions };
    }
    async customerAction(uuid: string, action: 'ACCEPT' | 'REJECT') { const q = await this.getQuoteByUuid(uuid); if (q) return this.convertQuoteToSo(q.id, action === 'ACCEPT'); }
    async getDeliveryHistory(orderId: number) { return this.deliveryRepo.find({ where: { order_id: orderId }, relations: ['items'], order: { created_at: 'DESC' } }); }
    async getPaymentHistory(orderCode: string) { return this.transRepo.find({ where: { reference_code: orderCode }, order: { created_at: 'DESC' } }); }
    async createDelivery(orderId: number, data: any) {
        const order = await this.orderRepo.findOne({ where: { id: orderId }, relations: ['items'] });
        if (!order) throw new NotFoundException('Not found');

        const delivery = this.deliveryRepo.create({ code: data.code, delivery_date: data.date, note: data.note, sales_order: order, items: data.items });
        const savedDelivery = await this.deliveryRepo.save(delivery);

        // --- TRIGGER INVENTORY EXPORT ---
        // --- TRIGGER INVENTORY EXPORT ---
        for (const item of savedDelivery.items) {
            const product = await this.productsService.findOneBySku(item.sku);
            if (product) {
                try {
                    // Check if Combo (has components)
                    const components = await this.productsService.getComboComponents(item.sku);

                    if (components && components.length > 0) {
                        // Is Combo -> Deduct Components
                        for (const comp of components) {
                            if (comp.child_product) {
                                await this.inventoryService.adjustStock(
                                    'EXPORT',
                                    'PRODUCT',
                                    comp.child_product.id,
                                    Number(item.quantity) * Number(comp.quantity), // Qty * Component Qty
                                    savedDelivery.code,
                                    `Xuất Combo ${item.sku} (Đơn ${order.order_code})`,
                                    'KHO_TP'
                                );
                            }
                        }
                    } else {
                        // Is Single Product -> Deduct Itself
                        await this.inventoryService.adjustStock(
                            'EXPORT',
                            'PRODUCT',
                            product.id,
                            Number(item.quantity),
                            savedDelivery.code,
                            `Giao hàng đơn ${order.order_code}`,
                            'KHO_TP' // Mặc định xuất từ Kho Thành Phẩm
                        );
                    }

                } catch (e) {
                    this.logger.error(`Failed to export stock for ${item.sku}: ${e.message}`);
                    // Có thể throw lỗi để rollback nếu cần chặt chẽ
                }
            }
        }

        return this.orderRepo.save(order);
    }
}