import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { PlanningService } from './planning.service';

@Controller('planning')
export class PlanningController {
  constructor(private readonly s: PlanningService) {}

  @Get('suggestion') getSuggestion() { return this.s.getSuggestion(); }
  @Post('create') create(@Body() b: any) { return this.s.createPlan(b); }
  @Get() findAll() { return this.s.findAll(); }
  
  @Post('mrp/:id') runMrp(@Param('id') id: number) { return this.s.calculateMaterialNeeds(id); }
  
  // New: Generate POs
  @Post(':id/generate-pos') 
  generatePos(@Param('id') id: number, @Body() body: any) { 
      // body.mrpData truyen tu frontend xuong
      return this.s.generatePos(id, body.mrpData); 
  }
}