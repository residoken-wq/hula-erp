import { Controller, Post, Get, Put, Body, Param } from '@nestjs/common';
import { PurchasingService } from './purchasing.service';

@Controller('purchasing')
export class PurchasingController {
  constructor(private readonly s: PurchasingService) {}

  @Post() 
  create(@Body() b: any) { return this.s.createPO(b); } // Đã khớp với service.createPO

  @Get() 
  findAll() { return this.s.getAllPOs(); } // Đã khớp với service.getAllPOs

  @Get(':id') 
  findOne(@Param('id') id: number) { return this.s.getPODetail(id); } // Đã khớp với service.getPODetail

  @Put(':id') 
  update(@Param('id') id: number, @Body() b: any) { return this.s.updatePO(id, b); } // Đã khớp với service.updatePO

  @Post(':id/receive') 
  receive(@Param('id') id: number, @Body() b: any) { return this.s.createGoodsReceipt(id, b); } // Đã khớp với service.createGoodsReceipt

  // Portal APIs
  @Get('portal/:uuid') 
  getPortal(@Param('uuid') uuid: string) { return this.s.getByUuid(uuid); } // Đã khớp với service.getByUuid

  @Post('portal/:uuid/action') 
  portalAction(@Param('uuid') uuid: string, @Body() b: any) { return this.s.supplierAction(uuid, b.action, b.note); } // Đã khớp với service.supplierAction
}