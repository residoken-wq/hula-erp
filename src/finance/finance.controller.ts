import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { FinanceService } from './finance.service';

@Controller('finance')
export class FinanceController {
  constructor(private readonly s: FinanceService) {}

  @Get('summary') getSummary() { return this.s.getSummary(); }

  // --- CATEGORY API ---
  @Get('categories') getCategories() { return this.s.getCategories(); }
  @Post('categories') createCategory(@Body() b: any) { return this.s.createCategory(b); }
  
  @Put('categories/:id') updateCategory(@Param('id') id: number, @Body() b: any) { return this.s.updateCategory(id, b); }
  @Delete('categories/:id') deleteCategory(@Param('id') id: number) { return this.s.deleteCategory(id); }

  // --- TRANSACTION API ---
  @Get('transactions') getTransactions(@Query('month') month: string) { return this.s.getAllTransactions(month); }
  @Post('transactions') createTransaction(@Body() b: any) { return this.s.createTransaction(b); }
  @Delete('transactions/:id') deleteTransaction(@Param('id') id: number) { return this.s.deleteTransaction(id); }

  // --- FIX: THÊM ENDPOINT PAYMENT CHO MODULE SALES ---
  @Post('payment') 
  createPayment(@Body() b: any) { 
      // b: { type, amount, refCode, note }
      return this.s.createPayment(b); 
  }
  // --------------------------------------------------
}