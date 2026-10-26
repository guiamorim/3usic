// When to remind the user to export a copy of their data. Everything lives only in the
// browser, and Safari can evict site data that isn't used for a while, so a recent file
// on the user's side is the only real safety net.
import { daysBetween } from './dates';

export const BACKUP_EVERY_DAYS = 14;
/** Don't nag before there is something worth saving. */
const MIN_PRACTICE_DAYS = 3;

export interface BackupInput {
  today: string;
  /** Day of the last export, if any. */
  lastExportDay?: string;
  /** Reminder hidden until this day (inclusive). */
  snoozedUntil?: string;
  /** Distinct days with practice recorded. */
  practiceDays: number;
}

export function backupDue({ today, lastExportDay, snoozedUntil, practiceDays }: BackupInput): boolean {
  if (snoozedUntil && daysBetween(today, snoozedUntil) >= 0) return false;
  if (!lastExportDay) return practiceDays >= MIN_PRACTICE_DAYS;
  return daysBetween(lastExportDay, today) >= BACKUP_EVERY_DAYS;
}
