import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './customer.entity';
import { CustomerContact } from './customer-contact.entity';
import { CustomerComment } from './customer-comment.entity';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

import { Transaction } from '../finance/transaction.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, CustomerContact, CustomerComment, Transaction]),
    AuthModule
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule { }