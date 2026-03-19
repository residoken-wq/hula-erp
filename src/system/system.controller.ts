import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
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

    @Get('company')
    getCompanyConfig() {
        return this.s.getCompanyConfig();
    }

    @Post('company')
    saveCompanyConfig(@Body() body: any) {
        return this.s.saveCompanyConfig(body);
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

    // --- CONTRACT TEMPLATES ---
    @Get('templates')
    getTemplates() { return this.s.getTemplates(); }

    @Post('templates')
    saveTemplate(@Body() body: any) { return this.s.saveTemplate(body); }

    @Delete('templates/:id')
    deleteTemplate(@Param('id') id: number) { return this.s.deleteTemplate(id); }

    // --- HOME PAGE CONFIG ---
    @Get('home-config')
    getHomeConfig() { return this.s.getHomeConfig(); }

    @Post('home-config')
    saveHomeConfig(@Body() body: any) { return this.s.saveHomeConfig(body); }

    // --- ABOUT HULA PAGE CONFIG ---
    @Get('about-config')
    getAboutConfig() { return this.s.getAboutConfig(); }

    @Post('about-config')
    saveAboutConfig(@Body() body: any) { return this.s.saveAboutConfig(body); }
}
