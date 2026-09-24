import { Module } from '@nestjs/common';
import { Mailer } from './application/mailer';
import { NotificationService } from './application/notification.service';
import { NodemailerMailer } from './infrastructure/mailer.adapter';

@Module({
  providers: [NodemailerMailer, { provide: Mailer, useExisting: NodemailerMailer }, NotificationService],
  exports: [NotificationService],
})
export class NotificationsModule {}
