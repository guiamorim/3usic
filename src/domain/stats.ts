import type { PracticeEntry } from '../storage/schema';
import { addDays, weekStart } from './dates';

export interface PracticeStats {
  totalMinutes: number;
  todayMinutes: number;
  weekMinutes: number;
  daysPracticedThisWeek: number;
  last7: { day: string; minutes: number }[];
}

export function practiceStats(entries: readonly PracticeEntry[], today: string): PracticeStats {
  const byDay = new Map<string, number>();
  for (const e of entries) byDay.set(e.day, (byDay.get(e.day) ?? 0) + e.seconds);
  const minutes = (sec: number) => Math.round(sec / 60);
  const start = weekStart(today);
  let weekSec = 0;
  let daysThisWeek = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(start, i);
    const sec = byDay.get(d) ?? 0;
    weekSec += sec;
    if (sec >= 60) daysThisWeek++;
  }
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i - 6);
    return { day: d, minutes: minutes(byDay.get(d) ?? 0) };
  });
  const totalSec = entries.reduce((s, e) => s + e.seconds, 0);
  return {
    totalMinutes: minutes(totalSec),
    todayMinutes: minutes(byDay.get(today) ?? 0),
    weekMinutes: minutes(weekSec),
    daysPracticedThisWeek: daysThisWeek,
    last7,
  };
}
