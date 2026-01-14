import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification) private repo: Repository<Notification>,
        private firebaseService: FirebaseService,
    ) { }

    async create(data: {
        user_id: number;
        title: string;
        message: string;
        type?: string;
        link?: string;
        is_read?: boolean;
    }) {
        // Save to PostgreSQL (source of truth)
        const notification = await this.repo.save(this.repo.create({
            ...data,
            type: data.type || 'INFO',
            is_read: data.is_read ?? false
        }));

        // Push to Firebase for real-time update
        try {
            await this.firebaseService.pushNotification(data.user_id, {
                id: notification.id,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                link: notification.link,
                is_read: notification.is_read,
                created_at: notification.created_at
            });
        } catch (error) {
            // Log but don't fail - PostgreSQL is the source of truth
            console.error('Failed to push to Firebase:', error);
        }

        return notification;
    }

    async findByUser(userId: number) {
        return this.repo.find({
            where: { user_id: userId },
            order: { created_at: 'DESC' },
            take: 50 // Lấy 50 thông báo mới nhất
        });
    }

    async markAsRead(id: number) {
        const notification = await this.repo.findOne({ where: { id } });
        if (notification) {
            // Update PostgreSQL
            await this.repo.update(id, { is_read: true });

            // Update Firebase
            try {
                await this.firebaseService.markAsRead(notification.user_id, id);
            } catch (error) {
                console.error('Failed to update Firebase:', error);
            }
        }
        return { success: true };
    }

    async markAllRead(userId: number) {
        // Update PostgreSQL
        await this.repo.update({ user_id: userId, is_read: false }, { is_read: true });

        // Update Firebase
        try {
            await this.firebaseService.markAllAsRead(userId);
        } catch (error) {
            console.error('Failed to update Firebase:', error);
        }

        return { success: true };
    }

    async getUnreadCount(userId: number): Promise<number> {
        return this.repo.count({
            where: { user_id: userId, is_read: false }
        });
    }
}