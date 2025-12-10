import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionType } from './transaction.entity';
import { SalesService } from '../sales/sales.service';
import { PurchasingService } from '../purchasing/purchasing.service';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Transaction) private transRepo: Repository<Transaction>,
    private salesService: SalesService,
    private purchasingService: PurchasingService,
  ) {}

  // API: Thanh toan (Thu tien hoac Chi tien)
  async registerPayment(data: any) {
    // data: { type: 'INCOME' | 'EXPENSE', amount: 100000, refCode: 'DH_01', note: '...' }
    
    const trans = new Transaction();
    trans.type = data.type;
    trans.amount = data.amount;
    trans.reference_code = data.refCode;
    trans.description = data.note;
    
    // Logic cap nhat cong no
    if (data.type === TransactionType.INCOME) {
        // Thu tien -> Cap nhat Sales Order
        await this.salesService.updatePayment(data.refCode, data.amount);
    } else {
        // Chi tien -> Cap nhat Purchase Order
        await this.purchasingService.updatePayment(data.refCode, data.amount);
    }

    return this.transRepo.save(trans);
  }
}
