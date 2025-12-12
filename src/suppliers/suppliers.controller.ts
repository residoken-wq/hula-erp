import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly s: SuppliersService) {}

  @Post() create(@Body() b: any) { return this.s.create(b); }
  @Get() findAll() { return this.s.findAll(); }
  @Get(':id') findOne(@Param('id') id: number) { return this.s.findOne(id); }
  @Put(':id') update(@Param('id') id: number, @Body() b: any) { return this.s.update(id, b); }
  @Delete(':id') remove(@Param('id') id: number) { return this.s.remove(id); }

  @Post(':id/material-price') 
  addPrice(@Param('id') id: number, @Body() b: any) { 
      return this.s.addMaterialPrice(id, b); 
  }

  @Post('check-price')
  checkPrice(@Body() b: any) {
      return this.s.checkPrice(b.supplierId, b.processId);
  }
}