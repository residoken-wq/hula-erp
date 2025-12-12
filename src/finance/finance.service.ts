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
    // --- FIX TOÀN DIỆN MAPPING DỮ LIỆU ---
    // 1. refCode (Frontend) -> reference_code (DB)
    // 2. note (Frontend) -> description (DB)
    const transactionPayload = {
        ...data,
        reference_code: data.refCode || data.reference_code,
        description: data.note || data.description
    };

    // Tạo transaction với dữ liệu đã map chuẩn
    const transaction = this.transactionRepo.create(transactionPayload);
    const saved = await this.transactionRepo.save(transaction);

    // Logic cập nhật trạng thái đơn hàng (SO/PO) nếu có mã tham chiếu
    if (transactionPayload.reference_code) {
        const amount = Number(data.amount);
        
        if (data.type === 'INCOME') {
            try { 
                // Cập nhật thanh toán bên Bán Hàng (SO)
                await this.salesService.updatePayment(transactionPayload.reference_code, amount); 
            } catch(e) {
                console.warn(`Sales update payment error: ${e}`);
            }
        } else if (data.type === 'EXPENSE') {
            try { 
                // Cập nhật thanh toán bên Mua Hàng (PO)
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