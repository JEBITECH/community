import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailResult {
  provider: string;
  messageId?: string;
  accepted: string[];
}

@Injectable()
export class EmailChannelService {
  private readonly logger = new Logger(EmailChannelService.name);
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter {
    if (!this.transporter) {
      if (
        process.env.SMTP_SERVICE === 'gmail' &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASSWORD
      ) {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        });
      } else {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
          port: Number(process.env.SMTP_PORT) || 2525,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        });
      }
    }

    return this.transporter;
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const transporter = this.getTransporter();
    const from = process.env.SMTP_FROM || 'noreply@erp-system.com';

    const result = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    this.logger.log(`Email sent to ${options.to}: ${result.messageId}`);

    return {
      provider: process.env.SMTP_SERVICE || process.env.SMTP_HOST || 'smtp',
      messageId: result.messageId,
      accepted: result.accepted as string[],
    };
  }
}
