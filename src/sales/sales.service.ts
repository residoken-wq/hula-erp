import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder, SalesOrderStatus } from './sales-order.entity';
import { SalesOrderItem } from './sales-order-item.entity';
import { ProductSample } from './product-sample.entity';
import { SalesDelivery } from './sales-delivery.entity';
import { SalesComment } from './sales-comment.entity';
import { SalesChecklist } from './sales-checklist.entity';
import { SalesChecklistItem } from './sales-checklist-item.entity';
import { Transaction } from '../finance/transaction.entity';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';
import { CustomersService } from '../customers/customers.service';
import { PriceList } from './pricelist/price-list.entity';
import { PriceListRule } from './pricelist/price-list-rule.entity';
import { User } from '../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { SalesOrderVersion } from './sales-order-version.entity';
import { SystemService } from '../system/system.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SalesTarget } from './sales-target.entity';
import { Customer } from '../customers/customer.entity';

// --- CHECKLIST TEMPLATES ---
const CHECKLIST_TEMPLATES: Record<string, Array<{ code: string; name: string; sort: number }>> = {
    QUOTATION: [
        { code: 'QUOTE_CONTACT', name: 'Liên hệ khách hàng xác nhận yêu cầu', sort: 1 },
        { code: 'QUOTE_SEND', name: 'Gửi báo giá (Link portal / PDF)', sort: 2 },
        { code: 'QUOTE_FOLLOWUP', name: 'Follow-up báo giá (2-3 ngày)', sort: 3 },
        { code: 'QUOTE_CONFIRM', name: 'Xác nhận chốt đơn', sort: 4 },
    ],
    SO_PENDING: [
        { code: 'SO_SAMPLE', name: 'Xác nhận mẫu (Upload hình, khách duyệt)', sort: 5 },
        { code: 'SO_DEPOSIT', name: 'Thu đặt cọc (30-50%)', sort: 6 },
        { code: 'SO_PLAN', name: 'Lập kế hoạch sản xuất', sort: 7 },
    ],
    IN_PRODUCTION: [
        { code: 'PROD_UPDATE', name: 'Cập nhật tiến độ cho khách', sort: 8 },
        { code: 'PROD_QC', name: 'Kiểm tra chất lượng (QC) trước hoàn thành', sort: 9 },
    ],
    MANUFACTURING_COMPLETED: [
        { code: 'PROD_FINISH', name: 'Đóng gói & Nhập kho thành phẩm', sort: 9.1 },
        { code: 'DEL_PLAN', name: 'Liên hệ khách lên lịch giao hàng', sort: 9.2 },
    ],
    DELIVERED: [
        { code: 'DEL_CONFIRM', name: 'Xác nhận khách nhận hàng OK', sort: 10 },
        { code: 'DEL_PAYMENT', name: 'Thu công nợ còn lại (50-70%)', sort: 11 },
        { code: 'DEL_INVOICE', name: 'Gửi hóa đơn VAT (nếu có)', sort: 12 },
    ],
    COMPLETED: [
        { code: 'POST_THANKS', name: 'Gửi thư cảm ơn (sau 3 ngày)', sort: 13 },
        { code: 'POST_SURVEY', name: 'Khảo sát hài lòng (sau 7 ngày)', sort: 14 },
        { code: 'POST_UPSELL', name: 'Đề xuất sản phẩm bổ sung (up-sell)', sort: 15 },
        { code: 'POST_CROSSSELL', name: 'Nhắc đặt hàng lại (cross-sell, 30 ngày)', sort: 16 },
    ],
};

@Injectable()
export class SalesService {
    private readonly logger = new Logger(SalesService.name);

    constructor(
        @InjectRepository(SalesOrder) public orderRepo: Repository<SalesOrder>,
        @InjectRepository(SalesOrderItem) public itemRepo: Repository<SalesOrderItem>,
        @InjectRepository(ProductSample) public sampleRepo: Repository<ProductSample>,
        @InjectRepository(SalesDelivery) private deliveryRepo: Repository<SalesDelivery>,
        @InjectRepository(SalesComment) private commentRepo: Repository<SalesComment>,
        @InjectRepository(SalesChecklist) private checklistRepo: Repository<SalesChecklist>,
        @InjectRepository(SalesChecklistItem) private checklistItemRepo: Repository<SalesChecklistItem>,
        private systemService: SystemService,
        @InjectRepository(Transaction) private transRepo: Repository<Transaction>,
        @InjectRepository(PriceList) private priceListRepo: Repository<PriceList>,
        @InjectRepository(PriceListRule) private priceListRuleRepo: Repository<PriceListRule>,
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(SalesOrderVersion) private versionRepo: Repository<SalesOrderVersion>,
        @InjectRepository(SalesTarget) private targetRepo: Repository<SalesTarget>,
        @InjectRepository(Customer) private customerRepo: Repository<Customer>,
        private productsService: ProductsService,
        private inventoryService: InventoryService,
        private customersService: CustomersService,
        private notificationsService: NotificationsService,
    ) { }


    // ... (Price List Functions - Giữ nguyên) ...
    async validatePriceAgainstPriceList(sku: string, unitPrice: number, currentUserId: number): Promise<boolean> { return true; }
    async createPriceList(data: any) { return this.priceListRepo.save(this.priceListRepo.create(data)); }
    async getAllPriceLists() { return this.priceListRepo.find({ order: { id: 'DESC' } }); }
    async createPriceListRule(id: number, data: any) { return this.priceListRuleRepo.save(this.priceListRuleRepo.create({ ...data, price_list_id: id })); }
    async getPriceListRules(id: number) { return this.priceListRuleRepo.find({ where: { price_list_id: id } }); }

