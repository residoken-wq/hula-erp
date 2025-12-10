import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  // --- CRUD NCC ---
  @Post() create(@Body() b: any) { return this.suppliersService.create(b); }
  @Get() findAll() { return this.suppliersService.findAll(); }
  @Put(':id') update(@Param('id') id: number, @Body() b: any) { return this.suppliersService.update(id, b); }
  @Delete(':id') remove(@Param('id') id: number) { return this.suppliersService.remove(id); }

  // --- QUAN LY GIA ---
  @Get(':id/prices') 
  getPrices(@Param('id') id: number) { return this.suppliersService.getPriceList(id); }

  @Post('price')
  addPrice(@Body() b: any) { return this.suppliersService.addPrice(b); }

  @Delete('price/:id')
  removePrice(@Param('id') id: number) { return this.suppliersService.removePrice(id); }
}
