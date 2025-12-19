import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly s: TasksService) {}

  @Get() findAll() { return this.s.findAll(); }
  @Post() create(@Body() b: any) { return this.s.create(b); }
  @Put(':id') update(@Param('id') id: number, @Body() b: any) { return this.s.update(id, b); }
  @Delete(':id') remove(@Param('id') id: number) { return this.s.remove(id); }
}