    // --- HELPER: GENERATE ORDER CODE ---
    async generateOrderCode(type: 'SO' | 'QUOTE' | 'SO_WEB'): Promise<string> {
        // SO_WEB = Website order: SO_Web_0001
        // SO = Regular order: SO-YYMM-0001
        // QUOTE = Quotation: BG-YYMM-0001

        if (type === 'SO_WEB') {
            // Website orders: SO_Web_xxxx (simple sequential)
            const codePrefix = 'SO_Web_';
            const lastOrder = await this.orderRepo.createQueryBuilder('order')
                .where('order.order_code LIKE :code', { code: `${codePrefix}%` })
                .orderBy('order.id', 'DESC')
                .getOne();

            let sequence = 1;
            if (lastOrder) {
                const parts = lastOrder.order_code.split('_');
                const lastSeq = parseInt(parts[parts.length - 1]);
                if (!isNaN(lastSeq)) sequence = lastSeq + 1;
            }
            return `${codePrefix}${String(sequence).padStart(4, '0')}`;
        }

        // Regular SO and QUOTE: XX-YYMM-0001
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
        const isWebOrder = data.order_source === 'WEBSITE';

        if (!orderCode || orderCode.startsWith('AUTO-')) {
            // Use SO_WEB for website orders, QUOTE for quotations, SO for regular
            const codeType = data.is_quotation ? 'QUOTE' : (isWebOrder ? 'SO_WEB' : 'SO');
            orderCode = await this.generateOrderCode(codeType);
        }

        const order = this.orderRepo.create({
            order_code: orderCode,
            customer: (data.customer_id && data.customer_id !== -1) ? { id: data.customer_id } : null,
            customer_name: (data.customer_id === -1) ? 'Sản Xuất Nội Bộ' : data.customer_name,
            order_date: data.order_date,
            delivery_date: data.delivery_date,
            status: data.is_quotation ? SalesOrderStatus.QUOTATION : SalesOrderStatus.SO_PENDING,
            uuid: uuidv4(),
            vat_company_name: data.vat_company_name, vat_tax_code: data.vat_tax_code, vat_address: data.vat_address, vat_rate: Number(data.vat_rate) || 0,
            vat_invoice_link: data.vat_invoice_link, vat_email: data.vat_email,
            shipping_address: data.shipping_address, receiver_name: data.receiver_name, receiver_phone: data.receiver_phone, shipping_carrier: data.shipping_carrier, shipping_fee: Number(data.shipping_fee) || 0,
            discount_rate: Number(data.discount_rate) || 0,
            discount_amount: Number(data.discount_amount) || 0,
            deposit_percent: Number(data.deposit_percent) || 0,
            deposit_amount: Number(data.deposit_amount) || 0,
            payment_note: data.payment_note, terms_content: data.terms_content, note: data.note,
            assigned_to: data.assigned_to_id ? { id: data.assigned_to_id } as any : null,
            paid_amount: 0, // Init
            order_source: data.order_source || 'ERP' // Track order source
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
                image_url: itemData.image_url || (product ? product.image_url : null), // <--- Prioritize User Input
                position: validItems.indexOf(itemData) + 1 // Save Position
            });
        }));

        order.items = orderItems;

        const subtotal = itemsTotal;
        const discountAmount = order.discount_amount; // Đã chốt số tiền giảm từ FE hoặc tính toán trước
        // Công thức: (Subtotal - Discount) * (1 + VAT) + Shipping
        const taxable = Math.max(0, subtotal - discountAmount);
        order.total_amount = taxable * (1 + order.vat_rate / 100) + order.shipping_fee;
        const saved = await this.orderRepo.save(order);

        // AUTO-INIT CHECKLIST
        await this.initChecklist(saved.id, saved.status);

        await this.systemService.logAction('SALES', 'CREATE_ORDER', `Created Order/Quote ${saved.order_code}`, data.user_id, data.username, saved.order_code);

        // --- NOTIFICATION: Assignee ---
        if (saved.assigned_to) {
            const assigneeId = saved.assigned_to.id; // Relations are not fully loaded but id should be there
            if (assigneeId && Number(assigneeId) !== Number(data.user_id)) {
                await this.notificationsService.create({
                    user_id: Number(assigneeId),
                    title: '📦 Bạn được giao đơn hàng mới',
                    message: `Bạn được giao phụ trách đơn hàng ${saved.order_code}`,
                    type: 'INFO',
                    link: `/sales?order=${saved.id}&highlight=order-${saved.id}`,
                    is_read: false
                });
            }
        }

        return saved;
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

        // Capture Old State for Diffing
        const oldOrder = { ...order, items: order.items?.map(i => ({ sku: i.sku, qty: i.quantity })) };

        if (data.customer_id) {
            if (data.customer_id === -1) {
                order.customer = null;
                order.customer_name = 'Sản Xuất Nội Bộ';
            } else {
                order.customer = { id: data.customer_id } as any;
            }
        }
        if (data.order_date) order.order_date = data.order_date;
        if (data.delivery_date) order.delivery_date = data.delivery_date;
        // if (data.delivery_date) order.delivery_date = data.delivery_date; // Remove duplicate
        if (data.status) order.status = data.status;
        if (data.note !== undefined) order.note = data.note;
        if (data.is_production_sample_approved !== undefined) order.is_production_sample_approved = data.is_production_sample_approved;

        // --- SAMPLE IMAGES ---
        if (data.approved_sample_images !== undefined) order.approved_sample_images = data.approved_sample_images;

        // --- INVOICE INFO ---
        if (data.vat_company_name !== undefined) order.vat_company_name = data.vat_company_name;
        if (data.vat_tax_code !== undefined) order.vat_tax_code = data.vat_tax_code;
        if (data.vat_address !== undefined) order.vat_address = data.vat_address;
        if (data.vat_invoice_link !== undefined) order.vat_invoice_link = data.vat_invoice_link;
        if (data.vat_email !== undefined) order.vat_email = data.vat_email;

        order.vat_rate = Number(data.vat_rate) || 0;
        order.shipping_fee = Number(data.shipping_fee) || 0;

        if (data.discount_rate !== undefined) order.discount_rate = Number(data.discount_rate);
        if (data.discount_amount !== undefined) order.discount_amount = Number(data.discount_amount);
        if (data.deposit_percent !== undefined) order.deposit_percent = Number(data.deposit_percent);
        if (data.deposit_amount !== undefined) order.deposit_amount = Number(data.deposit_amount);
        if (data.assigned_to_id !== undefined) order.assigned_to = data.assigned_to_id ? { id: data.assigned_to_id } as any : null;

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
                    image_url: itemData.image_url || (product ? product.image_url : null), // <--- Prioritize User Input
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

        // SYNC CHECKLIST IF STATUS CHANGED
        if (data.status) {
            await this.syncChecklistWithStatus(saved.id, saved.status);
        }

        // --- CALCULATE DIFF ---
        const changes: any = {};
        // Simple comparison for key fields
        const fieldsToCheck = [
            'status', 'delivery_date', 'customer_name', 'note', 'vat_company_name',
            'shipping_fee', 'discount_amount', 'total_amount'
        ];

        fieldsToCheck.forEach(field => {
            if (JSON.stringify(oldOrder[field]) !== JSON.stringify(saved[field])) {
                changes[field] = { old: oldOrder[field], new: saved[field] };
            }
        });

        // Items comparison (simplified)
        if (data.items) {
            const oldItemsStr = JSON.stringify(oldOrder.items);
            const newItemsStr = JSON.stringify(saved.items?.map(i => ({ sku: i.sku, qty: i.quantity })));
            if (oldItemsStr !== newItemsStr) {
                changes['items'] = 'Items changed';
            }
        }

        // Log Update with Details
        await this.systemService.logAction(
            'SALES',
            'UPDATE_ORDER',
            `Updated Order ${saved.order_code}`,
            data.user_id,
            data.username,
            saved.order_code,
            Object.keys(changes).length > 0 ? changes : null // Pass diff as details
        );

        // --- NOTIFICATIONS ---
        const oldAssigneeId = oldOrder.assigned_to?.id;
        const newAssigneeId = saved.assigned_to?.id;
        const currentUserId = Number(data.user_id);

        // 1. Assignee Changed
        if (newAssigneeId && newAssigneeId !== oldAssigneeId) {
            if (Number(newAssigneeId) !== currentUserId) {
                await this.notificationsService.create({
                    user_id: Number(newAssigneeId),
                    title: '📦 Bạn được giao đơn hàng',
                    message: `Đơn hàng ${saved.order_code} đã được chuyển giao cho bạn.`,
                    type: 'INFO',
                    link: `/sales?order=${saved.id}&highlight=order-${saved.id}`,
                    is_read: false
                });
            }
        }

        // 2. Status Changed
        if (oldOrder.status !== saved.status) {
            // Notify Assignee (if they didn't change it themselves)
            if (newAssigneeId && Number(newAssigneeId) !== currentUserId) {
                await this.notificationsService.create({
                    user_id: Number(newAssigneeId),
                    title: '🔄 Cập nhật trạng thái đơn hàng',
                    message: `Đơn hàng ${saved.order_code} đã chuyển sang: ${saved.status}`,
                    type: 'INFO',
                    link: `/sales?order=${saved.id}&highlight=order-${saved.id}`,
                    is_read: false
                });
            }
        }
        // Return fresh data with payment info
        return this.findOne(saved.id);
    }

    // --- REVISIONS ---
    async createRevision(orderId: number, userId?: number, username?: string) {
        const order = await this.orderRepo.findOne({ where: { id: orderId }, relations: ['items', 'items.product'] });
        if (!order) throw new NotFoundException('Order not found');

        // Snapshot current data
        const snapshot = { ...order };
        delete snapshot.id; // Avoid ID conflict in snapshot if strictly used

        const version = this.versionRepo.create({
            order,
            version_number: order.version,
            data_snapshot: snapshot,
            created_by: username || String(userId)
        });
        await this.versionRepo.save(version);

        // Increment Order Version
        order.version = (order.version || 1) + 1;
        await this.orderRepo.save(order);

        await this.systemService.logAction('SALES', 'CREATE_REVISION', `Created Version ${order.version - 1} for ${order.order_code}`, userId, username, order.order_code);
        return this.getRevisions(orderId);
    }

    async getRevisions(orderId: number) {
        return this.versionRepo.find({ where: { order: { id: orderId } }, order: { version_number: 'DESC' } });
    }

    async updateQuote(id: number, b: any) { return this.update(id, b); }
    async getOrder(code: string) { return this.findOne(code); }

    // ... (Các hàm phụ khác giữ nguyên) ...
    async completeOrder(id: number) {
        const order = await this.orderRepo.findOne({ where: { id } });
        if (!order) throw new NotFoundException();
        order.status = SalesOrderStatus.COMPLETED;
        const saved = await this.orderRepo.save(order);
        await this.syncChecklistWithStatus(saved.id, saved.status);
        return saved;
    }
    async addComment(orderId: number, content: string, sender: 'STAFF' | 'CUSTOMER', name?: string, commentType: 'CUSTOMER' | 'INTERNAL' = 'CUSTOMER', mentionedUserIds?: string) {
        const order = await this.orderRepo.findOne({ where: { id: orderId } });
        if (!order) throw new NotFoundException();
        const comment = this.commentRepo.create({
            order,
            content,
            sender_type: sender,
            sender_name: name,
            comment_type: commentType,
            mentioned_user_ids: mentionedUserIds,
            is_visible: commentType === 'CUSTOMER' // Internal comments are hidden on Portal
        });
        const savedComment = await this.commentRepo.save(comment);

        // Create notifications for @mentioned users (INTERNAL comments only)
        if (mentionedUserIds && commentType === 'INTERNAL') {
            const userIds = mentionedUserIds.split(',').filter(id => id.trim());
            for (const userId of userIds) {
                await this.notificationsService.create({
                    user_id: parseInt(userId, 10),
                    title: `${name || 'Nhân viên'} đã nhắc đến bạn`,
                    message: `Trong đơn hàng ${order.order_code}: ${content.replace(/<[^>]*>/g, '').substring(0, 100)}...`,
                    type: 'INFO',
                    link: `/sales?order=${order.id}&tab=INTERNAL&highlight=comment-${savedComment.id}`,
                    is_read: false
                });
            }
        }

        return savedComment;
    }

    // Filter out deleted comments (deleted_at is null means not deleted)
    async getComments(orderId: number) {
        return this.commentRepo.find({
            where: { order: { id: orderId }, deleted_at: null as any },
            order: { created_at: 'ASC' }
        });
    }

    // Get all comments including deleted (for admin view)
    async getAllComments(orderId: number) {
        return this.commentRepo.find({
            where: { order: { id: orderId } },
            order: { created_at: 'ASC' }
        });
    }

    async toggleCommentVisibility(id: number) {
        const comment = await this.commentRepo.findOne({ where: { id } });
        if (comment) {
            comment.is_visible = !comment.is_visible;
            return this.commentRepo.save(comment);
        }
    }

    // Soft delete: mark as deleted but keep in database
    async softDeleteComment(id: number, deletedBy: string = 'Khách hàng') {
        const comment = await this.commentRepo.findOne({ where: { id } });
        if (!comment) throw new NotFoundException('Comment not found');

        comment.deleted_at = new Date();
        comment.deleted_by = deletedBy;
        comment.content = `[Đã thu hồi] ${comment.content}`; // Prefix for record keeping
        return this.commentRepo.save(comment);
    }

    async updateComment(id: number, content: string) {
        const comment = await this.commentRepo.findOne({ where: { id } });
        if (!comment) throw new NotFoundException('Comment not found');
        comment.content = content;
        return this.commentRepo.save(comment);
    }
    async convertQuoteToSo(id: number, accepted: boolean) {
        const order = await this.orderRepo.findOne({ where: { id } });
        if (!order) throw new NotFoundException();
        order.status = accepted ? SalesOrderStatus.SO_PENDING : SalesOrderStatus.CANCELLED;
        const saved = await this.orderRepo.save(order);
        if (accepted) await this.syncChecklistWithStatus(saved.id, saved.status);
        return saved;
    }
    async approveAllSamples(id: number) {
        const order = await this.orderRepo.findOne({ where: { id }, relations: ['items'] });
        if (!order) throw new NotFoundException();
        for (const item of order.items) { item.is_sample_approved = true; await this.orderRepo.manager.save(item); }
        if (order.status === SalesOrderStatus.SO_PENDING) order.status = SalesOrderStatus.SAMPLE_APPROVED;
        const saved = await this.orderRepo.save(order);
        await this.syncChecklistWithStatus(saved.id, saved.status);
        return saved;
    }
    async deleteQuote(id: number) { return this.orderRepo.delete(id); }

    // --- DELETE ORDER (Only SO_PENDING status allowed) ---
    async deleteOrder(id: number) {
        const order = await this.orderRepo.findOne({ where: { id } });
        if (!order) throw new NotFoundException('Order not found');

        // Chỉ cho phép xóa SO ở trạng thái "Mới" (SO_PENDING)
        if (order.status !== SalesOrderStatus.SO_PENDING) {
            throw new Error('Chỉ có thể xóa đơn hàng ở trạng thái "Mới"');
        }

        // Xóa các items liên quan
        await this.itemRepo.delete({ order: { id } });

        // Xóa checklist nếu có
        const checklist = await this.checklistRepo.findOne({ where: { order_id: id } });
        if (checklist) {
            await this.checklistItemRepo.delete({ checklist: { id: checklist.id } });
            await this.checklistRepo.delete(checklist.id);
        }

        // Xóa comments nếu có
        await this.commentRepo.delete({ order: { id } });

        // Xóa đơn hàng
        await this.systemService.logAction('SALES', 'DELETE_ORDER', `Deleted Order ${order.order_code}`, null, null, order.order_code);
        return this.orderRepo.delete(id);
    }
    async getQuoteByUuid(uuid: string) {
        const order = await this.orderRepo.findOne({
            where: { uuid },
            relations: ['customer', 'customer.contacts', 'items', 'items.product', 'comments', 'deliveries', 'deliveries.items'],
            order: { items: { position: 'ASC' } }
        });
        if (!order) throw new NotFoundException('Quote not found');

        // FIX: Ensure product relationship for items if missing (for legacy data)
        for (const item of order.items) {
            if (!item.product && item.sku) {
                item.product = await this.productsService.findOneBySku(item.sku);
            }
        }

        // Feature: Auto-populate description for COMBO products if empty
        if (order.items && order.items.length > 0) {
            await this.productsService.populateComboDescriptions(order.items);
        }

        // Filter out deleted comments for Portal View (Manual filter because relations loading ignores where condition)
        if (order.comments) {
            order.comments = order.comments.filter(c => !c.deleted_at);
        }

        // Fetch Payments manually
        const transactions = await this.transRepo.find({
            where: { reference_code: order.order_code, reference_type: 'SALES' },
            order: { date: 'DESC' }
        });

        const paid = await this.calculatePaidAmount(order.order_code);
        return { ...order, paid_amount: paid, payments: transactions };
    }
    async customerAction(uuid: string, action: 'ACCEPT' | 'REJECT', metadata?: any) {
        const q = await this.getQuoteByUuid(uuid);
        if (q) {
            if (action === 'ACCEPT') {
                // Log with metadata
                await this.systemService.logAction(
                    'SALES',
                    'CUSTOMER_ACCEPT',
                    `Khách hàng xác nhận đơn ${q.order_code}`,
                    null,
                    'Customer',
                    q.order_code,
                    null,
                    metadata
                );
            }
            return this.convertQuoteToSo(q.id, action === 'ACCEPT');
        }
    }
    async getDeliveryHistory(orderId: number) { return this.deliveryRepo.find({ where: { order_id: orderId }, relations: ['items'], order: { created_at: 'DESC' } }); }
    async getPaymentHistory(orderCode: string) { return this.transRepo.find({ where: { reference_code: orderCode }, order: { created_at: 'DESC' } }); }
    async createDelivery(orderId: number, data: any) {
        const order = await this.orderRepo.findOne({ where: { id: orderId }, relations: ['items'] });
        if (!order) throw new NotFoundException('Not found');

        const delivery = this.deliveryRepo.create({
            code: data.code,
            delivery_date: data.date,
            note: data.note,
            delivery_address: data.delivery_address,
            contact_name: data.contact_name,
            contact_phone: data.contact_phone,
            sales_order: order,
            items: data.items,
            attachments: data.attachments || [] // <--- Save Attachments
        });
        const savedDelivery = await this.deliveryRepo.save(delivery);



        // NO AUTO DEDUCT STOCK HERE. 
        // Stock will be deducted when Inventory User confirms (PENDING_EXPORT -> SHIPPED).

        return this.orderRepo.save(order);
    }

    async updateDelivery(deliveryId: number, data: any) {
        const delivery = await this.deliveryRepo.findOne({ where: { id: deliveryId }, relations: ['items'] });
        if (!delivery) throw new NotFoundException('Delivery not found');

        delivery.delivery_date = data.date;
        delivery.note = data.note;
        delivery.delivery_address = data.delivery_address;
        delivery.contact_name = data.contact_name;
        delivery.contact_phone = data.contact_phone;
        if (data.attachments) delivery.attachments = data.attachments; // <--- Update Attachments
        if (data.status) delivery.status = data.status; // <--- Update Status

        if (data.items) {
            // Delete old items
            await this.deliveryRepo.manager.delete('SalesDeliveryItem', { delivery: { id: deliveryId } });

            // Create new items
            // Note: Not adjusting inventory to avoid complex diff logic for now. 
            // Assuming user is fixing data, or will handle inventory manually if needed.
            // Ideally, we should diff old vs new and adjustStock.
            delivery.items = data.items.map((i: any) => ({
                sku: i.sku,
                quantity: i.quantity,
                note: i.note
            }));
        }

        return this.deliveryRepo.save(delivery);
    }

    // --- DELETE DELIVERY (Only if SO is NOT COMPLETED) ---
    async deleteDelivery(deliveryId: number) {
        const delivery = await this.deliveryRepo.findOne({
            where: { id: deliveryId },
            relations: ['items', 'sales_order']
        });
        if (!delivery) throw new NotFoundException('Phiếu xuất kho không tồn tại');

        const order = delivery.sales_order;
        if (!order) throw new NotFoundException('Đơn hàng không tồn tại');

        // Block deletion if order is COMPLETED
        if (order.status === 'COMPLETED') {
            throw new Error('Không thể xóa phiếu xuất kho khi đơn hàng đã Hoàn thành');
        }

        // If delivery was already SHIPPED, restore inventory
        if (delivery.status === 'SHIPPED') {
            for (const item of delivery.items || []) {
                // Lookup product by SKU to get ID
                const product = await this.productsService.findOneBySku(item.sku);
                if (product) {
                    await this.inventoryService.adjustStock(
                        'IMPORT',           // type: restore = import
                        'PRODUCT',          // itemType
                        product.id,         // itemId
                        Number(item.quantity), // quantity
                        delivery.code || 'PXK-DELETE', // refCode
                        `Hoàn kho từ xóa PXK ${delivery.code}`, // note
                        'MAIN'              // warehouse (default)
                    );
                }
            }
        }

        // Delete delivery items first
        await this.deliveryRepo.manager.delete('SalesDeliveryItem', { delivery: { id: deliveryId } });

        // Delete delivery
        await this.deliveryRepo.delete(deliveryId);

        return { success: true, message: 'Đã xóa phiếu xuất kho' };
    }

    // --- DELIVERY EMAIL ---
    async sendDeliveryEmail(deliveryId: number) {
        const delivery = await this.deliveryRepo.findOne({ where: { id: deliveryId }, relations: ['items', 'sales_order', 'sales_order.customer'] });
        if (!delivery) throw new NotFoundException('Delivery not found');

        const order = delivery.sales_order;
        const customer = order.customer;
        const smtpConfig = await this.systemService.getSmtpConfig();

        if (!smtpConfig.SMTP_HOST || !smtpConfig.SMTP_USER) {
            throw new Error('SMTP Config missing');
        }

        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            host: smtpConfig.SMTP_HOST,
            port: Number(smtpConfig.SMTP_PORT) || 587,
            secure: smtpConfig.SMTP_SECURE === 'true',
            auth: { user: smtpConfig.SMTP_USER, pass: smtpConfig.SMTP_PASS }
        });

        // Template
        const itemsHtml = delivery.items.map((i, idx) => `
            <tr>
                <td style="padding:8px;border:1px solid #ddd;text-align:center;">${idx + 1}</td>
                <td style="padding:8px;border:1px solid #ddd;">${i.sku}</td>
                <td style="padding:8px;border:1px solid #ddd;text-align:center;">${i.quantity}</td>
                <td style="padding:8px;border:1px solid #ddd;"></td> 
            </tr>
        `).join('');

        const portalLink = `https://hula-erp.vn/portal/quote/${order.uuid}`; // Replace with actual domain from env if possible, or config

        const html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #1890ff;">Thông Báo Giao Hàng</h2>
                <p>Kính gửi <b>${customer ? customer.name : (order.customer_name || delivery.contact_name)}</b>,</p>
                <p>Đơn hàng <b>${order.order_code}</b> của quý khách đang được giao.</p>
                
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><b>Mã Phiếu Xuất:</b> ${delivery.code}</p>
                    <p><b>Ngày Giao:</b> ${new Date(delivery.delivery_date).toLocaleDateString('vi-VN')}</p>
                    <p><b>Người Nhận:</b> ${delivery.contact_name} (${delivery.contact_phone})</p>
                    <p><b>Địa Chỉ:</b> ${delivery.delivery_address}</p>
                </div>

                <h3>Chi Tiết Giao Hàng:</h3>
                <table style="width:100%; border-collapse:collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background:#eee;">
                            <th style="padding:8px;border:1px solid #ddd;">STT</th>
                            <th style="padding:8px;border:1px solid #ddd;">Sản Phẩm</th>
                            <th style="padding:8px;border:1px solid #ddd;">SL</th>
                            <th style="padding:8px;border:1px solid #ddd;">Ghi Chú</th>
                        </tr>
                    </thead>
                    <tbody>${itemsHtml}</tbody>
                </table>

                <p>Quý khách có thể theo dõi tiến độ đơn hàng tại:</p>
                <a href="${portalLink}" style="display:inline-block;padding:10px 20px;background:#1890ff;color:#fff;text-decoration:none;border-radius:4px;">Xem Đơn Hàng Online</a>
                
                <p style="margin-top:20px; font-size:12px; color:#999;">Cảm ơn quý khách đã tin tưởng HULA ERP.</p>
            </div>
        `;

        await transporter.sendMail({
            from: `"${smtpConfig.SMTP_FROM_NAME}" <${smtpConfig.SMTP_FROM_EMAIL}>`,
            to: (customer && customer.email) || 'shinwon93@gmail.com', // Fallback for dev/demo or use contact email
            subject: `[HULA] Thông Báo Giao Hàng - ${delivery.code}`,
            html: html
        });

        delivery.email_sent = true;
        delivery.status = 'SHIPPED'; // Update status
        return this.deliveryRepo.save(delivery);
    }

    // ========================================
    // === CHECKLIST MANAGEMENT METHODS ===
    // ========================================

    /**
     * Initialize checklist for an order (called when creating order)
     */
    async initChecklist(orderId: number, initialStatus: string = 'QUOTATION'): Promise<SalesChecklist> {
        // Check if checklist already exists
        let checklist = await this.checklistRepo.findOne({ where: { order_id: orderId } });

        if (!checklist) {
            checklist = this.checklistRepo.create({ order_id: orderId, items: [] });
            checklist = await this.checklistRepo.save(checklist);
        }

        // Add items for initial stage
        await this.addChecklistItemsForStage(checklist.id, initialStatus);

        return this.getChecklist(orderId);
    }

    /**
     * Get checklist with all items for an order
     */
    async getChecklist(orderId: number): Promise<any> {
        const checklist = await this.checklistRepo.findOne({
            where: { order_id: orderId },
            relations: ['items'],
        });

        if (!checklist) {
            // Auto-create if not exists, respecting current Order Status
            const order = await this.orderRepo.findOne({ where: { id: orderId } });
            return this.initChecklist(orderId, order?.status || 'QUOTATION');
        }

        // Sort items by sort_order
        checklist.items = (checklist.items || []).sort((a, b) => a.sort_order - b.sort_order);

        // Calculate progress
        const total = checklist.items.length;
        const completed = checklist.items.filter(i => i.is_completed).length;

        return {
            ...checklist,
            progress: { total, completed, percent: total > 0 ? Math.round((completed / total) * 100) : 0 }
        };
    }

    /**
     * Toggle a checklist item (complete/uncomplete)
     */
    async toggleChecklistItem(itemId: number, completedBy?: string): Promise<SalesChecklistItem> {
        const item = await this.checklistItemRepo.findOne({ where: { id: itemId } });
        if (!item) throw new NotFoundException('Checklist item not found');

        item.is_completed = !item.is_completed;
        item.completed_at = item.is_completed ? new Date() : null;
        item.completed_by = item.is_completed ? (completedBy || 'User') : null;

        return this.checklistItemRepo.save(item);
    }

    /**
     * Add a custom task to the checklist
     */
    async addCustomChecklistItem(orderId: number, taskName: string, dueDate?: Date): Promise<SalesChecklistItem> {
        const checklist = await this.checklistRepo.findOne({ where: { order_id: orderId } });
        if (!checklist) throw new NotFoundException('Checklist not found');

        // Get max sort order
        const maxSort = await this.checklistItemRepo
            .createQueryBuilder('item')
            .select('MAX(item.sort_order)', 'max')
            .where('item.checklist_id = :id', { id: checklist.id })
            .getRawOne();

        const newItem = this.checklistItemRepo.create({
            checklist_id: checklist.id,
            task_code: 'CUSTOM_' + Date.now(),
            task_name: taskName,
            stage: 'CUSTOM',
            is_completed: false,
            due_date: dueDate || null,
            sort_order: (maxSort?.max || 0) + 1,
        });

        return this.checklistItemRepo.save(newItem);
    }

    /**
     * Update checklist note for an item
     */
    async updateChecklistItemNote(itemId: number, note: string): Promise<SalesChecklistItem> {
        const item = await this.checklistItemRepo.findOne({ where: { id: itemId } });
        if (!item) throw new NotFoundException('Checklist item not found');
        item.note = note;
        return this.checklistItemRepo.save(item);
    }

    /**
     * Add checklist items for a specific stage (internal helper)
     */
    private async addChecklistItemsForStage(checklistId: number, stage: string): Promise<void> {
        const templates = CHECKLIST_TEMPLATES[stage];
        if (!templates || templates.length === 0) return;

        // Check which items already exist
        const existing = await this.checklistItemRepo.find({ where: { checklist_id: checklistId } });
        const existingCodes = existing.map(e => e.task_code);

        const newItems = templates
            .filter(t => !existingCodes.includes(t.code))
            .map(t => this.checklistItemRepo.create({
                checklist_id: checklistId,
                task_code: t.code,
                task_name: t.name,
                stage: stage,
                is_completed: false,
                sort_order: t.sort,
            }));

        if (newItems.length > 0) {
            await this.checklistItemRepo.save(newItems);
        }
    }

    /**
     * Sync checklist when order status changes
     * Call this after any status update to add new stage tasks
     */
    async syncChecklistWithStatus(orderId: number, newStatus: string): Promise<any> {
        const checklist = await this.checklistRepo.findOne({ where: { order_id: orderId } });
        if (!checklist) {
            return this.initChecklist(orderId, newStatus);
        }

        // Add items for new stage
        await this.addChecklistItemsForStage(checklist.id, newStatus);

        return this.getChecklist(orderId);
    }

    /**
     * Delete a custom checklist item
     */
    async deleteChecklistItem(itemId: number): Promise<void> {
        const item = await this.checklistItemRepo.findOne({ where: { id: itemId } });
        if (!item) throw new NotFoundException('Checklist item not found');
        if (!item.task_code.startsWith('CUSTOM_')) {
            throw new Error('Cannot delete system-generated checklist items');
        }
        await this.checklistItemRepo.delete(itemId);
    }

    // ===================== ANALYTICS DASHBOARD =====================

    private readonly FORECAST_WEIGHTS: Record<string, number> = {
        NEW: 0.05,
        CONTACTED: 0.10,
        QUALIFIED: 0.20,
        SAMPLE_APPROVED: 0.50,
        NEGOTIATION: 0.80,
        WON: 1.0,
    };

    async getAnalyticsDashboard(filters: {
        startDate?: string; endDate?: string;
        assignedToId?: number; productType?: string;
    }) {
        const start = filters.startDate ? new Date(filters.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = filters.endDate ? new Date(filters.endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        // Previous period (same duration)
        const duration = end.getTime() - start.getTime();
        const prevStart = new Date(start.getTime() - duration);
        const prevEnd = new Date(start.getTime() - 1);

        // === 1. KPI CARDS ===
        const kpi = await this.calculateKPIs(start, end, prevStart, prevEnd, filters.assignedToId);

        // === 2. FUNNEL DATA (Lead Source) ===
        const funnelData = await this.calculateFunnelData(start, end, filters.assignedToId);

        // === 3. VELOCITY DATA ===
        const velocityData = await this.calculateVelocityData(filters.assignedToId);

        // === 4. SCORECARD DATA ===
        const scorecardData = await this.calculateScorecardData(start, end);

        // === 5. FORECAST DATA ===
        const forecastData = await this.calculateForecastData();

        return { kpi, funnelData, velocityData, scorecardData, forecastData };
    }

    private async calculateKPIs(
        start: Date, end: Date, prevStart: Date, prevEnd: Date, assignedToId?: number
    ) {
        // Current period leads
        const leadsQuery = this.customerRepo.createQueryBuilder('c')
            .where('c.type = :type', { type: 'LEAD' })
            .andWhere('c.created_at BETWEEN :start AND :end', { start, end });
        if (assignedToId) leadsQuery.andWhere('c.assigned_to_id = :uid', { uid: assignedToId });
        const totalLeads = await leadsQuery.getCount();

        // WON leads
        const wonQuery = this.customerRepo.createQueryBuilder('c')
            .where('c.type = :type', { type: 'LEAD' })
            .andWhere('c.lead_status = :s', { s: 'WON' })
            .andWhere('c.created_at BETWEEN :start AND :end', { start, end });
        if (assignedToId) wonQuery.andWhere('c.assigned_to_id = :uid', { uid: assignedToId });
        const wonLeads = await wonQuery.getCount();

        const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

        // Pipeline Value (open leads)
        const pipelineResult = await this.customerRepo.createQueryBuilder('c')
            .select('COALESCE(SUM(c.potential_value), 0)', 'total')
            .where('c.type = :type', { type: 'LEAD' })
            .andWhere('c.lead_status NOT IN (:...closed)', { closed: ['WON', 'LOST'] })
            .getRawOne();
        const pipelineValue = Number(pipelineResult?.total || 0);

        // Actual Revenue (completed orders in period)
        const revenueQuery = this.orderRepo.createQueryBuilder('o')
            .select('COALESCE(SUM(o.total_amount), 0)', 'total')
            .where('o.status IN (:...statuses)', { statuses: ['COMPLETED', 'DELIVERED'] })
            .andWhere('o.order_date BETWEEN :start AND :end', { start, end });
        if (assignedToId) revenueQuery.andWhere('o.assigned_to = :uid', { uid: assignedToId });
        const revenueResult = await revenueQuery.getRawOne();
        const actualRevenue = Number(revenueResult?.total || 0);

        // Actual Revenue (paid)
        const paidQuery = this.orderRepo.createQueryBuilder('o')
            .select('COALESCE(SUM(o.paid_amount), 0)', 'total')
            .where('o.status != :cancelled', { cancelled: 'CANCELLED' })
            .andWhere('o.order_date BETWEEN :start AND :end', { start, end });
        if (assignedToId) paidQuery.andWhere('o.assigned_to = :uid', { uid: assignedToId });
        const paidResult = await paidQuery.getRawOne();
        const paidRevenue = Number(paidResult?.total || 0);

        // Previous period for trends
        const prevLeadsQuery = this.customerRepo.createQueryBuilder('c')
            .where('c.type = :type', { type: 'LEAD' })
            .andWhere('c.created_at BETWEEN :start AND :end', { start: prevStart, end: prevEnd });
        const prevLeads = await prevLeadsQuery.getCount();

        const prevRevenueResult = await this.orderRepo.createQueryBuilder('o')
            .select('COALESCE(SUM(o.total_amount), 0)', 'total')
            .where('o.status IN (:...statuses)', { statuses: ['COMPLETED', 'DELIVERED'] })
            .andWhere('o.order_date BETWEEN :start AND :end', { start: prevStart, end: prevEnd })
            .getRawOne();
        const prevRevenue = Number(prevRevenueResult?.total || 0);

        const prevPaidResult = await this.orderRepo.createQueryBuilder('o')
            .select('COALESCE(SUM(o.paid_amount), 0)', 'total')
            .where('o.status != :cancelled', { cancelled: 'CANCELLED' })
            .andWhere('o.order_date BETWEEN :start AND :end', { start: prevStart, end: prevEnd })
            .getRawOne();
        const prevPaid = Number(prevPaidResult?.total || 0);

        const trendPercent = (current: number, prev: number) =>
            prev > 0 ? Math.round(((current - prev) / prev) * 100) : (current > 0 ? 100 : 0);

        return {
            totalLeads,
            conversionRate,
            pipelineValue,
            actualRevenue,
            paidRevenue,
            trends: {
                leadsTrend: trendPercent(totalLeads, prevLeads),
                revenueTrend: trendPercent(actualRevenue, prevRevenue),
                paidTrend: trendPercent(paidRevenue, prevPaid),
            }
        };
    }

    private async calculateFunnelData(start: Date, end: Date, assignedToId?: number) {
        const sources = ['OUTBOUND', 'REFERRAL', 'FACEBOOK', 'WEBSITE', 'OTHER'];
        const result = [];

        for (const source of sources) {
            const baseQuery = () => {
                const q = this.customerRepo.createQueryBuilder('c')
                    .where('c.type = :type', { type: 'LEAD' })
                    .andWhere('c.lead_source = :source', { source })
                    .andWhere('c.created_at BETWEEN :start AND :end', { start, end });
                if (assignedToId) q.andWhere('c.assigned_to_id = :uid', { uid: assignedToId });
                return q;
            };

            const leads = await baseQuery().getCount();
            const qualified = await baseQuery()
                .andWhere('c.lead_status IN (:...s)', { s: ['QUALIFIED', 'NEGOTIATION', 'WON', 'SAMPLE_APPROVED'] })
                .getCount();
            const won = await baseQuery()
                .andWhere('c.lead_status = :ws', { ws: 'WON' })
                .getCount();

            // Average order value for this source
            const avgResult = await this.orderRepo.createQueryBuilder('o')
                .select('COALESCE(AVG(o.total_amount), 0)', 'avg')
                .innerJoin('o.customer', 'c')
                .where('c.lead_source = :source', { source })
                .andWhere('o.status NOT IN (:...ex)', { ex: ['CANCELLED', 'QUOTATION'] })
                .getRawOne();

            result.push({
                source,
                sourceLabel: this.getSourceLabel(source),
                leads,
                qualified,
                unqualified: leads - qualified,
                won,
                winRate: leads > 0 ? Math.round((won / leads) * 100) : 0,
                avgOrderValue: Math.round(Number(avgResult?.avg || 0)),
            });
        }

        return result.filter(r => r.leads > 0);
    }

    private getSourceLabel(source: string): string {
        const labels: Record<string, string> = {
            OUTBOUND: 'Đi thị trường',
            REFERRAL: 'Khách cũ giới thiệu',
            FACEBOOK: 'Facebook/Ads',
            WEBSITE: 'Website',
            OTHER: 'Khác',
        };
        return labels[source] || source;
    }

    private async calculateVelocityData(assignedToId?: number) {
        const query = this.customerRepo.createQueryBuilder('c')
            .leftJoinAndSelect('c.assigned_to', 'u')
            .where('c.type = :type', { type: 'LEAD' })
            .andWhere('c.lead_status IN (:...statuses)', { statuses: ['QUALIFIED', 'SAMPLE_APPROVED', 'CONTACTED', 'NEGOTIATION'] });
        if (assignedToId) query.andWhere('c.assigned_to_id = :uid', { uid: assignedToId });

        const leads = await query.getMany();
        const now = new Date();

        return leads.map(lead => {
            // Calculate days since last action from history
            const history = lead.history || [];
            const lastAction = history.length > 0 ? history[history.length - 1] : null;
            const lastActionDate = lastAction?.date ? new Date(lastAction.date) : lead.updated_at;
            const daysSinceLastAction = Math.floor((now.getTime() - lastActionDate.getTime()) / (1000 * 60 * 60 * 24));

            // Alert level
            let alertLevel = 'green';
            if (lead.lead_status === 'QUALIFIED' && daysSinceLastAction > 3) alertLevel = 'red';
            else if (lead.lead_status === 'SAMPLE_APPROVED' && daysSinceLastAction > 5) alertLevel = 'orange';
            else if (daysSinceLastAction > 7) alertLevel = 'orange';

            return {
                customerId: lead.id,
                customerName: lead.name,
                phone: lead.phone,
                status: lead.lead_status,
                leadSource: lead.lead_source,
                potentialValue: Number(lead.potential_value),
                daysSinceLastAction,
                lastActionDate: lastActionDate.toISOString(),
                assignedTo: lead.assigned_to?.full_name || lead.assigned_to?.username || 'N/A',
                assignedToId: lead.assigned_to_id,
                alertLevel,
            };
        }).sort((a, b) => b.daysSinceLastAction - a.daysSinceLastAction);
    }

    private async calculateScorecardData(start: Date, end: Date) {
        // Get all sales users (assigned_to in any order or lead)
        const users = await this.userRepo.find();
        const salesUsers = [];

        for (const user of users) {
            // Check if user has any leads or orders assigned
            const leadCount = await this.customerRepo.count({
                where: { assigned_to_id: user.id, type: 'LEAD' as any }
            });
            const orderCount = await this.orderRepo.count({
                where: { assigned_to: { id: user.id } }
            });
            if (leadCount === 0 && orderCount === 0) continue;

            // Target
            const year = start.getFullYear();
            const month = start.getMonth() + 1;
            const target = await this.targetRepo.findOne({
                where: { user_id: user.id, year, month }
            });

            // Actual revenue
            const revResult = await this.orderRepo.createQueryBuilder('o')
                .select('COALESCE(SUM(o.total_amount), 0)', 'total')
                .where('o.assigned_to = :uid', { uid: user.id })
                .andWhere('o.status IN (:...s)', { s: ['COMPLETED', 'DELIVERED'] })
                .andWhere('o.order_date BETWEEN :start AND :end', { start, end })
                .getRawOne();

            // New leads in period
            const newLeads = await this.customerRepo.createQueryBuilder('c')
                .where('c.assigned_to_id = :uid', { uid: user.id })
                .andWhere('c.type = :type', { type: 'LEAD' })
                .andWhere('c.created_at BETWEEN :start AND :end', { start, end })
                .getCount();

            // Average days to close
            const closedOrders = await this.orderRepo.createQueryBuilder('o')
                .where('o.assigned_to = :uid', { uid: user.id })
                .andWhere('o.status = :s', { s: 'COMPLETED' })
                .andWhere('o.order_date BETWEEN :start AND :end', { start, end })
                .getMany();
            let avgDaysToClose = 0;
            if (closedOrders.length > 0) {
                const totalDays = closedOrders.reduce((sum, o) => {
                    const created = new Date(o.created_at).getTime();
                    const updated = new Date(o.updated_at).getTime();
                    return sum + Math.floor((updated - created) / (1000 * 60 * 60 * 24));
                }, 0);
                avgDaysToClose = Math.round(totalDays / closedOrders.length);
            }

            // Activities (count of history entries from customer interactions)
            const leadsWithHistory = await this.customerRepo.createQueryBuilder('c')
                .where('c.assigned_to_id = :uid', { uid: user.id })
                .andWhere('c.type = :type', { type: 'LEAD' })
                .getMany();
            const activities = leadsWithHistory.reduce((sum, lead) => {
                const h = lead.history || [];
                return sum + h.filter((entry: any) => {
                    const entryDate = new Date(entry.date);
                    return entryDate >= start && entryDate <= end;
                }).length;
            }, 0);

            salesUsers.push({
                userId: user.id,
                userName: (user as any).full_name || (user as any).username,
                targetRevenue: Number(target?.target_revenue || 0),
                targetLeads: target?.target_leads || 0,
                targetActivities: target?.target_activities || 0,
                actualRevenue: Number(revResult?.total || 0),
                newLeads,
                avgDaysToClose,
                activities,
            });
        }

        return salesUsers;
    }

    private async calculateForecastData() {
        const now = new Date();
        const months = [];

        // Past 3 months actual
        for (let i = 3; i >= 1; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

            const result = await this.orderRepo.createQueryBuilder('o')
                .select('COALESCE(SUM(o.total_amount), 0)', 'total')
                .where('o.status IN (:...s)', { s: ['COMPLETED', 'DELIVERED'] })
                .andWhere('o.order_date BETWEEN :start AND :end', { start: monthStart, end: monthEnd })
                .getRawOne();

            months.push({
                month: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
                label: `T${monthStart.getMonth() + 1}`,
                actualRevenue: Number(result?.total || 0),
                forecastRevenue: Number(result?.total || 0), // Past = actual
            });
        }

        // Current month (partial actual + forecast)
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentResult = await this.orderRepo.createQueryBuilder('o')
            .select('COALESCE(SUM(o.total_amount), 0)', 'total')
            .where('o.status IN (:...s)', { s: ['COMPLETED', 'DELIVERED'] })
            .andWhere('o.order_date BETWEEN :start AND :end', { start: currentMonthStart, end: now })
            .getRawOne();

        // Forecast from open deals
        const openLeads = await this.customerRepo.find({
            where: { type: 'LEAD' as any },
        });
        const currentForecast = openLeads.reduce((sum, lead) => {
            if (lead.lead_status === 'WON' || lead.lead_status === 'LOST') return sum;
            const weight = this.FORECAST_WEIGHTS[lead.lead_status] || 0.05;
            return sum + Number(lead.potential_value || 0) * weight;
        }, 0);

        months.push({
            month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
            label: `T${now.getMonth() + 1} (hiện tại)`,
            actualRevenue: Number(currentResult?.total || 0),
            forecastRevenue: Number(currentResult?.total || 0) + currentForecast,
        });

        // Next 2 months forecast
        for (let i = 1; i <= 2; i++) {
            const futureMonth = new Date(now.getFullYear(), now.getMonth() + i, 1);
            // Distribute forecast across future months (60% next, 40% after)
            const monthForecast = currentForecast * (i === 1 ? 0.6 : 0.4);

            months.push({
                month: `${futureMonth.getFullYear()}-${String(futureMonth.getMonth() + 1).padStart(2, '0')}`,
                label: `T${futureMonth.getMonth() + 1} (dự báo)`,
                actualRevenue: 0,
                forecastRevenue: Math.round(monthForecast),
            });
        }

        return months;
    }

    // === PUSH REMINDER ===
    async sendPushReminder(data: { userId: number; customerName: string; message: string; senderId?: number; senderName?: string }) {
        await this.notificationsService.create({
            user_id: data.userId,
            title: `⚡ Nhắc nhở: ${data.customerName}`,
            message: data.message || `Hãy follow-up khách hàng ${data.customerName} ngay!`,
            type: 'WARNING',
            link: '/sales',
        });
        return { success: true };
    }

    // === SALES TARGETS CRUD ===
    async getTargets(year: number) {
        return this.targetRepo.find({ where: { year }, relations: ['user'] });
    }

    async upsertTarget(data: { user_id: number; year: number; month: number; target_revenue: number; target_leads?: number; target_activities?: number }) {
        const existing = await this.targetRepo.findOne({
            where: { user_id: data.user_id, year: data.year, month: data.month }
        });
        if (existing) {
            Object.assign(existing, data);
            return this.targetRepo.save(existing);
        }
        return this.targetRepo.save(this.targetRepo.create(data));
    }
}
