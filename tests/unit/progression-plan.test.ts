import { describe, expect, it } from 'vitest';
import { LESSONS, MODULES } from '../../src/content/curriculum';
import { EXERCISES, exerciseById } from '../../src/domain/exercises';
import { chordById } from '../../src/content/chords';
import { lessonStatus, missingPrerequisites, moduleProgress, overallProgress, recommendedLesson } from '../../src/domain/progression';
import { buildDailyPlan, splitMinutes } from '../../src/domain/plan';
import { practiceStats } from '../../src/domain/stats';
import { updateSkill } from '../../src/domain/srs';

describe('currículo — integridade', () => {
  it('cada lição tem todos os elementos pedagógicos', () => {
    for (const l of LESSONS) {
      expect(l.objective.length, l.id).toBeGreaterThan(10);
      expect(l.explanation.length, l.id).toBeGreaterThan(1);
      expect(l.practice.steps.length, l.id).toBeGreaterThan(1);
      expect(l.completion.length, l.id).toBeGreaterThan(10);
      expect(l.mistakes.length, l.id).toBeGreaterThan(0);
      expect(MODULES.some((m) => m.id === l.moduleId), l.id).toBe(true);
    }
  });

  it('pré-requisitos existem e vêm antes (sem ciclos)', () => {
    const order = new Map(LESSONS.map((l, i) => [l.id, i]));
    for (const l of LESSONS) for (const p of l.prerequisites) {
      expect(order.has(p), `${l.id} → ${p}`).toBe(true);
      expect(order.get(p)!).toBeLessThan(order.get(l.id)!);
    }
  });

  it('referências a exercícios e acordes são válidas', () => {
    for (const l of LESSONS) {
      if (l.practice.exerciseId) expect(exerciseById(l.practice.exerciseId), l.id).toBeDefined();
      if (l.demo.kind === 'chords') for (const c of l.demo.chordIds) expect(chordById(c), `${l.id} ${c}`).toBeDefined();
      if (l.demo.kind === 'tab') {
        expect(l.demo.lines).toHaveLength(6);
        const len = l.demo.lines[0]!.length;
        for (const line of l.demo.lines) expect(line.length, l.id).toBe(len);
      }
      if (l.demo.kind === 'strum') expect(l.demo.counts.length).toBe(l.demo.strokes.length);
    }
    expect(EXERCISES.length).toBeGreaterThan(5);
  });

  it('todos os 9 módulos têm lições', () => {
    expect(MODULES).toHaveLength(9);
    for (const m of MODULES) expect(LESSONS.some((l) => l.moduleId === m.id)).toBe(true);
  });
});

describe('progressão de lições', () => {
  it('recomenda a primeira lição a um principiante', () => {
    expect(recommendedLesson(new Set(), 'none')?.id).toBe('l1-1');
  });

  it('avança para a lição seguinte cujos pré-requisitos estão cumpridos', () => {
    const done = new Set(['l1-1']);
    expect(recommendedLesson(done, 'none')?.id).toBe('l1-2');
    done.add('l1-2');
    expect(recommendedLesson(done, 'none')?.id).toBe('l2-1');
  });

  it('adapta o ponto de partida à experiência', () => {
    expect(recommendedLesson(new Set(), 'some')?.moduleId).toBe('m3');
    expect(recommendedLesson(new Set(), 'intermediate')?.moduleId).toBe('m6');
    const first = LESSONS[0]!;
    expect(lessonStatus(first, new Set(), 'some')).toBe('opcional');
  });

  it('não bloqueia lições: só avisa dos pré-requisitos em falta', () => {
    const l = LESSONS.find((x) => x.id === 'l4-3')!;
    expect(lessonStatus(l, new Set(), 'none')).toBe('falta-base');
    expect(missingPrerequisites(l, new Set(), 'none').map((x) => x.id)).toEqual(['l4-2']);
  });

  it('calcula progresso por módulo e global', () => {
    const done = new Set(['l1-1', 'l1-2']);
    expect(moduleProgress('m1', done)).toEqual({ done: 2, total: 2 });
    expect(overallProgress(done)).toBeCloseTo(2 / LESSONS.length);
  });

  it('quando tudo está concluído não há recomendação', () => {
    expect(recommendedLesson(new Set(LESSONS.map((l) => l.id)), 'none')).toBeNull();
  });
});

