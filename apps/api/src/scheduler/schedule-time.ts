import { DateTime } from 'luxon';
import { Schedule } from '../entities/schedule.entity';

export function runsOnWeekday(schedule: Schedule, isoWeekday: number): boolean {
  // luxon isoWeekday: 1 = Monday .. 7 = Sunday
  switch (schedule.frequency) {
    case 'daily':
      return true;
    case 'weekdays':
      return isoWeekday >= 1 && isoWeekday <= 5;
    case 'weekends':
      return isoWeekday === 6 || isoWeekday === 7;
    case 'weekly': {
      // schedule.weekday is 0 (Sunday) .. 6 (Saturday)
      const target = schedule.weekday ?? 0;
      return (isoWeekday % 7) === target;
    }
    default:
      return false;
  }
}

/** True if the schedule is due at (or within `graceMinutes` after) its time. */
export function isDueNow(schedule: Schedule, now: Date, graceMinutes = 5): boolean {
  const local = DateTime.fromJSDate(now, { zone: schedule.timezone });
  if (!local.isValid || !runsOnWeekday(schedule, local.weekday)) return false;
  const [hour, minute] = schedule.time.split(':').map(Number);
  const target = local.set({ hour, minute, second: 0, millisecond: 0 });
  const diff = local.diff(target, 'minutes').minutes;
  return diff >= 0 && diff < graceMinutes;
}

/** The scheduled occurrence timestamp for "today" in the schedule's timezone. */
export function occurrenceFor(schedule: Schedule, now: Date): Date {
  const local = DateTime.fromJSDate(now, { zone: schedule.timezone });
  const [hour, minute] = schedule.time.split(':').map(Number);
  return local.set({ hour, minute, second: 0, millisecond: 0 }).toJSDate();
}

/** Next execution time (UTC Date) or null if disabled. */
export function nextRunAt(schedule: Schedule, now: Date): Date | null {
  if (!schedule.enabled) return null;
  const [hour, minute] = schedule.time.split(':').map(Number);
  let candidate = DateTime.fromJSDate(now, { zone: schedule.timezone }).set({
    hour,
    minute,
    second: 0,
    millisecond: 0,
  });
  for (let i = 0; i < 8; i++) {
    if (
      candidate.toJSDate() > now &&
      runsOnWeekday(schedule, candidate.weekday)
    ) {
      return candidate.toJSDate();
    }
    candidate = candidate.plus({ days: 1 });
  }
  return null;
}

export function humanScheduleSummary(schedule: {
  frequency: string;
  time: string;
  timezone: string;
  weekday?: number | null;
}): string {
  const days: Record<string, string> = {
    daily: 'Every day',
    weekdays: 'Monday to Friday',
    weekends: 'Saturday and Sunday',
  };
  const weekdayNames = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
  ];
  const when =
    schedule.frequency === 'weekly'
      ? `Every ${weekdayNames[schedule.weekday ?? 0]}`
      : days[schedule.frequency] ?? schedule.frequency;
  return `${when} at ${schedule.time} (${schedule.timezone})`;
}
