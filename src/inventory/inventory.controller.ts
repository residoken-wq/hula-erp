import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './create-inventory.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('adjust')
  @UsePipes(new ValidationPipe()) // Kich hoat kiem tra du lieu
  async adjust(@Body() dto: CreateInventoryDto) {
    return this.inventoryService.adjustStock(
      dto.type,
      dto.itemType,
      dto.itemId,
      dto.quantity,
      dto.ref,
      dto.note
    );
  }
}
