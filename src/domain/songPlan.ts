// Personalised plan for learning a song: which chords are missing, which changes to drill,
// whether a capo makes it easier, and the tempo ladder. Pure functions.
import { chordById, type Chord } from '../content/chords';
import { LESSONS } from '../content/curriculum';
import { matchChord, transposeSymbol } from './chordSymbols';

/** Chords the user has met in completed lessons, plus the ones they ticked as known. */
export function knownChordIds(completedLessons: ReadonlySet<string>, extra: readonly string[] = []): Set<string> {
  const known = new Set<string>(extra);
  for (const l of LESSONS) if (completedLessons.has(l.id) && l.demo.kind === 'chords') for (const id of l.demo.chordIds) known.add(id);
  return known;
}

function isKnown(chord: Chord, known: ReadonlySet<string>): boolean {
  // The full barre F implies the easier shape.
  return known.has(chord.id) || (chord.id === 'F-simples' && known.has('F'));
}

export interface SongChordInfo {
  symbol: string;
  /** Library chord to practise for this symbol, if the library has one. */
  chord: Chord | null;
  simplified: boolean;
  known: boolean;
}

export function analyzeChords(symbols: readonly string[], known: ReadonlySet<string>): SongChordInfo[] {
  return [...new Set(symbols)].map((symbol) => {
    const m = matchChord(symbol);
    const chord = m?.chord ?? null;
    return { symbol, chord, simplified: m?.simplified ?? false, known: chord !== null && isKnown(chord, known) };
  });
}

export interface Transition {
  /** Library chord ids. */
  a: string;
  b: string;
  count: number;
}

/** Changes between consecutive different chords, most frequent first (direction ignored). */
export function chordTransitions(sequence: readonly string[]): Transition[] {
  const ids = sequence.map((s) => matchChord(s)?.chord?.id ?? null);
  const counts = new Map<string, Transition>();
  let prev: string | null = null;
  for (const id of ids) {
    if (id === null) continue;
    if (prev !== null && prev !== id) {
      const [a, b] = [prev, id].sort() as [string, string];
      const key = `${a}|${b}`;
      const t = counts.get(key) ?? { a: prev, b: id, count: 0 };
      t.count++;
      counts.set(key, t);
    }
    prev = id;
  }
  return [...counts.values()].sort((x, y) => y.count - x.count);
}

function shapeCost(symbols: readonly string[], known: ReadonlySet<string>): number {
  let cost = 0;
  for (const s of new Set(symbols)) {
    const chord = matchChord(s)?.chord;
    cost += chord ? chord.difficulty + (isKnown(chord, known) ? 0 : 1) : 6;
  }
  return cost;
}

export interface CapoSuggestion {
  /** Extra capo frets on top of whatever the song already uses. */
  capo: number;
  /** Chord shapes to play with that capo, in the song's order. */
  shapes: string[];
}

/**
 * Looks for a capo position where the song can be played with easier (or already known) shapes.
 * Only suggests it if the gain is clear, to avoid noise.
 */
export function suggestCapo(symbols: readonly string[], known: ReadonlySet<string>, maxCapo = 7): CapoSuggestion | null {
  const unique = [...new Set(symbols)];
  if (unique.length === 0) return null;
  const base = shapeCost(unique, known);
  let best: CapoSuggestion | null = null;
  let bestCost = base - 2;
  for (let capo = 1; capo <= maxCapo; capo++) {
    const shapes = unique.map((s) => transposeSymbol(s, -capo));
    const cost = shapeCost(shapes, known);
    if (cost < bestCost) {
      best = { capo, shapes };
      bestCost = cost;
    }
  }
  return best;
}

export type SongStep =
  | { kind: 'learn'; chordId: string }
  | { kind: 'changes'; a: string; b: string }
  | { kind: 'slow'; bpm: number }
  | { kind: 'full'; bpm: number | null };

export interface SongPlan {
  chords: SongChordInfo[];
  /** Symbols with no matching chord in the library (shown, but not drilled). */
  unsupported: string[];
  /** 0..1: share of the song's chords the user already knows. */
  readiness: number;
  steps: SongStep[];
}

export const DEFAULT_SLOW_BPM = 60;

export function slowTempo(tempo: number | null): number {
  return tempo ? Math.max(40, Math.round((tempo * 0.6) / 5) * 5) : DEFAULT_SLOW_BPM;
}

export function buildSongPlan(input: { sequence: readonly string[]; known: ReadonlySet<string>; tempo: number | null }): SongPlan {
  const chords = analyzeChords(input.sequence, input.known);
  const playable = chords.filter((c) => c.chord !== null);
  const unsupported = chords.filter((c) => c.chord === null).map((c) => c.symbol);
  const knownCount = playable.filter((c) => c.known).length;

  const toLearn = new Map<string, Chord>();
  for (const c of playable) if (!c.known && c.chord) toLearn.set(c.chord.id, c.chord);
  const steps: SongStep[] = [...toLearn.values()]
    .sort((a, b) => a.difficulty - b.difficulty)
    .map((c) => ({ kind: 'learn' as const, chordId: c.id }));

  for (const t of chordTransitions(input.sequence).slice(0, 3)) steps.push({ kind: 'changes', a: t.a, b: t.b });
  steps.push({ kind: 'slow', bpm: slowTempo(input.tempo) });
  steps.push({ kind: 'full', bpm: input.tempo });

  return { chords, unsupported, readiness: chords.length ? knownCount / chords.length : 0, steps };
}

/** 1 (easy) .. 3 (hard), from the hardest chord the song needs. */
export function songDifficulty(symbols: readonly string[]): 1 | 2 | 3 {
  let d: 1 | 2 | 3 = 1;
  for (const s of new Set(symbols)) {
    const c = matchChord(s)?.chord;
    const v = c ? c.difficulty : 3;
    if (v > d) d = v;
  }
  return d;
}

export function chordLabel(id: string): string {
  return chordById(id)?.symbol ?? id;
}

/** One-line focus for today, from the first step of the song plan. */
export function songFocus(plan: SongPlan): string {
  const learn = plan.steps.filter((s) => s.kind === 'learn');
  const first = plan.steps[0];
  if (learn.length > 0 && first?.kind === 'learn') {
    const names = learn.slice(0, 2).map((s) => (s.kind === 'learn' ? chordLabel(s.chordId) : ''));
    return learn.length === 1 ? `aprende o acorde ${names[0]}.` : `aprende os acordes ${names.join(' e ')}${learn.length > 2 ? ' (e mais)' : ''}.`;
  }
  const change = plan.steps.find((s) => s.kind === 'changes');
  const slow = plan.steps.find((s) => s.kind === 'slow');
  const parts: string[] = [];
  if (change?.kind === 'changes') parts.push(`treina a mudança ${chordLabel(change.a)} ↔ ${chordLabel(change.b)}`);
  if (slow?.kind === 'slow') parts.push(`toca-a do início ao fim a ${slow.bpm} BPM`);
  return parts.length ? `${parts.join(' e ')}.` : 'toca-a do início ao fim.';
}
