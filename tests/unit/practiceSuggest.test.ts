import { describe, expect, it } from 'vitest';
import { suggestPractice } from '../../src/domain/practiceSuggest';
import type { SkillState } from '../../src/storage/schema';

const ex = [
  { id: 'a', skillId: 'sa', kind: 'quiz' },
  { id: 'b', skillId: 'sb', kind: 'quiz' },
  { id: 'm', skillId: 'sm', kind: 'chord-changes' },
];
const skill = (skillId: string, over: Partial<SkillState> = {}): SkillState => ({
  skillId,
  box: 1,
  dueDay: '2026-11-05',
  lastPracticedDay: '2026-10-30',
  passedDays: [],
  lastScore: 0.5,
  attempts: 1,
  ...over,
});

describe('suggestPractice', () => {
  it('suggests the first exercise for a new user', () => {
    expect(suggestPractice(ex, [], '2026-10-31')).toEqual({ kind: 'exercise', id: 'a' });
  });
  it('prefers an exercise being learnt over a new one', () => {
    expect(suggestPractice(ex, [skill('sb')], '2026-10-31')).toEqual({ kind: 'exercise', id: 'b' });
  });
  it('due reviews come first', () => {
    expect(suggestPractice(ex, [skill('sb', { dueDay: '2026-10-31' })], '2026-10-31')).toEqual({ kind: 'review', count: 1 });
  });
  it('nothing to suggest when everything is mastered', () => {
    const done = { box: 5, passedDays: ['2026-10-01', '2026-10-05', '2026-10-12', '2026-10-25'], lastScore: 1, dueDay: '2026-12-01' };
    expect(suggestPractice(ex, [skill('sa', done), skill('sb', done)], '2026-10-31')).toBeNull();
  });
});
