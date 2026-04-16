import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AnalyticsVisitor } from './analytics-visitor.entity';
import { Repository, Between } from 'typeorm';
import * as dayjs from 'dayjs';

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);

    constructor(
        @InjectRepository(AnalyticsVisitor)
        private visitorRepo: Repository<AnalyticsVisitor>,
    ) { }

    async ping(data: { session_id: string; ip_address?: string; user_agent?: string }) {
        try {
            let visitor = await this.visitorRepo.findOne({
                where: { session_id: data.session_id }
            });

            if (visitor) {
                // Update last_active
                visitor.last_active = new Date();
                if (data.ip_address && !visitor.ip_address) visitor.ip_address = data.ip_address;
                if (data.user_agent && !visitor.user_agent) visitor.user_agent = data.user_agent;
                await this.visitorRepo.save(visitor);
            } else {
                // Create new
                visitor = this.visitorRepo.create({
                    session_id: data.session_id,
                    ip_address: data.ip_address,
                    user_agent: data.user_agent,
                    last_active: new Date(),
                });
                await this.visitorRepo.save(visitor);
            }
            return { success: true };
        } catch (error) {
            this.logger.error('Error in ping: Table might not exist yet', error);
            // Graceful fallback
            return { success: false, error: 'Initialization error' };
        }
    }

    async getStats() {
        try {
            const todayStart = dayjs().startOf('day').toDate();
            const todayEnd = dayjs().endOf('day').toDate();
            // 3 minutes timeout for "online"
            const onlineThreshold = dayjs().subtract(3, 'minute').toDate();

            const totalVisitors = await this.visitorRepo.count();
            
            const todayVisitors = await this.visitorRepo.count({
                where: {
                    created_at: Between(todayStart, todayEnd)
                }
            });

            const onlineVisitors = await this.visitorRepo.createQueryBuilder('visitor')
                .where('visitor.last_active >= :threshold', { threshold: onlineThreshold })
                .getCount();

            return {
                totalVisitors,
                todayVisitors,
                onlineVisitors
            };
        } catch (error) {
            this.logger.error('Error in getStats: Table might not exist yet', error);
            // Graceful fallback according to TECHNICAL_RULES
            return {
                totalVisitors: 0,
                todayVisitors: 0,
                onlineVisitors: 0
            };
        }
    }
}
