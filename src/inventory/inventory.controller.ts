import { Controller, Post, Get, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './create-inventory.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

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
}