import { Controller, Post, Get, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SalesService } from './sales.service';

@Controller('sales')
export class SalesController {
  constructor(private readonly s: SalesService) {}

  // ============================================================
  // KHU VỰC API PRICE LIST (BẮT BUỘC ĐẶT TRƯỚC CÁC API KHÁC)
  // ============================================================

  // 1. Tạo Bảng giá mới
  @Post('price-lists') 
  createPriceList(@Body() body: any) { 
      return this.s.createPriceList(body); 
  }

  // 2. Lấy danh sách Bảng giá
  @Get('price-lists') 
  getAllPriceLists() { 
      return this.s.getAllPriceLists(); 
  }

  // 3. Thêm Quy tắc giá (Rule) vào Bảng giá
  @Post('price-lists/:id/rules') 
  createRule(@Param('id') id: number, @Body() body: any) { 
      return this.s.createPriceListRule(id, body); 
  }

  // 4. Lấy danh sách Quy tắc của một Bảng giá
  @Get('price-lists/:id/rules') 
  getRules(@Param('id') id: number) { 
      return this.s.getPriceListRules(id); 
  }

  // 5. Kiểm tra giá (Validate)
  @Get('validate-price')
  async validatePrice(
      @Query('sku') sku: string, 
      @Query('unitPrice') unitPrice: number,
      @Query('userId') userId: number 
  ) {
      return this.s.validatePriceAgainstPriceList(sku, Number(unitPrice), Number(userId));
  }

  // ============================================================
  // KHU VỰC API SALES ORDER (ĐẶT SAU)
  // ============================================================

  @Post('create') create(@Body() b: any) { return this.s.createOrder(b); }
  
  @Get() findAll() { return this.s.findAll(); }

  // API này dễ "ăn" nhầm các đường dẫn khác nếu đặt ở trên cùng
  @Get(':code') getOne(@Param('code') c: string) { return this.s.getOrder(c); }
  
  @Get('samples/all') getAllSamples() { return this.s.sampleRepo.find({ order: { created_at: 'DESC' } }); }
  @Post(':id/convert') convert(@Param('id') id: number, @Body('accepted') accepted: boolean) { return this.s.convertQuoteToSo(id, accepted); }
  @Put('quote/:id') updateQuote(@Param('id') id: number, @Body() b: any) { return this.s.updateQuote(id, b); }
  @Delete('quote/:id') deleteQuote(@Param('id') id: number) { return this.s.deleteQuote(id); }
  
  @Get(':id/deliveries') getDeliveries(@Param('id') id: number) { return this.s.getDeliveryHistory(id); }
  @Post(':id/delivery') createDelivery(@Param('id') id: number, @Body() b: any) { return this.s.createDelivery(id, b); }
  
  @Get(':code/payments') getPayments(@Param('code') code: string) { return this.s.getPaymentHistory(code); }
  
  @Get('portal/:uuid') getPortal(@Param('uuid') uuid: string) { return this.s.getQuoteByUuid(uuid); }
  @Post('portal/:uuid/action') customerAction(@Param('uuid') uuid: string, @Body() body: any) { return this.s.customerAction(uuid, body.action); }
  
  @Post(':id/approve-samples') approveSamples(@Param('id') id: number) { return this.s.approveAllSamples(id); }
  @Post(':id/complete') complete(@Param('id') id: number) { return this.s.completeOrder(id); }
}