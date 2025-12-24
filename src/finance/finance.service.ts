import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transaction } from './transaction.entity';
import { TransactionCategory } from './transaction-category.entity';
import { PurchasingService } from '../purchasing/purchasing.service';

@Injectable()
export class FinanceService {
    constructor(
        @InjectRepository(Transaction) private transRepo: Repository<Transaction>,
        @InjectRepository(TransactionCategory) private catRepo: Repository<TransactionCategory>,
        @Inject(forwardRef(() => PurchasingService)) private purchasingService: PurchasingService,
    ) { }

    // ... (Giữ nguyên các hàm Category) ...
    async getCategories() { return this.catRepo.find({ order: { type: 'ASC', name: 'ASC' } }); }
    async createCategory(data: any) { return this.catRepo.save(this.catRepo.create(data)); }
    async updateCategory(id: number, data: any) { await this.catRepo.update(id, data); return this.catRepo.findOne({ where: { id } }); }
    async deleteCategory(id: number) { return this.catRepo.delete(id); }

    async getAllTransactions(month?: string) {
        let where = {};
        if (month) {
            const [y, m] = month.split('-');
            const start = new Date(Number(y), Number(m) - 1, 1);
            const end = new Date(Number(y), Number(m), 0);
            where = { date: Between(start.toISOString().split('T')[0], end.toISOString().split('T')[0]) };
        }
        return this.transRepo.find({ where, relations: ['category'], order: { date: 'DESC', id: 'DESC' } });
    }

    // --- MỚI: LẤY LỊCH SỬ GIAO DỊCH THEO MÃ THAM CHIẾU (PO/SO) ---
    async getTransactionsByRef(refCode: string) {
        return this.transRepo.find({
            where: { reference_code: refCode },
            order: { date: 'DESC', created_at: 'DESC' }
        });
    }
    // -------------------------------------------------------------

    async createTransaction(data: any) {
        const trans = this.transRepo.create(data);
        return this.transRepo.save(trans);
    }

    // Payment Sales (Thu tiền)
    async createPayment(data: any) {
        const trans = this.transRepo.create({
            date: new Date().toISOString().split('T')[0],
            type: data.type || 'INCOME',
            amount: Number(data.amount),
            reference_code: data.refCode,
            reference_type: 'SALES',
            description: data.note,
            partner_name: data.customerName // Mapped from FE usually
        });
        return this.transRepo.save(trans);
    }

    // --- CẬP NHẬT: THANH TOÁN PO (CHI TIỀN) ---
    async createPOPayment(data: any) {
        // data: { amount, poCode, note, date, vatCode, vatUrl, partnerName }
        const trans = this.transRepo.create({
            date: data.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            type: 'EXPENSE',
            amount: Number(data.amount),
            reference_code: data.poCode,
            reference_type: 'PURCHASE',
            description: data.note || `Thanh toán PO ${data.poCode}`,
            partner_name: data.partnerName, // <-- Save Partner Name

            // Lưu thông tin VAT
            vat_invoice_code: data.vatCode,
            vat_invoice_url: data.vatUrl
        });

        const saved = await this.transRepo.save(trans);

        // Cộng dồn số tiền đã trả vào PO
        if (data.poCode) {
            await this.purchasingService.updatePayment(data.poCode, Number(data.amount));
        }
        return saved;
    }
    // ------------------------------------------

    async deleteTransaction(id: number) { return this.transRepo.delete(id); }

    async getSummary() {
        const all = await this.transRepo.find();
        const income = all.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
        const expense = all.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);
        return { income, expense, balance: income - expense };
    }
}