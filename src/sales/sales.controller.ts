import { Controller, Post, Get, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SalesService } from './sales.service';

@Controller('sales')
export class SalesController {
  constructor(private readonly s: SalesService) {}

  @Post('create') create(@Body() b: any) { return this.s.createOrder(b); }
  @Get() findAll() { return this.s.findAll(); }
  @Get(':code') getOne(@Param('code') c: string) { return this.s.getOrder(c); }
  
  // --- ENDPOINT VALIDATE GIÁ ---
  @Get('validate-price')
  async validatePrice(
      @Query('sku') sku: string, 
      @Query('unitPrice') unitPrice: number,
      @Query('userId') userId: number // Có thể lấy từ @Request() req nếu có Auth
  ) {
      // Vì userId hiện tại hardcode là 1 ở Service, nên ở đây truyền vào để mở rộng sau này
      return this.s.validatePriceAgainstPriceList(sku, Number(unitPrice), Number(userId));
  }
  // -----------------------------

  @Post(':id/convert') convert(@Param('id') id: number, @Body('accepted') accepted: boolean) { return this.s.convertQuoteToSo(id, accepted); }
  @Get('samples/all') getAllSamples() { return this.s.sampleRepo.find({ order: { created_at: 'DESC' } }); }
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