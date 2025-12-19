import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get() // GET /notifications?user_id=1
  findAll(@Query('user_id') userId: number) {
      return this.service.findByUser(userId);
  }

  @Post(':id/read')
  read(@Param('id') id: number) {
      return this.service.markAsRead(id);
  }

  @Post('read-all')
  readAll(@Body() body: any) {
      return this.service.markAllRead(body.user_id);
  }
}