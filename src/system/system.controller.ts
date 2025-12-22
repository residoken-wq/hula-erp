import { Controller, Get, Post, Body } from '@nestjs/common';
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
}
