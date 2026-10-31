import { describe, expect, it } from 'vitest';
import { milestones, practiceDays, streak } from '../../src/domain/achievements';
import type { AppData } from '../../src/storage/schema';

const empty: AppData = { profile: null, settings: null, lessons: [], skills: [], attempts: [], practice: [], chordChanges: [], planDays: [], songs: [] };
const entry = (day: string, seconds = 300, source: AppData['practice'][number]['source'] = 'exercise') => ({ id: `${day}-${source}-${seconds}`, day, seconds, source, label: '' });

describe('streak', () => {
  it('is zero with no practice', () => {
    expect(streak([], '2026-10-31')).toEqual({ days: 0, today: false, atRisk: false });
  });

  it('counts consecutive days ending today or yesterday', () => {
    expect(streak(['2026-10-29', '2026-10-30', '2026-10-31'], '2026-10-31')).toEqual({ days: 3, today: true, atRisk: false });
    expect(streak(['2026-10-29', '2026-10-30'], '2026-10-31')).toEqual({ days: 2, today: false, atRisk: false });
  });

  it('tolerates a single missed day but warns', () => {
    expect(streak(['2026-10-26', '2026-10-28', '2026-10-29'], '2026-10-31')).toEqual({ days: 3, today: false, atRisk: true });
  });

  it('two missed days in a row end the run', () => {
    expect(streak(['2026-10-25', '2026-10-28'], '2026-10-28').days).toBe(1);
    expect(streak(['2026-10-25'], '2026-10-31').days).toBe(0);
  });

  it('a day needs at least a minute of practice', () => {
    expect(practiceDays([entry('2026-10-30', 30), entry('2026-10-31', 40), entry('2026-10-31', 30)])).toEqual(['2026-10-31']);
  });
});

describe('milestones', () => {
  const lessons = (id: string) => (id === 'm4' ? [{ id: 'a' }, { id: 'b' }] : []);

  it('none reached for a new user', () => {
    expect(milestones(empty, lessons).every((m) => m.day === null)).toBe(true);
  });

  it('dates each milestone from stored data', () => {
    const data: AppData = {
      ...empty,
      practice: [entry('2026-10-20', 1800), entry('2026-10-21', 1800), entry('2026-10-22', 120, 'song')],
      lessons: [
        { lessonId: 'a', completedAt: '2026-10-20T10:00:00.000Z' },
        { lessonId: 'b', completedAt: '2026-10-22T10:00:00.000Z' },
      ],
      attempts: [{ id: 'x', skillId: 's', at: '2026-10-21T10:00:00.000Z', correct: 8, total: 8, durationSec: 60 }],
      chordChanges: [{ id: 'c', pair: 'G-C', day: '2026-10-22', changes: 31 }],
    };
    const by = Object.fromEntries(milestones(data, lessons).map((m) => [m.id, m.day]));
    expect(by['primeira-sessao']).toBe('2026-10-20');
    expect(by['primeira-licao']).toBe('2026-10-20');
    expect(by['pontuacao-perfeita']).toBe('2026-10-21');
    expect(by['uma-hora']).toBe('2026-10-21');
    expect(by['tres-dias']).toBe('2026-10-22');
    expect(by['primeiros-acordes']).toBe('2026-10-22');
    expect(by['mudancas-30']).toBe('2026-10-22');
    expect(by['primeira-musica']).toBe('2026-10-22');
    expect(by['sete-dias']).toBeNull();
  });
});
