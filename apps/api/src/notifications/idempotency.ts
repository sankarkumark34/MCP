import { DateTime } from 'luxon';

/**
 * Deterministic daily idempotency key: one delivery per schedule per local
 * calendar day. The same key is derived no matter how many scheduler ticks
 * observe the due time, so the DB unique constraint prevents duplicates.
 */
export function dailyIdempotencyKey(
  scheduleId: string,
  scheduledAt: Date,
  timezone: string,
): string {
  const localDate = DateTime.fromJSDate(scheduledAt, { zone: timezone }).toISODate();
  return `${scheduleId}:${localDate}`;
}

export function testIdempotencyKey(scheduleId: string, nowMs: number): string {
  return `${scheduleId}:test:${nowMs}`;
}
