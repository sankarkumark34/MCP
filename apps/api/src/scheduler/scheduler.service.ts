import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from '../entities/schedule.entity';
import { NotificationService } from '../notifications/notification.service';
import { isDueNow, occurrenceFor } from './schedule-time';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly enabled: boolean;
  private ticking = false;

  constructor(
    config: ConfigService,
    @InjectRepository(Schedule)
    private readonly schedules: Repository<Schedule>,
    private readonly notifications: NotificationService,
  ) {
    this.enabled = config.get('SCHEDULER_ENABLED', 'true') !== 'false';
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async tick(): Promise<void> {
    if (!this.enabled || this.ticking) return;
    this.ticking = true;
    try {
      const now = new Date();
      const active = await this.schedules.find({ where: { enabled: true } });
      const due = active.filter((s) => isDueNow(s, now));
      for (const schedule of due) {
        const scheduledAt = occurrenceFor(schedule, now);
        const execution = await this.notifications.executeScheduled(
          schedule,
          scheduledAt,
        );
        this.logger.log(
          `Schedule "${schedule.name}" → ${execution.status} (attempts: ${execution.attemptCount})`,
        );
      }
    } catch (err) {
      this.logger.error(`Scheduler tick failed: ${(err as Error).message}`);
    } finally {
      this.ticking = false;
    }
  }
}
