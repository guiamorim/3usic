// Visible rewards for practising: a forgiving streak and a few milestones, all derived from data
// already stored (no new schema). Pure functions so they can be tested.
import type { AppData } from '../storage/schema';
import { addDays, daysBetween, localDay } from './dates';

/** A day counts as practised from this many seconds of logged practice. */
export const PRACTICE_DAY_SECONDS = 60;

export function practiceDays(practice: AppData['practice']): string[] {
  const byDay = new Map<string, number>();
  for (const e of practice) byDay.set(e.day, (byDay.get(e.day) ?? 0) + e.seconds);
  return [...byDay]
    .filter(([, s]) => s >= PRACTICE_DAY_SECONDS)
    .map(([d]) => d)
    .sort();
}

export interface Streak {
  /** Practised days in the current run (a single missed day does not break it). */
  days: number;
  /** True if today is already practised. */
  today: boolean;
  /** Yesterday was missed: practising today keeps the run, missing it ends it. */
  atRisk: boolean;
}

/**
 * Forgiving streak: one missed day between practised days is tolerated, two in a row end the run.
 * Counts practised days only, so the number never rewards a skipped day.
 */
export function streak(days: readonly string[], today: string): Streak {
  const set = new Set(days.filter((d) => d <= today));
  const last = [...set].sort().at(-1);
  if (!last || daysBetween(last, today) > 2) return { days: 0, today: false, atRisk: false };
  let count = 0;
  let cursor = last;
  for (;;) {
    count++;
    if (set.has(addDays(cursor, -1))) cursor = addDays(cursor, -1);
    else if (set.has(addDays(cursor, -2))) cursor = addDays(cursor, -2);
    else break;
  }
  return { days: count, today: set.has(today), atRisk: daysBetween(last, today) === 2 };
}

/** Longest run ever, with the day each length was first reached (for milestone dates). */
function streakReachedOn(days: readonly string[], length: number): string | null {
  const sorted = [...new Set(days)].sort();
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && daysBetween(prev, d) <= 2 ? run + 1 : 1;
    if (run >= length) return d;
    prev = d;
  }
  return null;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  /** Day it was reached, or null if not yet. */
  day: string | null;
}

const minDay = (days: (string | undefined)[]): string | null => days.filter((d): d is string => !!d).sort()[0] ?? null;
const isoDay = (iso: string) => localDay(new Date(iso));

/** Milestones in the order a beginner usually reaches them. */
export function milestones(data: AppData, lessonsByModule: (moduleId: string) => readonly { id: string }[]): Milestone[] {
  const days = practiceDays(data.practice);
  const lessonDay = new Map(data.lessons.map((l) => [l.lessonId, isoDay(l.completedAt)]));

  let total = 0;
  let hourDay: string | null = null;
  for (const e of [...data.practice].sort((a, b) => a.day.localeCompare(b.day))) {
    total += e.seconds;
    if (total >= 3600) {
      hourDay = e.day;
      break;
    }
  }
  const moduleDone = (id: string): string | null => {
    const ls = lessonsByModule(id);
    if (ls.length === 0 || ls.some((l) => !lessonDay.has(l.id))) return null;
    return (
      ls
        .map((l) => lessonDay.get(l.id) ?? '')
        .sort()
        .at(-1) ?? null
    );
  };

  return [
    { id: 'primeira-sessao', title: 'Primeira sessão', description: 'Praticaste pela primeira vez.', day: days[0] ?? null },
    { id: 'primeira-licao', title: 'Primeira lição', description: 'Concluíste uma lição.', day: minDay([...lessonDay.values()]) },
    {
      id: 'pontuacao-perfeita',
      title: 'Sem erros',
      description: 'Acertaste todas as perguntas de um exercício.',
      day: minDay(data.attempts.filter((a) => a.correct === a.total).map((a) => isoDay(a.at))),
    },
    { id: 'tres-dias', title: '3 dias seguidos', description: 'Praticaste 3 dias seguidos (pode faltar um dia pelo meio).', day: streakReachedOn(days, 3) },
    { id: 'uma-hora', title: '1 hora de prática', description: 'Somaste 60 minutos de prática.', day: hourDay },
    { id: 'primeiros-acordes', title: 'Primeiros acordes', description: 'Concluíste o módulo «Acordes básicos e mudanças».', day: moduleDone('m4') },
    { id: 'mudancas-30', title: '30 mudanças', description: 'Fizeste 30 mudanças de acorde num minuto.', day: minDay(data.chordChanges.filter((c) => c.changes >= 30).map((c) => c.day)) },
    {
      id: 'primeira-musica',
      title: 'Primeira música',
      description: 'Praticaste uma música (no plano da música ou no Tocar junto).',
      day: minDay(data.practice.filter((p) => p.source === 'song').map((p) => p.day)),
    },
    { id: 'sete-dias', title: '7 dias seguidos', description: 'Uma semana de prática (pode faltar um dia pelo meio).', day: streakReachedOn(days, 7) },
  ];
}
