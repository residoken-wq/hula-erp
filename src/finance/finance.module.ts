import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { Transaction } from './transaction.entity';
import { SalesModule } from '../sales/sales.module'; // Import
import { PurchasingModule } from '../purchasing/purchasing.module'; // Import

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    forwardRef(() => SalesModule),       // Dùng forwardRef để tránh lỗi vòng lặp
    forwardRef(() => PurchasingModule),  // Dùng forwardRef để tránh lỗi vòng lặp
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}