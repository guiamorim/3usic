// «Treino de hoje» on the Praticar screen: one clear next exercise instead of a list to choose from.
import type { SkillState } from '../storage/schema';
import { dueSkills, mastery, type Mastery } from './srs';

const ORDER: Record<Mastery, number> = { 'a-aprender': 0, novo: 1, 'a-consolidar': 2, dominado: 3 };

export type PracticeSuggestion = { kind: 'review'; count: number } | { kind: 'exercise'; id: string } | null;

/**
 * Due reviews first (spaced repetition works only if reviews happen on time); otherwise the first
 * exercise, in curriculum order, that is being learnt, then the first new one, then one to consolidate.
 */
export function suggestPractice(exercises: readonly { id: string; skillId: string; kind: string }[], skills: readonly SkillState[], today: string): PracticeSuggestion {
  const due = dueSkills(skills, today);
  if (due.length > 0) return { kind: 'review', count: due.length };
  let best: { id: string; rank: number } | null = null;
  for (const e of exercises) {
    if (e.kind !== 'quiz') continue;
    const rank = ORDER[mastery(skills.find((s) => s.skillId === e.skillId))];
    if (rank < 3 && (!best || rank < best.rank)) best = { id: e.id, rank };
  }
  return best ? { kind: 'exercise', id: best.id } : null;
}
