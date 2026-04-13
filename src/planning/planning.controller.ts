import { Controller, Get, Post, Put, Param, Body, Delete } from '@nestjs/common';
import { PlanningService } from './planning.service';

@Controller('planning')
export class PlanningController {
  constructor(private readonly s: PlanningService) { }

  @Get('suggestion') getSuggestion() { return this.s.getSuggestion(); }
  @Get('gantt') getGantt() { return this.s.getGanttData(); }
  @Post('gantt/:id/config') saveGanttConfig(@Param('id') id: number, @Body() b: any) { return this.s.saveGanttConfig(id, b); }
  @Post('create') create(@Body() b: any) { return this.s.createPlan(b); }
  @Get() findAll() { return this.s.findAll(); }
  @Get(':id') getOne(@Param('id') id: number) { return this.s.findOne(id); }
  @Delete(':id') delete(@Param('id') id: number) { return this.s.deletePlan(id); }

  @Post('mrp/:id') runMrp(@Param('id') id: number) { return this.s.calculateMaterialNeeds(id); }
  @Post('save/:id') save(@Param('id') id: number, @Body() b: any) { return this.s.saveAnalysis(id, b.mrp_result, b.outsourcing_result, b.logistics_result); }

  // Endpoint chung để tạo PO (cho cả NPL và Gia công)
  @Post(':id/generate-pos')
  generatePos(@Param('id') id: number, @Body() body: any) {
    return this.s.generatePos(id, body.items);
  }

  // --- MỚI: Plan Status Management ---
  @Put(':id/status')
  updatePlanStatus(@Param('id') id: number, @Body('status') status: string) {
    return this.s.updatePlanStatus(id, status);
  }

  @Post(':id/check-status')
  checkPlanStatus(@Param('id') id: number) {
    return this.s.checkAndUpdatePlanStatus(id);
  }
}