describe('plano de estudo', () => {
  const base = { today: '2026-03-02', completedLessons: new Set<string>(), recommended: LESSONS[0]!, skills: [] };

  it('a soma dos blocos é exatamente o tempo disponível', () => {
    for (const m of [5, 10, 15, 20, 30, 45, 60]) {
      const plan = buildDailyPlan({ ...base, profile: { sessionMinutes: m, goal: 'chords-songs' } });
      expect(plan.reduce((s, b) => s + b.minutes, 0), `${m} min`).toBe(m);
      expect(plan.every((b) => b.minutes >= 1)).toBe(true);
    }
  });

  it('combina aquecimento, técnica, conteúdo novo e aplicação', () => {
    const plan = buildDailyPlan({ ...base, profile: { sessionMinutes: 30, goal: 'fingerstyle' } });
    expect(plan.map((b) => b.id)).toEqual(['aquecimento', 'tecnica', 'novo', 'aplicacao']);
  });

  it('inclui revisão quando há competências pendentes', () => {
    const skill = updateSkill(undefined, 'strings', 1, '2026-03-01');
    const plan = buildDailyPlan({ ...base, skills: [skill], profile: { sessionMinutes: 20, goal: 'theory-ear' } });
    expect(plan.map((b) => b.id)).toContain('revisao');
  });

  it('não acumula atrasos: depois de semanas sem praticar o plano tem o mesmo tamanho', () => {
    const skill = updateSkill(undefined, 'strings', 1, '2026-01-01');
    const plan = buildDailyPlan({ ...base, today: '2026-06-01', skills: [skill], profile: { sessionMinutes: 15, goal: 'chords-songs' } });
    expect(plan.reduce((s, b) => s + b.minutes, 0)).toBe(15);
  });

  it('splitMinutes nunca devolve blocos de zero minutos', () => {
    expect(splitMinutes(5, [15, 20, 20, 30, 15])).toEqual([1, 1, 1, 1, 1]);
    expect(splitMinutes(10, [1, 1, 1]).reduce((a, b) => a + b, 0)).toBe(10);
  });
});

describe('estatísticas de prática', () => {
  it('soma minutos por dia, semana e total', () => {
    const entries = [
      { id: '1', day: '2026-03-02', seconds: 600, source: 'exercise' as const, label: '' },
      { id: '2', day: '2026-03-02', seconds: 300, source: 'metronome' as const, label: '' },
      { id: '3', day: '2026-03-04', seconds: 1200, source: 'lesson' as const, label: '' },
      { id: '4', day: '2026-02-20', seconds: 600, source: 'lesson' as const, label: '' },
    ];
    const s = practiceStats(entries, '2026-03-04');
    expect(s.todayMinutes).toBe(20);
    expect(s.weekMinutes).toBe(35);
    expect(s.daysPracticedThisWeek).toBe(2);
    expect(s.totalMinutes).toBe(45);
    expect(s.last7).toHaveLength(7);
    expect(s.last7.at(-1)).toEqual({ day: '2026-03-04', minutes: 20 });
  });
});

describe('plano diário com música objetivo', () => {
  const base = { today: '2026-06-01', completedLessons: new Set<string>(), recommended: null, skills: [] };
  it('substitui a aplicação genérica pela música, mesmo em sessões curtas', () => {
    const targetSong = { title: 'Let It Be', route: '#/musicas/let-it-be', focus: 'aprende o acorde F.' };
    for (const m of [10, 30]) {
      const plan = buildDailyPlan({ ...base, targetSong, profile: { sessionMinutes: m, goal: 'chords-songs' } });
      const app = plan.find((b) => b.id === 'aplicacao');
      expect(app?.title).toBe('Música objetivo');
      expect(app?.route).toBe('#/musicas/let-it-be');
      expect(plan.reduce((s, b) => s + b.minutes, 0)).toBe(m);
    }
  });
});
