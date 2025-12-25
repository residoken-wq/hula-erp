import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer, CustomerType } from './customer.entity';
import { CustomerContact } from './customer-contact.entity';

import { Transaction } from '../finance/transaction.entity';

@Injectable()
export class CustomersService {
    constructor(
        @InjectRepository(Customer)
        private customerRepo: Repository<Customer>,
        @InjectRepository(CustomerContact)
        private contactRepo: Repository<CustomerContact>,
        @InjectRepository(Transaction) // <--- INJECT
        private transRepo: Repository<Transaction>,
    ) { }

    async create(data: any) {
        const existing = await this.customerRepo.findOne({ where: { code: data.code } });
        if (existing) throw new BadRequestException('Mã khách hàng đã tồn tại: ' + data.code);

        let parent = null;
        if (data.parent_id) {
            parent = await this.customerRepo.findOne({ where: { id: data.parent_id } });
        }

        const customer = this.customerRepo.create({
            ...data,
            type: data.type || CustomerType.LEAD,
            credit_limit: Number(data.credit_limit) || 0,
            current_debt: 0,
            parent: parent,
            contacts: data.contacts?.map((c: any) => this.contactRepo.create(c) as unknown as CustomerContact) || []
        });
        return this.customerRepo.save(customer);
    }

    async findAll() {
        const customers = await this.customerRepo.find({
            order: { id: 'DESC' },
            relations: ['parent', 'contacts', 'assigned_to', 'orders'] // Load orders
        });

        // Calculate Revenue and Debt
        // Note: For better performance with large data, use aggregation query instead of map
        return Promise.all(customers.map(async (c) => {
            let revenue = 0;
            let paid = 0;

            // Ensure orders is loaded
            if (c.orders && c.orders.length > 0) {
                for (const order of c.orders) {
                    // Only count non-cancelled, non-quotation (or maybe count quotation potential? No, usually revenue = sold)
                    // Let's assume Valid orders are NOT Cancelled and NOT Quotation
                    if (order.status !== 'CANCELLED' && order.status !== 'QUOTATION') {
                        revenue += Number(order.total_amount || 0);

                        // Fetch payments for this order
                        // We can optimize this by batch loading, but for now loop is simpler for logic
                        const payments = await this.transRepo.find({ where: { reference_code: order.order_code, reference_type: 'SALES' } });
                        const paidAmt = payments.reduce((acc, p) => acc + Number(p.amount), 0);
                        paid += paidAmt;
                    }
                }
            }

            // Update runtime values (not saving to DB to avoid overhead, or should we?)
            // User requested "Updated Value".
            // We return enriched object.
            return {
                ...c,
                total_revenue: revenue,
                current_debt: revenue - paid
            };
        }));
    }

    async findOne(id: number) {
        return this.customerRepo.findOne({
            where: { id },
            relations: ['parent', 'children', 'contacts']
        });
    }

    // --- API MỚI: LẤY LỊCH SỬ MUA HÀNG ---
    async getOrders(id: number) {
        const customer = await this.customerRepo.findOne({
            where: { id },
            relations: ['orders'] // Load quan hệ SalesOrder
        });
        if (!customer) throw new NotFoundException('Khách hàng không tồn tại');

        // Calculate Paid Amount for each order
        const ordersWithPayment = await Promise.all(customer.orders.map(async (order: any) => {
            const payments = await this.transRepo.find({ where: { reference_code: order.order_code, reference_type: 'SALES' } });
            const paid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
            return { ...order, paid_amount: paid };
        }));

        // Sắp xếp đơn mới nhất lên đầu
        return ordersWithPayment.sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
    // --------------------------------------

    async update(id: number, data: any) {
        const customer = await this.findOne(id);
        if (!customer) throw new NotFoundException();

        const { contacts, parent_id, ...info } = data;

        if (parent_id) {
            if (parent_id === id) throw new BadRequestException('Khong the chon chinh minh lam cha');
            customer.parent = await this.customerRepo.findOne({ where: { id: parent_id } });
        } else {
            customer.parent = null;
        }

        if (contacts && Array.isArray(contacts)) {
            await this.contactRepo.delete({ customer: { id } });
            customer.contacts = contacts.map((c: any) => this.contactRepo.create(c) as unknown as CustomerContact);
        }

        Object.assign(customer, info);
        return this.customerRepo.save(customer);
    }

    async remove(id: number) {
        const customer = await this.findOne(id);
        return this.customerRepo.remove(customer);
    }

    async addHistory(id: number, note: string) {
        const customer = await this.findOne(id);
        const newLog = { date: new Date(), note: note, user: 'Admin' };
        if (!customer.history) customer.history = [];
        customer.history.unshift(newLog);
        return this.customerRepo.save(customer);
    }

    async convertToCustomer(id: number) {
        return this.customerRepo.update(id, { type: CustomerType.CUSTOMER });
    }
}