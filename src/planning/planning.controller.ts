import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { PlanningService } from './planning.service';

@Controller('planning')
export class PlanningController {
  constructor(private readonly s: PlanningService) { }

  @Get('suggestion') getSuggestion() { return this.s.getSuggestion(); }
  @Post('create') create(@Body() b: any) { return this.s.createPlan(b); }
  @Get() findAll() { return this.s.findAll(); }

  @Post('mrp/:id') runMrp(@Param('id') id: number) { return this.s.calculateMaterialNeeds(id); }
  @Post('save/:id') save(@Param('id') id: number, @Body() b: any) { return this.s.saveAnalysis(id, b.mrp_result, b.outsourcing_result, b.logistics_result); }

  // Endpoint chung để tạo PO (cho cả NPL và Gia công)
  @Post(':id/generate-pos')
  generatePos(@Param('id') id: number, @Body() body: any) {
    // body.items: Danh sách các item cần mua (đã lọc và điền note từ FE)
    return this.s.generatePos(id, body.items);
  }
}