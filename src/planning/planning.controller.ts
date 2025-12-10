import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { PlanningService } from './planning.service';

@Controller('planning')
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Post('create')
  create(@Body() body: any) {
    return this.planningService.createPlan(body);
  }

  @Post('mrp/:id')
  runMrp(@Param('id') id: number) {
    return this.planningService.calculateMaterialNeeds(id);
  }
  
  @Get()
  findAll() {
      return this.planningService.findAll();
  }
}
