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

  // --- API MỚI: LẤY DANH SÁCH MẪU ---
  @Get('samples/all')
  getAllSamples() {
      // Gọi service lấy toàn bộ mẫu (Cần bổ sung hàm này trong service nếu chưa có, 
      // hoặc dùng repo trực tiếp nếu public. Ở đây ta giả định service đã có repo)
      return this.s.sampleRepo.find({ order: { created_at: 'DESC' } });
  }
}