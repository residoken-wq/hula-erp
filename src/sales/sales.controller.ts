import { Controller, Post, Get, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SalesService } from './sales.service';

@Controller('sales')
export class SalesController {
  constructor(private readonly s: SalesService) {}

  // ============================================================
  // KHU VỰC API PRICE LIST (GIỮ NGUYÊN)
  // ============================================================
  @Post('price-lists') 
  createPriceList(@Body() body: any) { return this.s.createPriceList(body); }

  @Get('price-lists') 
  getAllPriceLists() { return this.s.getAllPriceLists(); }

  @Post('price-lists/:id/rules') 
  createRule(@Param('id') id: number, @Body() body: any) { return this.s.createPriceListRule(id, body); }

  @Get('price-lists/:id/rules') 
  getRules(@Param('id') id: number) { return this.s.getPriceListRules(id); }

  @Get('validate-price')
  async validatePrice(@Query('sku') sku: string, @Query('unitPrice') unitPrice: number, @Query('userId') userId: number) {
      return this.s.validatePriceAgainstPriceList(sku, Number(unitPrice), Number(userId));
  }

  // ============================================================
  // KHU VỰC API TRAO ĐỔI / COMMENT
  // ============================================================
  @Get(':id/comments')
  getComments(@Param('id') id: number) { return this.s.getComments(id); }

  @Post(':id/comment')
  addComment(@Param('id') id: number, @Body() body: any) { return this.s.addComment(id, body.content, body.sender, body.name); }

  @Post('comment/:id/toggle')
  toggleComment(@Param('id') id: number) { return this.s.toggleCommentVisibility(id); }

  // ============================================================
  // KHU VỰC API SALES ORDER
  // ============================================================

  @Post() // Tạo đơn hàng
  create(@Body() b: any) { return this.s.createOrder(b); }
  
  @Get() // Lấy danh sách
  findAll() { return this.s.findAll(); }

  @Get(':idOrCode') // Lấy chi tiết (ID hoặc Code)
  findOne(@Param('idOrCode') idOrCode: string) { return this.s.findOne(idOrCode); }

  // --- FIX LỖI 404: THÊM API CẬP NHẬT ĐƠN HÀNG ---
  @Put(':id') 
  update(@Param('id') id: number, @Body() b: any) { 
      return this.s.update(Number(id), b); 
  }
  // -----------------------------------------------
  
  @Get('samples/all') getAllSamples() { return this.s.sampleRepo.find({ order: { created_at: 'DESC' } }); }
  
  @Post(':id/convert') convert(@Param('id') id: number, @Body('accepted') accepted: boolean) { return this.s.convertQuoteToSo(id, accepted); }
  
  // API xóa quote (giữ nguyên để tương thích code cũ nếu có)
  @Delete('quote/:id') deleteQuote(@Param('id') id: number) { return this.s.deleteQuote(id); }
  
  // Logistics APIs
  @Get(':id/deliveries') getDeliveries(@Param('id') id: number) { return this.s.getDeliveryHistory(id); }
  @Post(':id/delivery') createDelivery(@Param('id') id: number, @Body() b: any) { return this.s.createDelivery(id, b); }
  
  // Payment APIs
  @Get(':code/payments') getPayments(@Param('code') code: string) { return this.s.getPaymentHistory(code); }
  
  // Portal APIs
  @Get('portal/:uuid') getPortal(@Param('uuid') uuid: string) { return this.s.getQuoteByUuid(uuid); }
  @Post('portal/:uuid/action') customerAction(@Param('uuid') uuid: string, @Body() body: any) { return this.s.customerAction(uuid, body.action); }
  
  @Post(':id/approve-samples') approveSamples(@Param('id') id: number) { return this.s.approveAllSamples(id); }
  @Post(':id/complete') complete(@Param('id') id: number) { return this.s.completeOrder(id); }
}