import { Schedule } from '../entities/schedule.entity';
import {
  humanScheduleSummary,
  isDueNow,
  nextRunAt,
  runsOnWeekday,
} from './schedule-time';

function makeSchedule(partial: Partial<Schedule>): Schedule {
  return {
    id: 's1',
    name: 'Morning Message',
    targetGroupId: 'group-1',
    message: 'Good Morning!',
    frequency: 'daily',
    time: '04:30',
    timezone: 'Asia/Kolkata',
    weekday: null,
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  } as Schedule;
}

describe('isDueNow', () => {
  it('is due exactly at 04:30 Asia/Kolkata', () => {
    const schedule = makeSchedule({});
    // 04:30 IST == 23:00 UTC previous day
    expect(isDueNow(schedule, new Date('2026-08-19T23:00:00Z'))).toBe(true);
  });

  it('is due within the grace window', () => {
    const schedule = makeSchedule({});
    expect(isDueNow(schedule, new Date('2026-08-19T23:03:00Z'))).toBe(true);
  });

  it('is not due before the scheduled time or after grace', () => {
    const schedule = makeSchedule({});
    expect(isDueNow(schedule, new Date('2026-08-19T22:59:00Z'))).toBe(false);
    expect(isDueNow(schedule, new Date('2026-08-19T23:06:00Z'))).toBe(false);
  });

  it('respects weekdays frequency', () => {
    const schedule = makeSchedule({ frequency: 'weekdays', time: '09:00', timezone: 'UTC' });
    // 2026-08-22 is a Saturday
    expect(isDueNow(schedule, new Date('2026-08-22T09:00:00Z'))).toBe(false);
    // 2026-08-20 is a Thursday
    expect(isDueNow(schedule, new Date('2026-08-20T09:00:00Z'))).toBe(true);
  });
});

describe('runsOnWeekday (weekly)', () => {
  it('matches the configured weekday', () => {
    const sunday = makeSchedule({ frequency: 'weekly', weekday: 0 });
    expect(runsOnWeekday(sunday, 7)).toBe(true); // ISO 7 = Sunday
    expect(runsOnWeekday(sunday, 1)).toBe(false);
  });
});

describe('nextRunAt', () => {
  it('returns null for disabled schedules', () => {
    expect(nextRunAt(makeSchedule({ enabled: false }), new Date())).toBeNull();
  });

  it('returns the next future occurrence', () => {
    const schedule = makeSchedule({});
    const now = new Date('2026-08-20T00:00:00Z'); // 05:30 IST — today's 04:30 passed
    const next = nextRunAt(schedule, now);
    expect(next?.toISOString()).toBe('2026-08-20T23:00:00.000Z'); // tomorrow 04:30 IST
  });
});

describe('humanScheduleSummary', () => {
  it('describes daily schedules', () => {
    expect(humanScheduleSummary(makeSchedule({}))).toBe(
      'Every day at 04:30 (Asia/Kolkata)',
    );
  });

  it('describes weekly schedules', () => {
    expect(
      humanScheduleSummary(makeSchedule({ frequency: 'weekly', weekday: 1 })),
    ).toBe('Every Monday at 04:30 (Asia/Kolkata)');
  });
});
