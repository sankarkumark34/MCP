import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationExecution } from '../entities/notification-execution.entity';
import { Schedule } from '../entities/schedule.entity';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { NotificationService } from './notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationExecution, Schedule]),
    WhatsAppModule,
  ],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationsModule {}
