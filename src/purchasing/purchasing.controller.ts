import { Controller, Post, Body, Param } from '@nestjs/common';
import { PurchasingService } from './purchasing.service';

@Controller('purchasing')
export class PurchasingController {
  constructor(private readonly purchasingService: PurchasingService) {}

  @Post('create')
  async create(@Body() body: any) {
    return this.purchasingService.createPO(body);
  }

  @Post('receive/:code')
  async receive(@Param('code') code: string) {
    return this.purchasingService.receiveGoods(code);
  }
}
