import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule } from '../entities/schedule.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [TypeOrmModule.forFeature([Schedule]), NotificationsModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
