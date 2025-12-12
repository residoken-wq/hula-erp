import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { PurchasingService } from './purchasing.service';

@Controller('purchasing')
export class PurchasingController {
  constructor(private readonly s: PurchasingService) {}

  @Post() create(@Body() b: any) { return this.s.create(b); }
  @Get() findAll() { return this.s.findAll(); }
  @Get(':id') findOne(@Param('id') id: number) { return this.s.findOne(id); }
  @Put(':id') update(@Param('id') id: number, @Body() b: any) { return this.s.update(id, b); }

  @Post(':id/receive') receive(@Param('id') id: number, @Body() b: any) { return this.s.receiveGoods(id, b); }

  // Portal
  @Get('portal/:uuid') getPortal(@Param('uuid') uuid: string) { return this.s.getByUuid(uuid); }
  @Post('portal/:uuid/action') portalAction(@Param('uuid') uuid: string, @Body() b: any) { return this.s.supplierAction(uuid, b.action, b.note); }
}