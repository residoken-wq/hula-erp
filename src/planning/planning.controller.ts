import { Controller, Get, Post, Put, Param, Body, Delete, Query } from '@nestjs/common';
import { PlanningService } from './planning.service';

@Controller('planning')
export class PlanningController {
  constructor(private readonly s: PlanningService) { }

  @Get('suggestion') getSuggestion() { return this.s.getSuggestion(); }
  @Get('gantt') getGantt() { return this.s.getGanttData(); }

  // --- MỚI: Booking Management APIs ---
  @Get('booking-stats')
  getBookingStats(@Query('month') month?: string, @Query('year') year?: string) {
    return this.s.getBookingStats(month, year);
  }

  @Get('summary-dashboard')
  getSummaryDashboard(@Query() query: any) {
    return this.s.getSummaryDashboard(query);
  }

  @Get('bookings') getAllBookings() { return this.s.getAllBookings(); }
  @Get('bookings/:sku') getBookingsBySku(@Param('sku') sku: string) { return this.s.getBookingsBySku(sku); }
  @Post('bookings/:itemId/revert') revertBooking(@Param('itemId') itemId: number) { return this.s.revertBooking(Number(itemId)); }
  @Post('sync-booking-stock') syncBookingStock() { return this.s.syncBookingStock(); }

  @Post('gantt/:id/config') saveGanttConfig(@Param('id') id: number, @Body() b: any) { return this.s.saveGanttConfig(id, b); }
  @Post('create') create(@Body() b: any) { return this.s.createPlan(b); }
  @Get() findAll() { return this.s.findAll(); }
  @Get(':id') getOne(@Param('id') id: number) { return this.s.findOne(id); }
  @Delete(':id') delete(@Param('id') id: number) { return this.s.deletePlan(id); }

  @Post('mrp/:id') runMrp(@Param('id') id: number, @Query('force') force: string) { return this.s.calculateMaterialNeeds(id, force === 'true'); }
  @Post('save/:id') save(@Param('id') id: number, @Body() b: any) { return this.s.saveAnalysis(id, b.mrp_result, b.outsourcing_result, b.logistics_result); }

  // Endpoint chung để tạo PO (cho cả NPL và Gia công)
  @Post(':id/generate-pos')
  generatePos(@Param('id') id: number, @Body() body: any) {
    return this.s.generatePos(id, body.items);
  }

  // --- MỚI: API Xác nhận Bookings ---
  @Get(':id/booking-items')
  getBookingItemsWithStock(@Param('id') id: number) {
    return this.s.getBookingItemsWithStock(Number(id));
  }

  @Post(':id/confirm-bookings')
  confirmBookings(@Param('id') id: number, @Body('itemIds') itemIds?: number[]) {
    return this.s.confirmBookings(id, itemIds);
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

  // --- MỚI: Version History, Production Status, Sync BOD ---
  @Get(':id/history')
  getHistory(@Param('id') id: number) {
    return this.s.getHistory(id);
  }

  @Get(':id/production-status')
  getProductionStatus(@Param('id') id: number) {
    return this.s.getProductionStatus(id);
  }

  @Post(':id/init-production')
  initProduction(@Param('id') id: number) {
    return this.s.initProduction(id);
  }

  @Post(':id/sync-bod-followup')
  syncBodFollowUp(@Param('id') id: number) {
    return this.s.syncBodFollowUp(id);
  }
}