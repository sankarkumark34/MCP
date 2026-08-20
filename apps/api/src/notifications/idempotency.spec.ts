import { dailyIdempotencyKey } from './idempotency';

describe('dailyIdempotencyKey', () => {
  const scheduleId = 'sched-1';

  it('is deterministic for the same schedule and local day', () => {
    const a = dailyIdempotencyKey(scheduleId, new Date('2026-08-20T04:30:00+05:30'), 'Asia/Kolkata');
    const b = dailyIdempotencyKey(scheduleId, new Date('2026-08-20T04:34:59+05:30'), 'Asia/Kolkata');
    expect(a).toBe(b);
    expect(a).toBe('sched-1:2026-08-20');
  });

  it('differs across local days', () => {
    const a = dailyIdempotencyKey(scheduleId, new Date('2026-08-20T04:30:00+05:30'), 'Asia/Kolkata');
    const b = dailyIdempotencyKey(scheduleId, new Date('2026-08-21T04:30:00+05:30'), 'Asia/Kolkata');
    expect(a).not.toBe(b);
  });

  it('uses the schedule timezone, not UTC', () => {
    // 2026-08-20T23:00:00Z is already 2026-08-21 in Asia/Kolkata (+05:30)
    const key = dailyIdempotencyKey(scheduleId, new Date('2026-08-20T23:00:00Z'), 'Asia/Kolkata');
    expect(key).toBe('sched-1:2026-08-21');
  });

  it('differs across schedules', () => {
    const when = new Date('2026-08-20T04:30:00+05:30');
    expect(dailyIdempotencyKey('a', when, 'Asia/Kolkata')).not.toBe(
      dailyIdempotencyKey('b', when, 'Asia/Kolkata'),
    );
  });
});
