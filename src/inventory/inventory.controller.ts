import { Controller, Post, Get, Body, Param, Put, Delete, Query, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './create-inventory.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';

@Controller('inventory')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) { }

  @Get('history')
  @RequirePermission('INVENTORY', 'can_view')
  async getHistory() { return this.inventoryService.getHistory(); }

  // API lấy chi tiết tồn kho (để Frontend map vào bảng)
  @Get('stocks')
  @RequirePermission('INVENTORY', 'can_view')
  async getStocks() { return this.inventoryService.getAllStocks(); }

  @Post('adjust')
  @RequirePermission('INVENTORY', 'can_create')
  @UsePipes(new ValidationPipe())
  async adjust(@Body() dto: CreateInventoryDto) {
    return this.inventoryService.adjustStock(
      dto.type,
      dto.itemType,
      dto.itemId,
      dto.quantity,
      dto.ref,
      dto.note,
      dto.warehouse
    );
  }

  // API Reset tồn kho (Dành cho Dev/Admin)
  @Post('reset')
  @RequirePermission('INVENTORY', 'can_delete')
  async reset() {
    return this.inventoryService.resetAllStocks();
  }

  // API Chuyển kho
  @Post('transfer')
  async transfer(@Body() body: any) {
    return this.inventoryService.transferStock(
      body.itemType, body.itemId, body.quantity,
      body.fromWh, body.toWh, body.note
    );
  }

  // --- GOODS RECEIPT API ---
  @Post('goods-receipt/draft')
  async createDraft(@Body() body: any) {
    return this.inventoryService.createDraftReceipt(body);
  }

  @Get('goods-receipt/pending')
  async getPending() {
    return this.inventoryService.getPendingReceipts();
  }

  @Post('goods-receipt/:id/confirm')
  async confirm(@Param('id') id: string) {
    return this.inventoryService.confirmReceipt(Number(id));
  }

  // --- EXPORT CONFIRMATION API ---
  @Get('deliveries/pending')
  async getPendingDeliveries() {
    return this.inventoryService.getPendingDeliveries();
  }

  @Post('deliveries/:id/confirm')
  async confirmDelivery(
    @Param('id') id: string,
    @Body('warehouse') warehouse: string
  ) {
    return this.inventoryService.confirmStockExport(Number(id), warehouse);
  }

  // --- SHIPPING CARRIERS API ---
  @Get('shipping-carriers')
  async getShippingCarriers() {
    return this.inventoryService.getAllShippingCarriers();
  }

  @Post('shipping-carriers')
  async createShippingCarrier(@Body() body: any) {
    return this.inventoryService.createShippingCarrier(body);
  }

  @Put('shipping-carriers/:id')
  async updateShippingCarrier(@Param('id') id: string, @Body() body: any) {
    return this.inventoryService.updateShippingCarrier(Number(id), body);
  }

  @Delete('shipping-carriers/:id')
  async deleteShippingCarrier(@Param('id') id: string) {
    return this.inventoryService.deleteShippingCarrier(Number(id));
  }

  // ===========================================
  // --- GOODS ISSUE (PHIẾU XUẤT KHO) API ---
  // ===========================================

  @Post('goods-issue')
  @RequirePermission('INVENTORY', 'can_create')
  async createGoodsIssue(@Body() body: any) {
    return this.inventoryService.createGoodsIssue(body);
  }

  @Get('goods-issue')
  async getGoodsIssues(@Query('po_id') poId?: string, @Query('supplier_id') supplierId?: string) {
    const query: any = {};
    if (poId) query.po_id = Number(poId);
    if (supplierId) query.supplier_id = Number(supplierId);
    return this.inventoryService.getGoodsIssues(query);
  }

  @Get('goods-issue/:id')
  async getGoodsIssueDetail(@Param('id') id: string) {
    return this.inventoryService.getGoodsIssueDetail(Number(id));
  }

  @Post('goods-issue/:id/confirm')
  async confirmGoodsIssue(@Param('id') id: string) {
    return this.inventoryService.confirmGoodsIssue(Number(id));
  }

  @Post('goods-issue/:id/delivered')
  async markGoodsIssueDelivered(@Param('id') id: string) {
    return this.inventoryService.markGoodsIssueDelivered(Number(id));
  }

  @Delete('goods-issue/:id')
  @RequirePermission('INVENTORY', 'can_delete')
  async deleteGoodsIssue(@Param('id') id: string) {
    return this.inventoryService.deleteGoodsIssue(Number(id));
  }
}