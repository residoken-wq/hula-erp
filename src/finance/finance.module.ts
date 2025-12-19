import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { TransactionCategory } from './transaction-category.entity'; // <--- MỚI
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { SalesModule } from '../sales/sales.module'; // Để lấy thông tin đơn hàng nếu cần

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, TransactionCategory]), // <--- ĐĂNG KÝ
    forwardRef(() => SalesModule),
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}