import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './transaction.entity';
import { SalesService } from '../sales/sales.service';
import { PurchasingService } from '../purchasing/purchasing.service';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,
    private salesService: SalesService,
    private purchasingService: PurchasingService,
  ) {}

  async create(data: any) {
    const transaction = this.transactionRepo.create(data);
    const saved = await this.transactionRepo.save(transaction);

    // Tu dong cap nhat status don hang
    if (data.refCode) {
        if (data.type === 'INCOME') {
            try { await this.salesService.updatePayment(data.refCode, data.amount); } catch(e) {}
        } else if (data.type === 'EXPENSE') {
            try { await this.purchasingService.updatePayment(data.refCode, data.amount); } catch(e) {}
        }
    }
    return saved;
  }

  async findAll() {
    return this.transactionRepo.find({ order: { created_at: 'DESC' } });
  }

  async getSummary() {
      const all = await this.findAll();
      const income = all.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + Number(t.amount), 0);
      const expense = all.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + Number(t.amount), 0);
      return { income, expense, balance: income - expense };
  }
}