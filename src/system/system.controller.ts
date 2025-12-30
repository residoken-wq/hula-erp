import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SystemService } from './system.service';

@Controller('system')
export class SystemController {
    constructor(private readonly s: SystemService) { }

    @Get('smtp')
    getSmtpConfig() {
        return this.s.getSmtpConfig();
    }

    @Post('smtp')
    saveSmtpConfig(@Body() body: any) {
        return this.s.saveSmtpConfig(body);
    }

    @Get('logs')
    getLogs() {
        return this.s.getLogs();
    }

    @Get('config/:key')
    async getConfig(@Param('key') key: string) {
        const val = await this.s.getValue(key);
        return { key, value: val };
    }

    @Post('config')
    saveConfig(@Body() body: { key: string; value: string; description?: string }) {
        return this.s.setValue(body.key, body.value, body.description);
    }
}
