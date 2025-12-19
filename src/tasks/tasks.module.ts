import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule'; // Import Cron
import { Task } from './task.entity';
import { Notification } from '../notifications/notification.entity';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Notification]),
    ScheduleModule.forRoot(), // Kích hoạt Cron Job
    NotificationsModule
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService]
})
export class TasksModule {}