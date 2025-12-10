import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { SalesModule } from '../sales/sales.module';     // De cap nhat trang thai don ban
import { PurchasingModule } from '../purchasing/purchasing.module'; // De cap nhat trang thai don mua

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    SalesModule,
    PurchasingModule
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
})
export class FinanceModule {}
