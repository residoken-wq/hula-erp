import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly s: SuppliersService) {}

  // --- CRUD NHÀ CUNG CẤP ---
  
  @Post() 
  async create(@Body() b: any) { // FIX: Thêm async
    return this.s.create(b); 
  }

  @Get() 
  async findAll() { // FIX: Thêm async
    return this.s.findAll(); 
  }

  @Get(':id') 
  async findOne(@Param('id') id: number) { // FIX: Thêm async
    return this.s.findOne(id); 
  }

  @Put(':id') 
  async update(@Param('id') id: number, @Body() b: any) { // FIX: Thêm async
    return this.s.update(id, b); 
  }

  @Delete(':id') 
  async remove(@Param('id') id: number) { // FIX: Thêm async
    return this.s.remove(id); 
  }

  // --- QUẢN LÝ BẢNG GIÁ NPL ---

  @Post(':id/material-price') 
  async addPrice(@Param('id') id: number, @Body() b: any) { // FIX: Thêm async
      return this.s.addMaterialPrice(id, b); 
  }

  @Delete('material-price/:id')
  async removePrice(@Param('id') id: number) { // FIX: Thêm async
      return this.s.deleteMaterialPrice(id);
  }

  // --- QUẢN LÝ BẢNG GIÁ CHUNG (ManufacturersPage.tsx) ---
  @Post('price')
  async addSupplierPrice(@Body() b: any) { // FIX: Thêm async
      return this.s.addSupplierPrice(b);
  }

  @Post('check-price')
  async checkPrice(@Body() b: any) { // FIX: Thêm async
      return this.s.checkPrice(b.supplierId, b.processId);
  }
}