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
    // --- FIX: Mapping dữ liệu thủ công để đảm bảo không bao giờ bị NULL ---
    const payload = {
        type: data.type,
        amount: data.amount,
        payment_method: data.payment_method || 'CASH',
        // Mapping quan trọng:
        reference_code: data.refCode || data.reference_code || null, 
        description: data.note || data.description || ''
    };

    if (!payload.reference_code) {
        console.error('MISSING REFERENCE CODE:', data);
        // Tùy chọn: throw new BadRequestException('Thiếu mã tham chiếu');
    }

    const transaction = this.transactionRepo.create(payload);
    const saved = await this.transactionRepo.save(transaction);

    // Logic cập nhật trạng thái đơn
    if (payload.reference_code) {
        const amt = Number(payload.amount);
        if (payload.type === 'INCOME') {
            try { await this.salesService.updatePayment(payload.reference_code, amt); } catch(e) { console.warn(e); }
        } else if (payload.type === 'EXPENSE') {
            try { await this.purchasingService.updatePayment(payload.reference_code, amt); } catch(e) { console.warn(e); }
        }
    }
    return saved;
  }

  async findAll() { return this.transactionRepo.find({ order: { created_at: 'DESC' } }); }

  async getSummary() {
      const all = await this.findAll();
      const income = all.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + Number(t.amount), 0);
      const expense = all.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + Number(t.amount), 0);
      return { income, expense, balance: income - expense };
  }
}