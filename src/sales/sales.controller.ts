import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { SalesService } from './sales.service';

@Controller('sales')
export class SalesController {
  constructor(private readonly s: SalesService) {}

  @Post('create') create(@Body() b: any) { return this.s.createOrder(b); }
  @Get() findAll() { return this.s.findAll(); }
  @Get(':code') getOne(@Param('code') c: string) { return this.s.getOrder(c); }

  @Post(':id/convert')
  convert(@Param('id') id: number, @Body('accepted') accepted: boolean) {
      return this.s.convertQuoteToSo(id, accepted);
  }
}