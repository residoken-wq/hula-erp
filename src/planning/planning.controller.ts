import { Controller, Get, Post, Put, Param, Body, Delete, Query } from '@nestjs/common';
import { PlanningService } from './planning.service';
import { PfoDemandService } from './pfo-demand.service';
import { PfoBomEngineService } from './pfo-bom-engine.service';
import { PfoSourcingService } from './pfo-sourcing.service';
import { PfoExecutionService } from './pfo-execution.service';

@Controller('planning')
export class PlanningController {
  constructor(
    private readonly planningSvc: PlanningService,
    private readonly demandSvc: PfoDemandService,
    private readonly bomSvc: PfoBomEngineService,
    private readonly sourcingSvc: PfoSourcingService,
    private readonly execSvc: PfoExecutionService
  ) { }

  // ============================================================
  // STATIC ROUTES FIRST (phải đặt trước :id để tránh route conflict)
  // ============================================================

  // --- GENERAL PLANNING / BOOKING APIs ---
  @Get() findAll() { return this.planningSvc.findAll(); }
  @Get('suggestion') getSuggestion() { return this.planningSvc.getSuggestion(); }
  @Get('booking-stats') getBookingStats(@Query('month') month?: string, @Query('year') year?: string) { return this.planningSvc.getBookingStats(month, year); }
  @Get('bookings') getAllBookings() { return this.planningSvc.getAllBookings(); }
  @Get('gantt') getGantt() { return this.planningSvc.getGanttData(); }
  @Post('sync-booking-stock') syncBookingStock() { return this.planningSvc.syncBookingStock(); }

  // --- PFO DEMAND APIs (Gate 1) ---
  @Get('pfo/suggestions')
  getPfoSuggestions() {
    return this.demandSvc.getDemandSuggestions();
  }

  @Post('pfo/generate')
  generatePfo(@Body() b: any) {
    return this.demandSvc.generatePfo(b);
  }

  // --- PFO EXECUTION APIs (Gate 6) - static path ---
  @Post('pfo/material-issue/:reqId')
  updateMaterialIssue(@Param('reqId') reqId: number, @Body('issue_qty') issueQty: number) {
    return this.execSvc.updateMaterialIssue(reqId, issueQty);
  }

  // ============================================================
  // PARAMETERIZED ROUTES (:id) - phải đặt SAU static routes
  // ============================================================

  // --- PFO Detail ---
  @Get('pfo/:id')
  getPfoDetails(@Param('id') id: string) {
    return this.demandSvc.getPfoDetails(Number(id));
  }

  // --- PFO BOM APIs (Gate 2) ---
  @Post('pfo/:id/calculate-bom')
  calculateBom(@Param('id') id: string) {
    return this.bomSvc.calculateMaterialRequirements(Number(id));
  }

  @Post('pfo/:id/save-requirements')
  saveRequirements(@Param('id') id: string, @Body('requirements') reqs: any[]) {
    return this.bomSvc.saveMaterialRequirements(Number(id), reqs);
  }

  // --- PFO SOURCING APIs (Gate 3, 4, 5) ---
  @Post('pfo/:id/assign-vendor')
  assignVendor(@Param('id') id: string, @Body('vendor_id') vendorId: number) {
    return this.sourcingSvc.assignVendor(Number(id), vendorId);
  }

  @Post('pfo/:id/process-routing')
  updateProcessRouting(@Param('id') id: string, @Body() body: any) {
    const routingData = Array.isArray(body) ? body : (body?.routing || []);
    return this.sourcingSvc.updateProcessRouting(Number(id), routingData);
  }

  @Post('pfo/:id/generate-pos')
  generatePos(@Param('id') id: string) {
    return this.sourcingSvc.generatePos(Number(id));
  }

  // --- PFO EXECUTION APIs (Gate 7-10) ---
  @Post('pfo/:id/milestone')
  updateMilestone(@Param('id') id: number, @Body() b: any) {
    return this.execSvc.updateMilestone(id, b.milestone_type, b.data);
  }

  @Post('pfo/:id/qc')
  submitQcRecord(@Param('id') id: number, @Body() b: any) {
    return this.execSvc.submitQcRecord(id, b);
  }

  // --- LEGACY: Booking APIs (cần :id param) ---
  @Get(':id/booking-items') getBookingItemsWithStock(@Param('id') id: number) { return this.planningSvc.getBookingItemsWithStock(Number(id)); }
  @Post(':id/confirm-bookings') confirmBookings(@Param('id') id: number, @Body('itemIds') itemIds?: number[]) { return this.planningSvc.confirmBookings(id, itemIds); }
  @Post('bookings/:itemId/revert') revertBooking(@Param('itemId') itemId: number) { return this.planningSvc.revertBooking(Number(itemId)); }
}
