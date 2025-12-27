import { Controller, Post, Get, Put, Delete, Body, Param } from '@nestjs/common';
import { PurchasingService } from './purchasing.service';

@Controller('purchasing')
export class PurchasingController {
  constructor(private readonly s: PurchasingService) { }

  @Post()
  create(@Body() b: any) { return this.s.createPO(b); }

  @Get()
  findAll() { return this.s.getAllPOs(); }

  @Get(':id')
  findOne(@Param('id') id: number) { return this.s.getPODetail(id); }

  @Put(':id')
  update(@Param('id') id: number, @Body() b: any) { return this.s.updatePO(id, b); }

  // --- FIX: THÊM DELETE ---
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.s.remove(id);
  }
  // ------------------------

  // --- MỚI: API THEO DÕI NPL GIA CÔNG ---
  @Get(':id/outsourcing-materials')
  getOutsourcingMaterials(@Param('id') id: number) {
    return this.s.getOutsourcingMaterials(id);
  }
  // -------------------------------------

  @Post(':id/receive')
  receive(@Param('id') id: number, @Body() b: any) { return this.s.createGoodsReceipt(id, b); }

  @Get('portal/:uuid')
  getPortal(@Param('uuid') uuid: string) { return this.s.getByUuid(uuid); }

  @Post('portal/:uuid/action')
  portalAction(@Param('uuid') uuid: string, @Body() b: any) { return this.s.supplierAction(uuid, b.action, b.note); }

  @Get('requirements') getRequirements() { return this.s.getPendingRequirements(); }
  @Post('create-pooled') createPooled(@Body() b: any) { return this.s.createPooledPO(b); }
}