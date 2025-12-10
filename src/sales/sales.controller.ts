import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { SalesService } from './sales.service';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post('create')
  async createOrder(@Body() body: any) {
    return this.salesService.createOrder(body);
  }

  @Get(':code')
  async getOrder(@Param('code') code: string) {
    return this.salesService.getOrder(code);
  }

  @Get()
  findAll() {
    // Lấy danh sách, sort mới nhất trước, load quan hệ khách hàng
    return this.salesService.orderRepo.find({ 
        order: { order_date: 'DESC' },
        relations: ['customer'] // Load thông tin khách hàng để hiển thị tên
    });
  }
}
