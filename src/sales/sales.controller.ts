import { Controller, Post, Get, Put, Delete, Body, Param } from '@nestjs/common';
import { SalesService } from './sales.service';

@Controller('sales')
export class SalesController {
  constructor(private readonly s: SalesService) {}

  @Post('create') create(@Body() b: any) { return this.s.createOrder(b); }
  @Get() findAll() { return this.s.findAll(); }
  @Get(':code') getOne(@Param('code') c: string) { return this.s.getOrder(c); }
  
  @Post(':id/convert') convert(@Param('id') id: number, @Body('accepted') accepted: boolean) { return this.s.convertQuoteToSo(id, accepted); }
  @Get('samples/all') getAllSamples() { return this.s.sampleRepo.find({ order: { created_at: 'DESC' } }); }
  @Put('quote/:id') updateQuote(@Param('id') id: number, @Body() b: any) { return this.s.updateQuote(id, b); }
  @Delete('quote/:id') deleteQuote(@Param('id') id: number) { return this.s.deleteQuote(id); }

  // --- MOI: Delivery & Payment History ---
  @Get(':id/deliveries') getDeliveries(@Param('id') id: number) { return this.s.getDeliveryHistory(id); }
  @Post(':id/delivery') createDelivery(@Param('id') id: number, @Body() b: any) { return this.s.createDelivery(id, b); }
  @Get(':code/payments') getPayments(@Param('code') code: string) { return this.s.getPaymentHistory(code); }
}