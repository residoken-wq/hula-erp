import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { FinanceService } from './finance.service';

@Controller('finance')
export class FinanceController {
  constructor(private readonly s: FinanceService) { }

  @Get('summary') getSummary() { return this.s.getSummary(); }
  @Get('categories') getCategories() { return this.s.getCategories(); }
  @Post('categories') createCategory(@Body() b: any) { return this.s.createCategory(b); }
  @Put('categories/:id') updateCategory(@Param('id') id: number, @Body() b: any) { return this.s.updateCategory(id, b); }
  @Delete('categories/:id') deleteCategory(@Param('id') id: number) { return this.s.deleteCategory(id); }

  @Get('transactions') getTransactions(@Query('month') month: string) { return this.s.getAllTransactions(month); }
  @Post('transactions') createTransaction(@Body() b: any) { return this.s.createTransaction(b); }
  @Put('transactions/:id') updateTransaction(@Param('id') id: number, @Body() b: any) { return this.s.updateTransaction(id, b); }
  @Delete('transactions/:id') deleteTransaction(@Param('id') id: number) { return this.s.deleteTransaction(id); }

  // --- MỚI: BÁO CÁO TÀI CHÍNH ---
  @Get('report')
  getReport(@Query('month') month: string, @Query('year') year: string) {
    return this.s.getFinancialReport(month, year);
  }
  // -----------------------------

  // --- MỚI: API LỊCH SỬ THANH TOÁN CỦA 1 ĐƠN HÀNG ---
  @Get('history/:refCode')
  getHistory(@Param('refCode') refCode: string) {
    return this.s.getTransactionsByRef(refCode);
  }
  // --------------------------------------------------

  @Post('payment') createPayment(@Body() b: any) { return this.s.createPayment(b); }

  @Post('payment/po')
  createPOPayment(@Body() b: any) {
    // b includes: amount, poCode, note, date, vatCode, vatUrl
    return this.s.createPOPayment(b);
  }

  @Post('payment/bulk-po')
  createBulkPOPayment(@Body() b: any) {
    return this.s.createBulkPoPayment(b);
  }
}