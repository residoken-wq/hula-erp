import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Task } from './task.entity';
import { Notification } from '../notifications/notification.entity';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task) private taskRepo: Repository<Task>,
    @InjectRepository(Notification) private notiRepo: Repository<Notification>,
  ) {}

  async findAll() { 
      return this.taskRepo.find({ order: { created_at: 'DESC' }, relations: ['assignee'] }); 
  }

  async create(data: any) { return this.taskRepo.save(this.taskRepo.create(data)); }
  
  async update(id: number, data: any) { 
      await this.taskRepo.update(id, data); 
      return this.taskRepo.findOne({ where: { id } });
  }
  
  async remove(id: number) { return this.taskRepo.delete(id); }

  // --- CRON JOB: REMINDER TỰ ĐỘNG ---
  // Chạy mỗi phút để kiểm tra deadline
  @Cron(CronExpression.EVERY_MINUTE)
  async checkDeadlines() {
      // Tìm các task chưa xong, chưa nhắc, và deadline sắp đến (hoặc đã qua)
      // Logic: Deadline < (Hiện tại + 30 phút)
      const now = new Date();
      const remindTime = new Date(now.getTime() + 30 * 60000); // 30 phút tới

      const tasks = await this.taskRepo.find({
          where: {
              status: LessThan('DONE') as any, // Chưa xong (giả sử trạng thái sort đc, hoặc dùng In([...]))
              is_reminded: false,
              due_date: LessThan(remindTime)
          },
          relations: ['assignee']
      });

      for (const task of tasks) {
          if (task.assignee) {
              // Tạo thông báo
              await this.notiRepo.save({
                  title: '⏰ Nhắc nhở công việc',
                  message: `Công việc "${task.title}" sắp đến hạn hoặc đã quá hạn!`,
                  type: 'WARNING',
                  user_id: task.assignee.id,
                  link: '/tasks',
                  is_read: false
              });
              
              // Đánh dấu đã nhắc để không spam
              await this.taskRepo.update(task.id, { is_reminded: true });
              this.logger.log(`Reminded User ${task.assignee.id} about Task ${task.id}`);
          }
      }
  }
}