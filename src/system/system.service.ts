import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from './system-config.entity';
import { ActivityLog } from './entities/activity-log.entity';

@Injectable()
export class SystemService {
    constructor(
        @InjectRepository(SystemConfig) private configRepo: Repository<SystemConfig>,
        @InjectRepository(ActivityLog) private logRepo: Repository<ActivityLog>
    ) { }

    async getValue(key: string): Promise<string | null> {
        const config = await this.configRepo.findOne({ where: { key } });
        return config ? config.value : null;
    }

    async setValue(key: string, value: string, description?: string): Promise<SystemConfig> {
        let config = await this.configRepo.findOne({ where: { key } });
        if (!config) {
            config = this.configRepo.create({ key, value, description });
        } else {
            config.value = value;
            if (description) config.description = description;
        }
        return this.configRepo.save(config);
    }

    // --- SMTP CONFIG HELPER ---
    async getSmtpConfig() {
        const keys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM_NAME', 'SMTP_FROM_EMAIL', 'SMTP_SECURE'];
        const configs = await this.configRepo.findByIds(keys);
        const result: any = {};
        keys.forEach(k => {
            const found = configs.find(c => c.key === k);
            result[k] = found ? found.value : '';
        });
        return result;
    }

    async saveSmtpConfig(data: any) {
        await this.setValue('SMTP_HOST', data.SMTP_HOST || '', 'SMTP Host Server');
        await this.setValue('SMTP_PORT', data.SMTP_PORT || '587', 'SMTP Port');
        await this.setValue('SMTP_USER', data.SMTP_USER || '', 'SMTP Username');
        await this.setValue('SMTP_PASS', data.SMTP_PASS || '', 'SMTP Password'); // Should encrypt in real app
        await this.setValue('SMTP_FROM_NAME', data.SMTP_FROM_NAME || 'Hula ERP', 'Sender Name');
        await this.setValue('SMTP_FROM_EMAIL', data.SMTP_FROM_EMAIL || '', 'Sender Email');
        await this.setValue('SMTP_SECURE', String(data.SMTP_SECURE), 'Use SSL/TLS'); // 'true' or 'false'
        return { success: true };
    }
    // --- ACTIVITY LOGGING ---
    async logAction(module: string, action: string, description: string, userId?: number, username?: string, entityId?: string) {
        const log = this.logRepo.create({
            module,
            action,
            description,
            user_id: userId,
            username: username || 'System',
            entity_id: entityId
        });
        return this.logRepo.save(log);
    }

    async getLogs(limit: number = 100) {
        return this.logRepo.find({
            order: { timestamp: 'DESC' },
            take: limit
        });
    }
}
