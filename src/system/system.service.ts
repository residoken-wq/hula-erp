import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from './system-config.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { ContractTemplate } from './contract-template.entity';

@Injectable()
export class SystemService {
    constructor(
        @InjectRepository(SystemConfig) private configRepo: Repository<SystemConfig>,
        @InjectRepository(ActivityLog) private logRepo: Repository<ActivityLog>,
        @InjectRepository(ContractTemplate) private templateRepo: Repository<ContractTemplate> // <--- Inject
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

    // --- COMPANY CONFIG HELPER ---
    async getCompanyConfig() {
        const keys = ['COMPANY_NAME', 'COMPANY_ADDRESS', 'COMPANY_PHONE', 'COMPANY_EMAIL', 'COMPANY_WEBSITE'];
        const configs = await this.configRepo.findByIds(keys);
        const result: any = {};
        keys.forEach(k => {
            const found = configs.find(c => c.key === k);
            result[k] = found ? found.value : '';
        });
        return result;
    }

    async saveCompanyConfig(data: any) {
        await this.setValue('COMPANY_NAME', data.COMPANY_NAME || '', 'Tên Doanh Nghiệp');
        await this.setValue('COMPANY_ADDRESS', data.COMPANY_ADDRESS || '', 'Địa chỉ');
        await this.setValue('COMPANY_PHONE', data.COMPANY_PHONE || '', 'Số điện thoại');
        await this.setValue('COMPANY_EMAIL', data.COMPANY_EMAIL || '', 'Email liên hệ');
        await this.setValue('COMPANY_WEBSITE', data.COMPANY_WEBSITE || '', 'Website');
        return { success: true };
    }
    // --- ACTIVITY LOGGING ---
    async logAction(module: string, action: string, description: string, userId?: number, username?: string, entityId?: string, details?: any, metadata?: any, fullName?: string) {
        const log = this.logRepo.create({
            module,
            action,
            description,
            user_id: userId,
            username: username || 'System',
            full_name: fullName || username || 'System',
            entity_id: entityId,
            details,
            metadata
        });
        return this.logRepo.save(log);
    }

    async getLogs(limit: number = 100) {
        return this.logRepo.find({
            order: { timestamp: 'DESC' },
            take: limit
        });
    }


    // --- CONTRACT TEMPLATES ---
    async getTemplates() {
        return this.templateRepo.find({ order: { updated_at: 'DESC' } });
    }

    async saveTemplate(data: any) {
        // Create or Update
        if (data.id) {
            await this.templateRepo.update(data.id, data);
            return this.templateRepo.findOne({ where: { id: data.id } });
        } else {
            const t = this.templateRepo.create(data);
            return this.templateRepo.save(t);
        }
    }

    async deleteTemplate(id: number) {
        return this.templateRepo.delete(id);
    }

    // --- HOME PAGE CONFIG ---
    async getHomeConfig() {
        // Fetch all configs related to Home Page
        const keys = [
            'hero_title_1', 'hero_title_2', 'hero_description', 'hero_button_1', 'hero_button_2', 'hero_image',
            'video_enabled', 'video_title', 'video_subtitle', 'video_youtube_url',
            'products_title', 'products_subtitle', 'products_limit',
            'cta_enabled', 'cta_title', 'cta_description', 'cta_button',
            'HOME_FEATURES' // JSON string
        ];

        const configs = await this.configRepo.find();
        const result: any = {};

        // Initialize defaults
        keys.forEach(k => result[k] = '');
        result['video_enabled'] = 'true';
        result['cta_enabled'] = 'true';
        result['products_limit'] = '4';

        configs.forEach(c => {
            if (keys.includes(c.key)) {
                result[c.key] = c.value;
            }
        });

        // Parse features if exists
        try {
            if (result['HOME_FEATURES']) {
                result['features'] = JSON.parse(result['HOME_FEATURES']);
            }
        } catch (e) {
            result['features'] = [];
        }

        // Convert booleans/numbers
        result['video_enabled'] = result['video_enabled'] === 'true';
        result['cta_enabled'] = result['cta_enabled'] === 'true';
        result['products_limit'] = Number(result['products_limit']) || 4;

        return result;
    }

    async saveHomeConfig(data: any) {
        const keys = [
            'hero_title_1', 'hero_title_2', 'hero_description', 'hero_button_1', 'hero_button_2', 'hero_image',
            'video_title', 'video_subtitle', 'video_youtube_url',
            'products_title', 'products_subtitle',
            'cta_title', 'cta_description', 'cta_button'
        ];

        // Save simple string keys
        for (const key of keys) {
            if (data[key] !== undefined) {
                await this.setValue(key, String(data[key]), 'Home Page Config');
            }
        }

        // Save Booleans/Numbers
        if (data.video_enabled !== undefined) await this.setValue('video_enabled', String(data.video_enabled), 'Home Page Config');
        if (data.cta_enabled !== undefined) await this.setValue('cta_enabled', String(data.cta_enabled), 'Home Page Config');
        if (data.products_limit !== undefined) await this.setValue('products_limit', String(data.products_limit), 'Home Page Config');

        // Save Features as JSON
        if (data.features) {
            await this.setValue('HOME_FEATURES', JSON.stringify(data.features), 'Home Page Features List');
        }

        return { success: true };
    }
}
