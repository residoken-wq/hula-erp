import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ProductionService } from './production.service';

@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Post('orders')
  createWorkOrder(@Body() body: any) {
    return this.productionService.createOrder(body); // Đã khớp service.createOrder
  }

  @Get('orders')
  getAllWorkOrders() {
    return this.productionService.getAllOrders();
  }

  @Post('orders/:id/start')
  startWorkOrder(@Param('id') id: number) {
    return this.productionService.startProduction(id);
  }

  @Post('orders/:id/complete')
  completeWorkOrder(@Param('id') id: number) {
    return this.productionService.finishProduction(id); // Đã khớp service.finishProduction
  }
}