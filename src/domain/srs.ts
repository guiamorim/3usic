// Spaced repetition with Leitner boxes. A skill only climbs one box per calendar day, so a single
// high score (or cramming) can never be mistaken for consistent mastery.
import type { SkillState } from '../storage/schema';
import { addDays, daysBetween } from './dates';

/** Days until the next review for each box. */
export const BOX_INTERVALS = [0, 1, 3, 7, 14, 30] as const;
export const PASS_SCORE = 0.8;
export const FAIL_SCORE = 0.6;

export function updateSkill(prev: SkillState | undefined, skillId: string, score: number, today: string): SkillState {
  const s = Math.min(1, Math.max(0, score));
  const base: SkillState = prev ?? { skillId, box: 0, dueDay: today, lastPracticedDay: today, passedDays: [], lastScore: 0, attempts: 0 };
  let box = base.box;
  let passedDays = base.passedDays;

  if (s >= PASS_SCORE) {
    if (!passedDays.includes(today)) {
      box = Math.min(5, box + 1);
      passedDays = [...passedDays, today].slice(-20);
    }
  } else if (s < FAIL_SCORE) {
    box = Math.max(1, box - 2);
  }

  const interval = s < FAIL_SCORE ? 1 : Math.max(1, BOX_INTERVALS[box] ?? 1);
  return {
    skillId,
    box,
    dueDay: addDays(today, interval),
    lastPracticedDay: today,
    passedDays,
    lastScore: s,
    attempts: base.attempts + 1,
  };
}

export type Mastery = 'novo' | 'a-aprender' | 'a-consolidar' | 'dominado';

export const MASTERY_LABEL: Record<Mastery, string> = {
  novo: 'Novo',
  'a-aprender': 'A aprender',
  'a-consolidar': 'A consolidar',
  dominado: 'Dominado',
};

export function mastery(skill: SkillState | undefined): Mastery {
  if (!skill || skill.attempts === 0) return 'novo';
  const distinctPassDays = new Set(skill.passedDays).size;
  if (skill.box >= 4 && distinctPassDays >= 4 && skill.lastScore >= PASS_SCORE) return 'dominado';
  if (skill.box >= 2 && distinctPassDays >= 2) return 'a-consolidar';
  return 'a-aprender';
}

export function isDue(skill: SkillState, today: string): boolean {
  return daysBetween(skill.dueDay, today) >= 0;
}

/** Skills due for review, most fragile first. */
export function dueSkills(skills: readonly SkillState[], today: string): SkillState[] {
  return skills
    .filter((s) => isDue(s, today))
    .sort((a, b) => a.box - b.box || a.dueDay.localeCompare(b.dueDay));
}
