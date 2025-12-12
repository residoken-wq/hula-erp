import { Injectable, Inject, forwardRef } from '@nestjs/common';
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
    
    @Inject(forwardRef(() => SalesService))
    private salesService: SalesService,

    @Inject(forwardRef(() => PurchasingService))
    private purchasingService: PurchasingService,
  ) {}

  async create(data: any) {
    const transaction = this.transactionRepo.create(data);
    const saved = await this.transactionRepo.save(transaction);

    if (data.refCode) {
        if (data.type === 'INCOME') {
            try { 
                await this.salesService.updatePayment(data.refCode, data.amount); 
            } catch(e) {
                console.warn(`Sales update error: ${e}`);
            }
        } else if (data.type === 'EXPENSE') {
            try { 
                await this.purchasingService.updatePayment(data.refCode, data.amount); 
            } catch(e) {
                console.warn(`Purchasing update error: ${e}`);
            }
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