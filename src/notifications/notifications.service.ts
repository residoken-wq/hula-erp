import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private repo: Repository<Notification>,
  ) {}

  async create(data: any) {
      return this.repo.save(this.repo.create(data));
  }

  async findByUser(userId: number) {
      return this.repo.find({ 
          where: { user_id: userId }, 
          order: { created_at: 'DESC' },
          take: 20 // Lấy 20 thông báo mới nhất
      });
  }

  async markAsRead(id: number) {
      return this.repo.update(id, { is_read: true });
  }

  async markAllRead(userId: number) {
      return this.repo.update({ user_id: userId, is_read: false }, { is_read: true });
  }
}