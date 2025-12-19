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
      // Nếu có category_id, tìm và gán
      let category = null;
      if (data.category_id) category = await this.catRepo.findOne({ where: { id: data.category_id } });

      const trans = this.transRepo.create({
          ...data,
          category: category
      });
      return this.transRepo.save(trans);
  }

  async deleteTransaction(id: number) { return this.transRepo.delete(id); }

  async getSummary() {
      const all = await this.transRepo.find();
      const income = all.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
      const expense = all.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);
      return { income, expense, balance: income - expense };
  }
}