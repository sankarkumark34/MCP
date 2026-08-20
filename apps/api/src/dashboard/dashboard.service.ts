import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { Schedule } from '../entities/schedule.entity';
import { NotificationExecution } from '../entities/notification-execution.entity';
import { nextRunAt, humanScheduleSummary } from '../scheduler/schedule-time';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Schedule)
    private readonly schedules: Repository<Schedule>,
    @InjectRepository(NotificationExecution)
    private readonly executions: Repository<NotificationExecution>,
  ) {}

  async overview() {
    const now = new Date();
    const [schedules, executions] = await Promise.all([
      this.schedules.find(),
      this.executions.find({
        where: {
          createdAt: MoreThanOrEqual(
            DateTime.fromJSDate(now).minus({ days: 14 }).toJSDate(),
          ),
        },
        order: { createdAt: 'DESC' },
      }),
    ]);

    const active = schedules.filter((s) => s.enabled);
    const sent = executions.filter(
      (e) => e.status === 'SENT' || e.status === 'RETRIED',
    ).length;
    const failed = executions.filter((e) => e.status === 'FAILED').length;

    const upcoming = active
      .map((s) => ({ schedule: s, next: nextRunAt(s, now) }))
      .filter((x): x is { schedule: Schedule; next: Date } => x.next !== null)
      .sort((a, b) => a.next.getTime() - b.next.getTime());

    // 7-day delivery trend
    const trend: { date: string; sent: number; failed: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = DateTime.fromJSDate(now).minus({ days: i });
      const dayRows = executions.filter((e) =>
        DateTime.fromJSDate(new Date(e.createdAt)).hasSame(day, 'day'),
      );
      trend.push({
        date: day.toISODate() as string,
        sent: dayRows.filter((e) => e.status === 'SENT' || e.status === 'RETRIED')
          .length,
        failed: dayRows.filter((e) => e.status === 'FAILED').length,
      });
    }

    return {
      kpis: {
        activeAutomations: active.length,
        totalAutomations: schedules.length,
        messagesSent: sent,
        messagesFailed: failed,
        nextRunAt: upcoming[0]?.next.toISOString() ?? null,
        nextRunName: upcoming[0]?.schedule.name ?? null,
        nextRunTimezone: upcoming[0]?.schedule.timezone ?? null,
      },
      deliveryTrend: trend,
      activeAutomations: upcoming.slice(0, 6).map(({ schedule, next }) => ({
        id: schedule.id,
        name: schedule.name,
        enabled: schedule.enabled,
        summary: humanScheduleSummary(schedule),
        nextRunAt: next.toISOString(),
      })),
      recentActivity: executions.slice(0, 10),
    };
  }
}
