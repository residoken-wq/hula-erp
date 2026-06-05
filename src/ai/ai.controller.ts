import { Controller, Post, Body, UseGuards, Req, Res } from '@nestjs/common';
import { Response } from 'express';
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

    @Post('chat-stream')
    async chatStream(@Body() body: any, @Req() req: any, @Res() res: Response) {
        const userId = req.user.id.toString();
        const { message } = body;

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        try {
            await this.aiService.handleChatStream(userId, message, (chunk: string) => {
                res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
            });
            res.write(`data: [DONE]\n\n`);
            res.end();
        } catch (e) {
            res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
            res.end();
        }
    }

    @Post('suggest-reply')
    async suggestReply(@Body() body: any) {
        return this.aiService.suggestReply(body);
    }
}
