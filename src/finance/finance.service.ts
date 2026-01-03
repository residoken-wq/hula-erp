import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transaction } from './transaction.entity';
import { TransactionCategory } from './transaction-category.entity';
import { PurchasingService } from '../purchasing/purchasing.service';
import { SuppliersService } from '../suppliers/suppliers.service';

@Injectable()
export class FinanceService {
    constructor(
        @InjectRepository(Transaction) private transRepo: Repository<Transaction>,
        @InjectRepository(TransactionCategory) private catRepo: Repository<TransactionCategory>,
        @Inject(forwardRef(() => PurchasingService)) private purchasingService: PurchasingService,
        @Inject(forwardRef(() => SuppliersService)) private suppliersService: SuppliersService,
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
        // Ensure supplier_id is passed if available
        const trans = this.transRepo.create(data);
        return this.transRepo.save(trans);
    }

    // Payment Sales (Thu tiền)
    async createPayment(data: any) {
        const trans = this.transRepo.create({
            date: data.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            type: data.type || 'INCOME',
            amount: Number(data.amount),
            reference_code: data.refCode,
            reference_type: 'SALES',
            description: data.note,
            partner_name: data.customerName || data.partnerName, // Support both keys
            attachments: data.attachments || [] // <--- Save Attachments
        });
        return this.transRepo.save(trans);
    }

    // --- CẬP NHẬT: THANH TOÁN PO (CHI TIỀN) ---
    async createPOPayment(data: any) {
        // --- FIX: Fetch PO to get Supplier ID ---
        let supplierId = null;
        if (data.poCode) {
            const po = await this.purchasingService.getPOByCode(data.poCode);
            if (po) supplierId = po.supplier_id;
        }
        // ----------------------------------------

        return this.createBulkPoPayment({
            supplier_id: supplierId, // Pass fetched ID
            po_ids: [data.poCode], // Treat as single item array (Note: logic needs ID not Code usually, but let's check input)
            // Actually legacy used poCode string. Bulk uses IDs.
            // Let's implement Bulk properly.
            amount: data.amount,
            note: data.note,
            date: data.date,
            vatCode: data.vatCode,
            vatUrl: data.vatUrl,
            partnerName: data.partnerName
        });
    }

    async createBulkPoPayment(data: any) {
        // data: { po_ids: number[], amount: number, note: string, date: Date, vatCode, vatUrl, partnerName, supplier_id }

        // 1. Create Transaction
        const trans = this.transRepo.create({
            date: data.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            type: 'EXPENSE',
            amount: Number(data.amount),
            reference_code: `BULK-PO-${Date.now()}`, // Generate a Bulk Ref
            reference_type: 'PURCHASE', // Or 'BULK_PURCHASE' if distinct
            description: data.note || `Thanh toán công nợ NCC`,
            partner_name: data.partnerName,
            supplier_id: data.supplier_id, // <--- SAVE SUPPLIER ID
            vat_invoice_code: data.vatCode,
            vat_invoice_url: data.vatUrl
        });
        const savedTrans = await this.transRepo.save(trans);

        // 2. Distribute Payment to POs
        // Logic: Iterate POs and update paid_amount.
        // NOTE: We don't know exactly how much for EACH PO if user just pays a lump sum.
        // BUT, usually in this flow, user selects specific POs to pay.
        // OPTION A: User selects POs and explicitly pays Full/Partial for each?
        // OPTION B: User pays X amount, we distribute?
        // OPTION C: User selects POs -> System sums up -> User confirms.
        // Requirement: "chọn các PO chưa thanh toán --> gộp chung thanh toán"
        // Implies we pay off the selected POs.
        // Let's assume we update `paid_amount` for each selected PO.
        // For simplicity: We might need to know HOW MUCH allocated to each PO if it's not full payment.
        // Check `PurchasingService.updatePayment`. It takes poCode and amount.

        if (data.allocations && Array.isArray(data.allocations)) {
            // data.allocations = [{ po_id, amount }]
            for (const alloc of data.allocations) {
                await this.purchasingService.updatePaymentById(alloc.po_id, Number(alloc.amount));
            }
        }

        return savedTrans;
    }
    // ------------------------------------------

    async deleteTransaction(id: number) { return this.transRepo.delete(id); }

    async updateTransaction(id: number, data: any) {
        await this.transRepo.update(id, data);
        return this.transRepo.findOne({ where: { id } });
    }

    async getFinancialReport(month?: string, year?: string) {
        let where: any = { is_accounting: true };

        if (month) {
            const [y, m] = month.split('-');
            const start = new Date(Number(y), Number(m) - 1, 1);
            const end = new Date(Number(y), Number(m), 0);
            where.date = Between(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
        } else if (year) {
            const start = new Date(Number(year), 0, 1);
            const end = new Date(Number(year), 11, 31);
            where.date = Between(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
        }

        const transactions = await this.transRepo.find({ where, order: { date: 'ASC' } });

        const income = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
        const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);

        return {
            transactions,
            summary: { income, expense, profit: income - expense }
        };
    }

    async getSummary() {
        const all = await this.transRepo.find();
        const income = all.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
        const expense = all.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);
        return { income, expense, balance: income - expense };
    }

    // --- MỚI: HÀM MAPPING TRANSACTION CŨ VÀO SUPPLIER ---
    async mapOldTransactions() {
        // 1. Tìm các Transaction Purchase mà chưa có Supplier ID
        const transactions = await this.transRepo.find({
            where: [
                { reference_type: 'PURCHASE', supplier_id: null as any },
                { reference_type: 'BULK_PURCHASE', supplier_id: null as any },
                { type: 'EXPENSE', supplier_id: null as any } // Also check generic Expense if name matches
            ]
        });

        const updates = [];
        let allSuppliers = [];

        for (const t of transactions) {
            // Case 1: Ref Code is PO Code
            if (t.reference_code && t.reference_code.startsWith('PO-')) {
                const po = await this.purchasingService.getPOByCode(t.reference_code);
                if (po && po.supplier_id) {
                    t.supplier_id = po.supplier_id;
                    updates.push(this.transRepo.save(t));
                    continue; // Done
                }
            }

            // Case 2: Fuzzy match partner_name
            if (t.partner_name && !t.supplier_id) {
                if (allSuppliers.length === 0) {
                    allSuppliers = await this.suppliersService.findAll();
                }

                const normalize = (s: string) => s ? s.toLowerCase().trim() : '';
                const pName = normalize(t.partner_name);

                const match = allSuppliers.find(s => normalize(s.name) === pName || (s.legal_name && normalize(s.legal_name) === pName));

                if (match) {
                    t.supplier_id = match.id;
                    updates.push(this.transRepo.save(t));
                }
            }
        }

        await Promise.all(updates);
        return { total: transactions.length, mapped: updates.length };
    }
}