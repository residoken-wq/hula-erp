import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transaction } from './transaction.entity';
import { TransactionCategory } from './transaction-category.entity';
import { PurchasingService } from '../purchasing/purchasing.service'; // Import Service

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Transaction) private transRepo: Repository<Transaction>,
    @InjectRepository(TransactionCategory) private catRepo: Repository<TransactionCategory>,
    @Inject(forwardRef(() => PurchasingService)) private purchasingService: PurchasingService, // Inject Service
  ) {}

  async getCategories() { return this.catRepo.find({ order: { type: 'ASC', name: 'ASC' } }); }
  
  async createCategory(data: any) { 
      const cat = this.catRepo.create(data);
      return this.catRepo.save(cat); 
  }

  async updateCategory(id: number, data: any) {
      await this.catRepo.update(id, data);
      return this.catRepo.findOne({ where: { id } });
  }
  
  async deleteCategory(id: number) { return this.catRepo.delete(id); }

  async getAllTransactions(month?: string) {
      let where = {};
      if (month) {
          const [y, m] = month.split('-');
          const start = new Date(Number(y), Number(m) - 1, 1);
          const end = new Date(Number(y), Number(m), 0);
          where = { date: Between(start.toISOString().split('T')[0], end.toISOString().split('T')[0]) };
      }
      return this.transRepo.find({ 
          where, 
          relations: ['category'], 
          order: { date: 'DESC', id: 'DESC' } 
      });
  }

  // Tạo phiếu thu/chi thông thường
  async createTransaction(data: any) {
      let category = null;
      if (data.category_id) category = await this.catRepo.findOne({ where: { id: data.category_id } });

      const trans = this.transRepo.create({ ...data, category });
      return this.transRepo.save(trans);
  }

  // Tạo phiếu Thu tiền từ Đơn Bán Hàng (Sales)
  async createPayment(data: any) {
      const trans = this.transRepo.create({
          date: new Date().toISOString().split('T')[0],
          type: data.type || 'INCOME',
          amount: Number(data.amount),
          reference_code: data.refCode,
          reference_type: 'SALES',
          description: data.note,
      });
      return this.transRepo.save(trans);
  }

  // --- MỚI: Tạo phiếu Chi tiền cho Đơn Mua Hàng (Purchasing) ---
  async createPOPayment(data: any) {
      // data: { amount, poCode, note }
      const trans = this.transRepo.create({
          date: new Date().toISOString().split('T')[0],
          type: 'EXPENSE', // Chi tiền
          amount: Number(data.amount),
          reference_code: data.poCode, 
          reference_type: 'PURCHASE',
          description: data.note || `Thanh toán cho đơn ${data.poCode}`,
      });
      
      const saved = await this.transRepo.save(trans);

      // Cập nhật ngược lại số tiền đã trả cho PO
      if (data.poCode) {
          await this.purchasingService.updatePayment(data.poCode, Number(data.amount));
      }

      return saved;
  }
  // -------------------------------------------------------------

  async deleteTransaction(id: number) { return this.transRepo.delete(id); }

  async getSummary() {
      const all = await this.transRepo.find();
      const income = all.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
      const expense = all.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);
      return { income, expense, balance: income - expense };
  }
}