import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './customer.entity';
import { CustomerContact } from './customer-contact.entity'; // <-- MOI
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

import { Transaction } from '../finance/transaction.entity'; // <--- NEW

@Module({
  imports: [TypeOrmModule.forFeature([Customer, CustomerContact, Transaction])], // <--- ADD Transaction
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule { }