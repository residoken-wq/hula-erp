import { Controller, Get, Post, Body } from '@nestjs/common';
import { FinanceService } from './finance.service';

@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('payment')
  create(@Body() body: any) {
    return this.financeService.create(body);
  }

  @Get()
  findAll() {
    return this.financeService.findAll();
  }

  @Get('summary')
  getSummary() {
    return this.financeService.getSummary();
  }
}