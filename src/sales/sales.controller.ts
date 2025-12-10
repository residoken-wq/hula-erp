import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { SalesService } from './sales.service';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post('create')
  async createOrder(@Body() body: any) {
    return this.salesService.createOrder(body);
  }

  @Get()
  async findAll() {
    return this.salesService.findAll();
  }

  @Get(':code')
  async getOrder(@Param('code') code: string) {
    return this.salesService.getOrder(code);
  }
}