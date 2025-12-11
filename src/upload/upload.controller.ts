import { Controller, Post, Get, Param, Res, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { Response } from 'express';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('materials')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMaterials(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Chua chon file!');
    return this.uploadService.importMaterials(file.buffer);
  }

  @Post('products')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProducts(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Chua chon file!');
    return this.uploadService.importProducts(file.buffer);
  }

  @Post('boms')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBoms(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Chua chon file!');
    return this.uploadService.importBoms(file.buffer);
  }

  @Post('combos')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCombos(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Chua chon file!');
    return this.uploadService.importCombos(file.buffer);
  }

  // --- API IMPORT CUSTOMERS (MOI) ---
  @Post('customers')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCustomers(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Chua chon file!');
    return this.uploadService.importCustomers(file.buffer);
  }
  // ----------------------------------

  @Get('template/:type')
  async downloadTemplate(@Param('type') type: string, @Res() res: Response) {
    const buffer = this.uploadService.getTemplate(type);
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=' + type + '_template.xlsx',
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}