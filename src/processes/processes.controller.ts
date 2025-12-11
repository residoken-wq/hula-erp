import { Controller, Get, Post, Body } from '@nestjs/common';
import { ProcessesService } from './processes.service';

@Controller('processes')
export class ProcessesController {
  constructor(private readonly s: ProcessesService) {}

  @Get() findAll() { return this.s.findAll(); }
  @Post() create(@Body() b: any) { return this.s.create(b); }
  @Post('seed') seed() { return this.s.seed(); }
}