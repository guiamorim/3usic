import { describe, expect, it } from 'vitest';
import { EXERCISES, generateReview, scoreOf, seededRng } from '../../src/domain/exercises';
import { fretPitchClass } from '../../src/domain/guitar';
import { chordById } from '../../src/content/chords';

describe('exercícios', () => {
  const quizzes = EXERCISES.filter((e) => e.kind === 'quiz');

  it.each(quizzes.map((e) => [e.id, e] as const))('%s gera perguntas válidas e determinísticas', (_id, ex) => {
    for (let seed = 1; seed <= 25; seed++) {
      const qs = ex.generate!(seededRng(seed), ex.questionCount);
      expect(qs).toHaveLength(ex.questionCount);
      for (const q of qs) {
        expect(q.options).toContain(q.answer);
        expect(new Set(q.options).size).toBe(q.options.length);
        expect(q.options.length).toBeGreaterThanOrEqual(3);
        expect(q.explanation.length).toBeGreaterThan(10);
      }
      expect(ex.generate!(seededRng(seed), ex.questionCount)).toEqual(qs);
    }
  });

  it('as respostas das notas no braço são musicalmente corretas', () => {
    const ex = EXERCISES.find((e) => e.id === 'notas-graves')!;
    for (let seed = 1; seed <= 20; seed++) {
      for (const q of ex.generate!(seededRng(seed), 10)) {
        if (q.visual.kind !== 'fretboard') throw new Error('visual esperado');
        const pc = fretPitchClass(q.visual.string, q.visual.fret).replace('#', '♯');
        expect(q.answer.startsWith(pc + ' ')).toBe(true);
      }
    }
  });

  it('as respostas do reconhecimento de acordes correspondem ao diagrama', () => {
    const ex = EXERCISES.find((e) => e.id === 'acordes-abertos')!;
    for (const q of ex.generate!(seededRng(7), 30)) {
      if (q.visual.kind !== 'chord') throw new Error('visual esperado');
      expect(chordById(q.visual.chordId)!.symbol).toBe(q.answer);
    }
  });

  it('o intervalo indicado corresponde às notas tocadas', () => {
    const ex = EXERCISES.find((e) => e.id === 'intervalos')!;
    const bySemis: Record<number, string> = { 2: 'Segunda maior', 3: 'Terceira menor', 4: 'Terceira maior', 5: 'Quarta perfeita', 7: 'Quinta perfeita', 12: 'Oitava' };
    for (const q of ex.generate!(seededRng(3), 40)) {
      if (q.visual.kind !== 'interval') throw new Error('visual esperado');
      expect(q.answer).toBe(bySemis[q.visual.midi[1] - q.visual.midi[0]]);
    }
  });

  it('a revisão intercala exercícios pendentes', () => {
    const r = generateReview(seededRng(1), ['cordas', 'ritmo'], 10);
    expect(r).toHaveLength(10);
    expect(new Set(r.map((x) => x.skillId))).toEqual(new Set(['strings', 'rhythm-values']));
    expect(generateReview(seededRng(1), ['inexistente'])).toEqual([]);
  });

  it('calcula a pontuação', () => {
    expect(scoreOf(4, 5)).toBe(0.8);
    expect(scoreOf(0, 0)).toBe(0);
  });
});
