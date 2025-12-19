import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { TransactionCategory } from './transaction-category.entity';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { SalesModule } from '../sales/sales.module';
import { PurchasingModule } from '../purchasing/purchasing.module'; // <--- Import Purchasing

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, TransactionCategory]),
    forwardRef(() => SalesModule),
    forwardRef(() => PurchasingModule), // <--- Dùng forwardRef
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}