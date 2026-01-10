import { Controller, Post, Get, Body, Param, Put, Delete, UsePipes, ValidationPipe } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './create-inventory.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) { }

  @Get('history')
  async getHistory() { return this.inventoryService.getHistory(); }

  // API lấy chi tiết tồn kho (để Frontend map vào bảng)
  @Get('stocks')
  async getStocks() { return this.inventoryService.getAllStocks(); }

  @Post('adjust')
  @UsePipes(new ValidationPipe())
  async adjust(@Body() dto: CreateInventoryDto) {
    return this.inventoryService.adjustStock(
      dto.type,
      dto.itemType,
      dto.itemId,
      dto.quantity,
      dto.ref,
      dto.note,
      dto.warehouse // <--- Truyền kho xuống service
    );
  }

  // API Reset tồn kho (Dành cho Dev/Admin)
  @Post('reset')
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
}