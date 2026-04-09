import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter | null = null;
    private readonly logger = new Logger(EmailService.name);

    constructor(private configService: ConfigService) {
        const host = this.configService.get<string>('SMTP_HOST');
        const port = this.configService.get<number>('SMTP_PORT');
        const user = this.configService.get<string>('SMTP_USER');
        const pass = this.configService.get<string>('SMTP_PASS');

        if (host && port && user && pass) {
            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465, // true for 465, false for other ports
                auth: { user, pass },
            });
            this.logger.log(`EmailService configured with SMTP host: ${host}`);
        } else {
            this.logger.warn('SMTP configuration is missing. Emails will be logged to console instead of being sent.');
        }
    }

    async sendMail(to: string, subject: string, html: string, attachments?: any[]): Promise<boolean> {
        const from = this.configService.get<string>('SMTP_FROM') || 'noreply@hula-erp.com';

        if (!this.transporter) {
            this.logger.debug(`[MOCK EMAIL to ${to}] Subject: ${subject}`);
            this.logger.debug(`Content:\n${html}`);
            return true;
        }

        try {
            const info = await this.transporter.sendMail({
                from,
                to,
                subject,
                html,
                attachments
            });
            this.logger.log(`Email sent to ${to}: ${info.messageId}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}`, error.stack);
            return false;
        }
    }
}
