// Daily study plan. Rebuilt every day from the current state, so missing a day never creates a
// backlog or a "broken streak" — the plan simply starts fresh.
import type { Lesson } from '../content/curriculum';
import type { Goal, PlanDay, Profile, SkillState } from '../storage/schema';
import { dueSkills } from './srs';
import { exerciseBySkill } from './exercises';

export type BlockKind = 'aquecimento' | 'revisao' | 'tecnica' | 'novo' | 'aplicacao';

export interface PlanBlock {
  id: BlockKind;
  title: string;
  description: string;
  minutes: number;
  /** Hash route to open the activity. */
  route: string;
}

export interface PlanInput {
  profile: Pick<Profile, 'sessionMinutes' | 'goal'>;
  today: string;
  completedLessons: ReadonlySet<string>;
  recommended: Lesson | null;
  skills: readonly SkillState[];
  /** Song the user is working towards; replaces the generic application block. */
  targetSong?: { title: string; route: string; focus: string };
}

const APPLICATION_BY_GOAL: Record<Goal, { text: string; route: string }> = {
  'chords-songs': { text: 'Toca uma progressão que já conheces (por exemplo G – D – Em – C) com o metrónomo, sem parar.', route: '#/metronomo' },
  'melody-riffs': { text: 'Toca uma melodia ou riff das lições concluídas, primeiro devagar e depois a tempo.', route: '#/aprender' },
  fingerstyle: { text: 'Dedilha uma progressão conhecida com o padrão p–i–m–a, com o metrónomo lento.', route: '#/metronomo' },
  'theory-ear': { text: 'Escolhe um acorde da biblioteca, identifica as suas notas e toca-as uma a uma.', route: '#/acordes' },
};

/** Splits `total` minutes by weights, guaranteeing integer minutes that add up to `total`. */
export function splitMinutes(total: number, weights: readonly number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (total * w) / sum);
  const floors = raw.map((r) => Math.max(1, Math.floor(r)));
  let diff = total - floors.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => ({ i, frac: r - Math.floor(r) })).sort((a, b) => b.frac - a.frac);
  let k = 0;
  while (diff !== 0 && order.length) {
    const idx = (order[k % order.length] as { i: number }).i;
    if (diff > 0) {
      floors[idx] = (floors[idx] ?? 0) + 1;
      diff--;
    } else if ((floors[idx] ?? 0) > 1) {
      floors[idx] = (floors[idx] ?? 0) - 1;
      diff++;
    }
    k++;
    if (k > 1000) break;
  }
  return floors;
}

export function buildDailyPlan(input: PlanInput): PlanBlock[] {
  const { profile, today, completedLessons, recommended, skills, targetSong } = input;
  const total = profile.sessionMinutes;
  const due = dueSkills(skills, today);
  const hasChords = completedLessons.has('l4-2') || completedLessons.has('l4-1');
  const short = total <= 10;

  const blocks: Omit<PlanBlock, 'minutes'>[] = [];
  const weights: number[] = [];

  blocks.push({
    id: 'aquecimento',
    title: 'Aquecimento',
    description: completedLessons.has('l3-2')
      ? 'Exercício cromático 1-2-3-4 com o metrónomo a um andamento confortável.'
      : 'Afina o instrumento e toca as cordas soltas alternando a palhetada, a 60 BPM.',
    route: completedLessons.has('l3-2') ? '#/metronomo' : '#/afinador',
  });
  weights.push(15);

  if (due.length > 0) {
    const names = due
      .slice(0, 3)
      .map((s) => exerciseBySkill(s.skillId)?.title)
      .filter(Boolean)
      .join(', ');
    blocks.push({ id: 'revisao', title: 'Revisão', description: `Tens ${due.length} competência(s) para rever: ${names}.`, route: '#/praticar/revisao' });
    weights.push(20);
  }

  if (!short || due.length === 0) {
    blocks.push({
      id: 'tecnica',
      title: 'Técnica',
      description: hasChords
        ? 'Mudanças de acordes num minuto: escolhe o par que te custa mais.'
        : 'Notas na primeira posição: diz o nome de cada nota enquanto a tocas.',
      route: hasChords ? '#/praticar/mudancas' : '#/praticar/notas-1a-posicao',
    });
    weights.push(20);
  }

  if (recommended) {
    blocks.push({ id: 'novo', title: 'Conteúdo novo', description: `Lição: ${recommended.title}.`, route: `#/aprender/${recommended.id}` });
    weights.push(30);
  }

  if (targetSong) {
    blocks.push({ id: 'aplicacao', title: 'Música objetivo', description: `«${targetSong.title}»: ${targetSong.focus}`, route: targetSong.route });
    weights.push(short ? 10 : 20);
  } else if (!short) {
    const app = APPLICATION_BY_GOAL[profile.goal];
    blocks.push({ id: 'aplicacao', title: 'Aplicação musical', description: app.text, route: app.route });
    weights.push(15);
  }

  const minutes = splitMinutes(total, weights);
  return blocks.map((b, i) => ({ ...b, minutes: minutes[i] ?? 1 }));
}

export function planCompletion(blocks: readonly PlanBlock[], planDay: PlanDay | undefined): { done: number; total: number } {
  const doneIds = new Set(planDay?.doneBlockIds ?? []);
  return { done: blocks.filter((b) => doneIds.has(b.id)).length, total: blocks.length };
}

/**
 * Next step to do: the first unfinished block after `currentId` (in plan order), wrapping around
 * to unfinished blocks before it. Null when everything is done.
 */
export function nextBlock(plan: readonly PlanBlock[], done: ReadonlySet<string>, currentId?: string): PlanBlock | null {
  const start = currentId ? plan.findIndex((b) => b.id === currentId) + 1 : 0;
  for (let i = 0; i < plan.length; i++) {
    const b = plan[(start + i) % plan.length];
    if (b && b.id !== currentId && !done.has(b.id)) return b;
  }
  return null;
}
