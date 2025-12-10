import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get() findAll() { return this.service.findAll(); }
  @Post() create(@Body() b: any) { return this.service.create(b); }
  @Put(':id') update(@Param('id') id: number, @Body() b: any) { return this.service.update(id, b); }
  @Delete(':id') remove(@Param('id') id: number) { return this.service.remove(id); }

  @Get(':id/routings') getRoutings(@Param('id') id: number) { return this.service.getRoutings(id); }
  @Post(':id/routings') saveRoutings(@Param('id') id: number, @Body() b: any) { return this.service.saveRoutings(id, b); }
  
  @Get(':id/logistics') getLogistics(@Param('id') id: number) { return this.service.getLogistics(id); }
  @Post(':id/logistics') saveLogistics(@Param('id') id: number, @Body() b: any) { return this.service.saveLogistics(id, b); }

  // --- MOI: API BOM ---
  @Get(':sku/boms') getBoms(@Param('sku') sku: string) { return this.service.getBomByProductSku(sku); }
  @Post(':id/boms') saveBoms(@Param('id') id: number, @Body() b: any) { return this.service.saveBoms(id, b); }
  
  // --- MOI: API SYNC ---
  @Post(':id/sync-variants') syncVariants(@Param('id') id: number) { return this.service.syncToVariants(id); }
  // --------------------

  @Get('calculate-cost/:sku') calculateCost(@Param('sku') sku: string) { return this.service.calculateCostPrice(sku); }
  @Get('combo/:sku') getCombo(@Param('sku') sku: string) { return this.service.getComboComponents(sku); }
}
