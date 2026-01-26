import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateVariantDto } from './dto/create-variant.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) { }

  @Get() findAll() { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id') id: number) { return this.service.findOne(Number(id)); }

  @Post() create(@Body() b: any) { return this.service.create(b); }
  @Put(':id') update(@Param('id') id: number, @Body() b: any) { return this.service.update(id, b); }
  @Delete(':id') remove(@Param('id') id: number) { return this.service.remove(id); }

  @Post('create-variant')
  async createVariant(@Body() createVariantDto: CreateVariantDto) {
    return this.service.createVariant(createVariantDto);
  }

  @Get(':id/routings') getRoutings(@Param('id') id: number) { return this.service.getRoutings(id); }
  @Post(':id/routings') saveRoutings(@Param('id') id: number, @Body() b: any) { return this.service.saveRoutings(id, b); }

  @Get(':id/logistics') getLogistics(@Param('id') id: number) { return this.service.getLogistics(id); }
  @Post(':id/logistics') saveLogistics(@Param('id') id: number, @Body() b: any) { return this.service.saveLogistics(id, b); }

  // --- API PATTERN ---
  @Get(':id/pattern') getPattern(@Param('id') id: number) { return this.service.getPattern(id); }
  @Post(':id/pattern') savePattern(@Param('id') id: number, @Body() b: any) { return this.service.savePattern(id, b); }

  // --- API WEBSITE CONFIG ---
  @Get(':id/website-config') getWebsiteConfig(@Param('id') id: number) { return this.service.getWebsiteConfig(Number(id)); }
  @Post(':id/website-config') saveWebsiteConfig(@Param('id') id: number, @Body() b: any) { return this.service.saveWebsiteConfig(Number(id), b); }
  // --------------------------

  @Get(':sku/boms') getBoms(@Param('sku') sku: string) { return this.service.getBomByProductSku(sku); }
  @Post(':id/boms') saveBoms(@Param('id') id: number, @Body() b: any) { return this.service.saveBoms(Number(id), b); }

  @Post(':id/sync-variants') syncVariants(@Param('id') id: number) { return this.service.syncToVariants(id); }

  @Get('combo/:sku') getCombo(@Param('sku') sku: string) { return this.service.getComboComponents(sku); }
  @Post('combo/add') addComboItem(@Body() body: any) { return this.service.addComponent(body.parentSku, body.childSku, Number(body.qty)); }
  @Delete('combo/item/:id') removeComboItem(@Param('id') id: number) { return this.service.removeComponent(id); }

  @Post(':id/components')
  saveComponents(@Param('id') id: number, @Body() items: any[]) {
    return this.service.saveComponents(id, items);
  }

  @Post('copy-bom')
  async copyBom(@Body() body: any) {
    return this.service.copyBom(body.sourceSku, body.targetSku);
  }

  @Get('calculate-cost/:sku') calculateCost(@Param('sku') sku: string) { return this.service.calculateCostPrice(sku); }

  @Post('calculate-all-costs')
  async calculateAllCosts() {
    return this.service.calculateAllCosts();
  }
}