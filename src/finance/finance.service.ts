import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transaction } from './transaction.entity';
import { TransactionCategory } from './transaction-category.entity';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Transaction) private transRepo: Repository<Transaction>,
    @InjectRepository(TransactionCategory) private catRepo: Repository<TransactionCategory>,
  ) {}

  // --- CATEGORY ---
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

  // --- TRANSACTION ---
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

  async createTransaction(data: any) {
      let category = null;
      if (data.category_id) category = await this.catRepo.findOne({ where: { id: data.category_id } });

      const trans = this.transRepo.create({
          ...data,
          category: category
      });
      return this.transRepo.save(trans);
  }

  // --- FIX: HÀM TẠO THANH TOÁN TỪ SALES ---
  async createPayment(data: any) {
      // data: { type: 'INCOME', amount, refCode, note }
      
      // Tự động tìm category "Thu bán hàng" nếu có (Optional)
      // const cat = await this.catRepo.findOne({ where: { name: 'Thu bán hàng' } });

      const trans = this.transRepo.create({
          date: new Date().toISOString().split('T')[0], // Ngày hiện tại
          type: data.type || 'INCOME',
          amount: Number(data.amount),
          reference_code: data.refCode, // Mã đơn hàng (VD: SO-251219-53)
          reference_type: 'SALES',
          description: data.note,
          // category: cat // Gán nếu tìm thấy
      });
      
      return this.transRepo.save(trans);
  }
  // ----------------------------------------

  async deleteTransaction(id: number) { return this.transRepo.delete(id); }

  async getSummary() {
      const all = await this.transRepo.find();
      const income = all.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
      const expense = all.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);
      return { income, expense, balance: income - expense };
  }
}