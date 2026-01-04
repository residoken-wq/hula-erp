import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('pricing')
    async suggestPrice(@Body() body: any) {
        return this.aiService.suggestPrice(body);
    }

    @Post('chat')
    async chat(@Body() body: any) {
        return this.aiService.chat(body);
    }

    @Post('suggest-reply')
    async suggestReply(@Body() body: any) {
        return this.aiService.suggestReply(body);
    }
}
