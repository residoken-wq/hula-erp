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
    // --- FIX QUAN TRỌNG: Mapping dữ liệu ---
    // Frontend gửi 'refCode', Database cần 'reference_code'
    // Frontend gửi 'note', Database cần 'description'
    const transactionPayload = {
        ...data,
        reference_code: data.refCode || data.reference_code,
        description: data.note || data.description
    };

    const transaction = this.transactionRepo.create(transactionPayload);
    const saved = await this.transactionRepo.save(transaction);

    // Cập nhật trạng thái đơn hàng (SO/PO) nếu có mã tham chiếu
    if (transactionPayload.reference_code) {
        const amount = Number(data.amount);
        
        if (data.type === 'INCOME') {
            try { 
                await this.salesService.updatePayment(transactionPayload.reference_code, amount); 
            } catch(e) {
                console.warn(`Sales update payment error: ${e}`);
            }
        } else if (data.type === 'EXPENSE') {
            try { 
                await this.purchasingService.updatePayment(transactionPayload.reference_code, amount); 
            } catch(e) {
                console.warn(`Purchasing update payment error: ${e}`);
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