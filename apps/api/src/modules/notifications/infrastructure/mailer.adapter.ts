import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { loadEnv } from '../../../platform/config/env';
import { Mailer, type Mail } from '../application/mailer';

@Injectable()
export class NodemailerMailer extends Mailer {
  private readonly logger = new Logger(NodemailerMailer.name);

  async send(mail: Mail): Promise<void> {
    const env = loadEnv();
    if (!env.SMTP_HOST) {
      this.logger.log(`email to=${mail.to} subject="${mail.subject}" ${mail.text}`);
      return;
    }
    const transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
    await transport.sendMail({ from: env.EMAIL_FROM, to: mail.to, subject: mail.subject, text: mail.text });
  }
}
