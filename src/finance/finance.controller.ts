import { Controller, Post, Body } from '@nestjs/common';
import { FinanceService } from './finance.service';

@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('payment')
  async payment(@Body() body: any) {
    return this.financeService.registerPayment(body);
  }
}
