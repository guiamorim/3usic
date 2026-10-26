import { describe, expect, it } from 'vitest';
import { backupDue } from '../../src/domain/backup';

describe('backupDue', () => {
  const today = '2026-10-26';
  it('waits until there is some practice before the first reminder', () => {
    expect(backupDue({ today, practiceDays: 2 })).toBe(false);
    expect(backupDue({ today, practiceDays: 3 })).toBe(true);
  });
  it('reminds 14 days after the last export', () => {
    expect(backupDue({ today, lastExportDay: '2026-10-13', practiceDays: 10 })).toBe(false);
    expect(backupDue({ today, lastExportDay: '2026-10-12', practiceDays: 10 })).toBe(true);
  });
  it('respects the snooze up to and including its day', () => {
    expect(backupDue({ today, snoozedUntil: '2026-10-26', practiceDays: 10 })).toBe(false);
    expect(backupDue({ today, snoozedUntil: '2026-10-25', practiceDays: 10 })).toBe(true);
  });
});
