import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { FinanceService } from './finance.service';

@Controller('finance')
export class FinanceController {
  constructor(private readonly s: FinanceService) {}

  @Get('summary') getSummary() { return this.s.getSummary(); }

  @Get('categories') getCategories() { return this.s.getCategories(); }
  @Post('categories') createCategory(@Body() b: any) { return this.s.createCategory(b); }
  @Delete('categories/:id') deleteCategory(@Param('id') id: number) { return this.s.deleteCategory(id); }

  @Get('transactions') getTransactions(@Query('month') month: string) { return this.s.getAllTransactions(month); }
  @Post('transactions') createTransaction(@Body() b: any) { return this.s.createTransaction(b); }
  @Delete('transactions/:id') deleteTransaction(@Param('id') id: number) { return this.s.deleteTransaction(id); }
}