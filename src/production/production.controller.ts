import { Controller, Post, Body, Param } from '@nestjs/common';
import { ProductionService } from './production.service';

@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Post('create')
  async create(@Body() body: any) {
    return this.productionService.createWorkOrder(body);
  }

  @Post('complete/:code')
  async complete(@Param('code') code: string) {
    return this.productionService.completeWorkOrder(code);
  }
}
