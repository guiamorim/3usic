import { describe, expect, it } from 'vitest';
import { dueSkills, mastery, updateSkill } from '../../src/domain/srs';
import { addDays } from '../../src/domain/dates';

const D0 = '2026-01-05';

describe('repetição espaçada', () => {
  it('um primeiro resultado bom agenda revisão para o dia seguinte', () => {
    const s = updateSkill(undefined, 'strings', 1, D0);
    expect(s.box).toBe(1);
    expect(s.dueDay).toBe(addDays(D0, 1));
    expect(mastery(s)).toBe('a-aprender');
  });

  it('repetir no mesmo dia não faz subir de nível (sem "empinar")', () => {
    let s = updateSkill(undefined, 'strings', 1, D0);
    s = updateSkill(s, 'strings', 1, D0);
    s = updateSkill(s, 'strings', 1, D0);
    expect(s.box).toBe(1);
    expect(s.attempts).toBe(3);
    expect(mastery(s)).toBe('a-aprender');
  });

  it('só considera dominado após sucesso consistente em dias espaçados', () => {
    let s = updateSkill(undefined, 'x', 0.9, D0);
    let day = D0;
    const seen: string[] = [];
    for (let i = 0; i < 4; i++) {
      day = s.dueDay;
      s = updateSkill(s, 'x', 0.9, day);
      seen.push(mastery(s));
    }
    expect(s.box).toBe(5);
    expect(seen.at(-1)).toBe('dominado');
    expect(seen[0]).not.toBe('dominado');
    // Intervals grow: 1, 3, 7, 14, 30 days.
    expect(s.dueDay).toBe(addDays(day, 30));
  });

  it('um mau resultado faz descer e revê no dia seguinte, sem apagar o histórico', () => {
    let s = updateSkill(undefined, 'x', 1, D0);
    s = updateSkill(s, 'x', 1, s.dueDay);
    s = updateSkill(s, 'x', 1, s.dueDay);
    expect(s.box).toBe(3);
    const failDay = s.dueDay;
    s = updateSkill(s, 'x', 0.4, failDay);
    expect(s.box).toBe(1);
    expect(s.dueDay).toBe(addDays(failDay, 1));
    expect(s.passedDays.length).toBe(3);
  });

  it('resultado intermédio mantém o nível', () => {
    let s = updateSkill(undefined, 'x', 1, D0);
    s = updateSkill(s, 'x', 0.7, s.dueDay);
    expect(s.box).toBe(1);
  });

  it('lista revisões pendentes com as mais frágeis primeiro', () => {
    const a = { ...updateSkill(undefined, 'a', 1, D0), box: 3, dueDay: D0 };
    const b = { ...updateSkill(undefined, 'b', 1, D0), box: 1, dueDay: D0 };
    const c = { ...updateSkill(undefined, 'c', 1, D0), dueDay: addDays(D0, 5) };
    expect(dueSkills([a, b, c], D0).map((s) => s.skillId)).toEqual(['b', 'a']);
    // Missed days don't pile up penalties: an overdue skill is simply due.
    expect(dueSkills([c], addDays(D0, 40)).length).toBe(1);
  });

  it('limita valores fora do intervalo', () => {
    expect(updateSkill(undefined, 'x', 7, D0).lastScore).toBe(1);
    expect(updateSkill(undefined, 'x', -1, D0).lastScore).toBe(0);
  });
});
