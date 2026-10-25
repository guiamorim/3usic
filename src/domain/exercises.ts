// Question generators for the practice exercises. All generators are pure given an RNG,
// so they can be tested deterministically.
import { chordById, chordFullName } from '../content/chords';
import { STANDARD_TUNING, fretPitchClass, stringByNumber } from './guitar';
import { PITCH_CLASSES, SOLFEGE, type PitchClass } from './notes';
import {
  NOTE_VALUES,
  diatonicChords,
  intervalBySemitones,
  spell,
  spelledMajorScale,
  spelledTriad,
  totalBeats,
  type NoteValue,
} from './theory';

export type Rng = () => number;

export function seededRng(seed: number): Rng {
  let s = seed >>> 0 || 1;
  return () => {
    // mulberry32
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: Rng, list: readonly T[]): T {
  const item = list[Math.floor(rng() * list.length)];
  if (item === undefined) throw new Error('Lista vazia');
  return item;
}

export function shuffle<T>(rng: Rng, list: readonly T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

/** Correct answer plus distinct distractors, shuffled. */
function options(rng: Rng, answer: string, pool: readonly string[], count = 4): string[] {
  const distractors = shuffle(
    rng,
    pool.filter((p) => p !== answer),
  ).slice(0, count - 1);
  return shuffle(rng, [answer, ...distractors]);
}

export type Visual =
  | { kind: 'fretboard'; string: number; fret: number }
  | { kind: 'chord'; chordId: string }
  | { kind: 'rhythm'; values: NoteValue[] }
  | { kind: 'interval'; midi: [number, number]; noteNames: [string, string] }
  | { kind: 'none' };

export interface Question {
  id: string;
  prompt: string;
  visual: Visual;
  options: string[];
  answer: string;
  explanation: string;
}

const pcLabel = (pc: PitchClass) => `${pc.replace('#', '♯')} · ${SOLFEGE[pc]}`;
const NATURAL_PCS = PITCH_CLASSES.filter((p) => !p.includes('#'));
const ALL_PC_LABELS = PITCH_CLASSES.map(pcLabel);

// ---------- Generators ----------

function stringsQuestion(rng: Rng, i: number): Question {
  const s = pick(rng, STANDARD_TUNING);
  const ask = rng() < 0.5;
  if (ask) {
    return {
      id: `strings-${i}`,
      prompt: `Qual é a nota da ${s.number}.ª corda solta?`,
      visual: { kind: 'fretboard', string: s.number, fret: 0 },
      options: options(rng, pcLabel(s.pitchClass), NATURAL_PCS.map(pcLabel)),
      answer: pcLabel(s.pitchClass),
      explanation: `A ${s.number}.ª corda é ${s.label}. Da mais grave para a mais aguda: Mi, Lá, Ré, Sol, Si, Mi.`,
    };
  }
  const labels = STANDARD_TUNING.map((g) => `${g.number}.ª corda`);
  return {
    id: `strings-${i}`,
    prompt: `Que corda é ${s.label}?`,
    visual: { kind: 'none' },
    options: options(rng, `${s.number}.ª corda`, labels),
    answer: `${s.number}.ª corda`,
    explanation: `As cordas contam-se da mais fina (1.ª, Mi agudo) para a mais grossa (6.ª, Mi grave). ${s.label} é a ${s.number}.ª.`,
  };
}

function noteQuestion(rng: Rng, i: number, strings: readonly number[], maxFret: number): Question {
  const stringNumber = pick(rng, strings);
  const fret = Math.floor(rng() * (maxFret + 1));
  const pc = fretPitchClass(stringNumber, fret);
  const open = stringByNumber(stringNumber);
  return {
    id: `note-${i}`,
    prompt: `Que nota soa na ${fret === 0 ? 'corda solta' : `${fret}.ª casa`} da ${stringNumber}.ª corda?`,
    visual: { kind: 'fretboard', string: stringNumber, fret },
    options: options(rng, pcLabel(pc), ALL_PC_LABELS),
    answer: pcLabel(pc),
    explanation:
      fret === 0
        ? `A ${stringNumber}.ª corda solta é ${pcLabel(pc)}.`
        : `A corda solta é ${pcLabel(open.pitchClass)}. Cada casa sobe meio-tom: ${fret} meio(s)-tom(ns) acima dá ${pcLabel(pc)}. Lembra-te: entre Mi–Fá e Si–Dó há só meio-tom.`,
  };
}

function chordIdQuestion(rng: Rng, i: number, chordIds: readonly string[]): Question {
  const chord = chordById(pick(rng, chordIds));
  if (!chord) throw new Error('Acorde inexistente');
  const pool = chordIds.map((id) => chordById(id)?.symbol ?? id);
  return {
    id: `chord-${i}`,
    prompt: 'Que acorde mostra o diagrama?',
    visual: { kind: 'chord', chordId: chord.id },
    options: options(rng, chord.symbol, [...new Set(pool)]),
    answer: chord.symbol,
    explanation: `É ${chord.symbol} (${chordFullName(chord)}). ${chord.tip}`,
  };
}

const BASIC_INTERVALS = [2, 3, 4, 5, 7, 12] as const;

function intervalQuestion(rng: Rng, i: number): Question {
  const semis = pick(rng, BASIC_INTERVALS);
  const low = 48 + Math.floor(rng() * 12); // C3..B3
  const info = intervalBySemitones(semis);
  const pool = BASIC_INTERVALS.map((s) => intervalBySemitones(s).name);
  const a = PITCH_CLASSES[low % 12] as PitchClass;
  const b = PITCH_CLASSES[(low + semis) % 12] as PitchClass;
  return {
    id: `interval-${i}`,
    prompt: 'Ouve as duas notas (ou consulta-as) e identifica o intervalo.',
    visual: { kind: 'interval', midi: [low, low + semis], noteNames: [pcLabel(a), pcLabel(b)] },
    options: options(rng, info.name, pool),
    answer: info.name,
    explanation: `${pcLabel(a)} → ${pcLabel(b)} = ${semis} meios-tons = ${info.name}.`,
  };
}

const RHYTHM_BARS: readonly NoteValue[][] = [
  ['seminima', 'seminima', 'seminima', 'seminima'],
  ['minima', 'seminima', 'seminima'],
  ['minima', 'minima'],
  ['semibreve'],
  ['seminima', 'colcheia', 'colcheia', 'minima'],
  ['colcheia', 'colcheia', 'colcheia', 'colcheia', 'minima'],
  ['seminima', 'seminima', 'minima'],
  ['colcheia', 'colcheia', 'seminima', 'colcheia', 'colcheia', 'seminima'],
  ['seminima', 'seminima', 'colcheia', 'colcheia'],
  ['minima', 'colcheia', 'colcheia'],
  ['seminima', 'colcheia', 'colcheia', 'seminima'],
  ['minima', 'seminima'],
];

function rhythmQuestion(rng: Rng, i: number): Question {
  if (rng() < 0.4) {
    const key = pick(rng, Object.keys(NOTE_VALUES) as NoteValue[]);
    const v = NOTE_VALUES[key];
    const fmt = (n: number) => String(n).replace('.', ',');
    return {
      id: `rhythm-${i}`,
      prompt: `Num compasso 4/4, quantos tempos dura uma ${v.label.toLowerCase()}?`,
      visual: { kind: 'rhythm', values: [key] },
      options: options(rng, fmt(v.beats), ['4', '2', '1', '0,5', '0,25']),
      answer: fmt(v.beats),
      explanation: `Em 4/4 a semínima vale 1 tempo. A ${v.label.toLowerCase()} vale ${fmt(v.beats)}.`,
    };
  }
  const bar = pick(rng, RHYTHM_BARS);
  const beats = totalBeats(bar);
  const fmt = (n: number) => String(n).replace('.', ',');
  return {
    id: `rhythm-${i}`,
    prompt: 'Quantos tempos somam estas figuras?',
    visual: { kind: 'rhythm', values: bar },
    options: options(rng, fmt(beats), ['2', '3', '4', '5', '3,5', '2,5']),
    answer: fmt(beats),
    explanation: bar.map((v) => `${NOTE_VALUES[v].label} (${fmt(NOTE_VALUES[v].beats)})`).join(' + ') + ` = ${fmt(beats)} tempos.`,
  };
}

const THEORY_KEYS = ['C', 'G', 'D', 'A', 'E', 'F'] as const;

function theoryChordTonesQuestion(rng: Rng, i: number): Question {
  const root = pick(rng, ['C', 'D', 'E', 'F', 'G', 'A'] as const);
  const quality = rng() < 0.5 ? 'major' : 'minor';
  const fmt = (notes: readonly string[]) => notes.join(' – ');
  const answer = fmt(spelledTriad(root, quality));
  const wrongQuality = fmt(spelledTriad(root, quality === 'major' ? 'minor' : 'major'));
  const wrongFifth = fmt(spelledTriad(root, quality === 'major' ? 'aug' : 'dim'));
  const wrongSus = fmt([spell(root, 0, 0), spell(root, 3, 5), spell(root, 4, 7)]);
  const symbol = `${root}${quality === 'minor' ? 'm' : ''}`;
  return {
    id: `theory-${i}`,
    prompt: `Que notas formam o acorde ${symbol}?`,
    visual: { kind: 'none' },
    options: shuffle(rng, [answer, wrongQuality, wrongFifth, wrongSus]),
    answer,
    explanation: `Uma tríade ${quality === 'major' ? 'maior' : 'menor'} = fundamental + terceira ${quality === 'major' ? 'maior (4 meios-tons)' : 'menor (3 meios-tons)'} + quinta perfeita (7 meios-tons). ${symbol} = ${answer}.`,
  };
}

function theoryKeysQuestion(rng: Rng, i: number): Question {
  const key = pick(rng, THEORY_KEYS);
  const chords = diatonicChords(key);
  const degreeIdx = pick(rng, [0, 3, 4, 5] as const);
  const target = chords[degreeIdx];
  if (!target) throw new Error('grau inválido');
  // Distractors: other chords of the key plus the same root with the wrong quality.
  const pool = [...new Set([...chords.map((c) => c.symbol), ...chords.map((c) => (c.quality === 'major' ? `${c.root}m` : c.root))])].filter(
    (s) => !s.includes('dim'),
  );
  const answer = target.symbol;
  return {
    id: `keys-${i}`,
    prompt: `Na tonalidade de ${key} maior, qual é o acorde do grau ${target.degree}?`,
    visual: { kind: 'none' },
    options: options(rng, answer, pool),
    answer,
    explanation: `Escala de ${key} maior: ${spelledMajorScale(key).join(' ')}. Os graus I, IV e V são maiores; ii, iii e vi são menores. ${target.degree} = ${answer}.`,
  };
}

// ---------- Catalogue ----------

export type ExerciseKind = 'quiz' | 'chord-changes';

export interface ExerciseDef {
  id: string;
  skillId: string;
  title: string;
  description: string;
  kind: ExerciseKind;
  questionCount: number;
  /** Uses sound (interval exercise); a visual alternative is always offered. */
  usesAudio?: boolean;
  generate?: (rng: Rng, count: number) => Question[];
}

const OPEN_BASIC = ['E', 'Em', 'A', 'Am', 'D', 'Dm', 'C', 'G'];
const SEVENTHS = ['E7', 'A7', 'D7', 'G7', 'C7', 'B7', 'Am7', 'Em7', 'Dm7', 'Cmaj7', 'Fmaj7'];

const times = (count: number, f: (i: number) => Question) => Array.from({ length: count }, (_, i) => f(i));

export const EXERCISES: readonly ExerciseDef[] = [
  { id: 'cordas', skillId: 'strings', title: 'Nomes das cordas', description: 'Memoriza as seis cordas soltas em afinação padrão.', kind: 'quiz', questionCount: 8, generate: (r, n) => times(n, (i) => stringsQuestion(r, i)) },
  { id: 'notas-1a-posicao', skillId: 'notes-first-position', title: 'Notas na 1.ª posição', description: 'Identifica notas entre a corda solta e a 3.ª casa, nas cordas 1 a 3.', kind: 'quiz', questionCount: 10, generate: (r, n) => times(n, (i) => noteQuestion(r, i, [1, 2, 3], 3)) },
  { id: 'notas-graves', skillId: 'notes-low-strings', title: 'Notas nas cordas graves', description: 'Notas da 6.ª e 5.ª cordas até à 12.ª casa: a base dos acordes com pestana.', kind: 'quiz', questionCount: 10, generate: (r, n) => times(n, (i) => noteQuestion(r, i, [6, 5], 12)) },
  { id: 'acordes-abertos', skillId: 'chords-open', title: 'Reconhecer acordes abertos', description: 'Associa o diagrama ao nome: E, Em, A, Am, D, Dm, C e G.', kind: 'quiz', questionCount: 8, generate: (r, n) => times(n, (i) => chordIdQuestion(r, i, OPEN_BASIC)) },
  { id: 'acordes-setima', skillId: 'chords-sevenths', title: 'Reconhecer acordes com sétima', description: 'Diagramas de acordes 7, maj7 e m7.', kind: 'quiz', questionCount: 8, generate: (r, n) => times(n, (i) => chordIdQuestion(r, i, SEVENTHS)) },
  { id: 'intervalos', skillId: 'intervals-basic', title: 'Intervalos básicos', description: 'Treino auditivo: 2.ª maior, terceiras, 4.ª, 5.ª e oitava. Com alternativa visual.', kind: 'quiz', questionCount: 8, usesAudio: true, generate: (r, n) => times(n, (i) => intervalQuestion(r, i)) },
  { id: 'ritmo', skillId: 'rhythm-values', title: 'Figuras rítmicas', description: 'Quanto vale cada figura e quantos tempos soma um compasso.', kind: 'quiz', questionCount: 8, generate: (r, n) => times(n, (i) => rhythmQuestion(r, i)) },
  { id: 'teoria-triades', skillId: 'theory-triads', title: 'Notas dos acordes', description: 'Forma tríades maiores e menores a partir da fundamental.', kind: 'quiz', questionCount: 6, generate: (r, n) => times(n, (i) => theoryChordTonesQuestion(r, i)) },
  { id: 'teoria-tonalidades', skillId: 'theory-keys', title: 'Acordes de uma tonalidade', description: 'Encontra os acordes I, IV, V e vi em tonalidades comuns.', kind: 'quiz', questionCount: 6, generate: (r, n) => times(n, (i) => theoryKeysQuestion(r, i)) },
  { id: 'mudancas', skillId: 'chord-changes', title: 'Mudanças de acordes num minuto', description: 'Conta quantas mudanças limpas consegues fazer entre dois acordes em 60 segundos.', kind: 'chord-changes', questionCount: 0 },
];

export function exerciseById(id: string): ExerciseDef | undefined {
  return EXERCISES.find((e) => e.id === id);
}

export function exerciseBySkill(skillId: string): ExerciseDef | undefined {
  return EXERCISES.find((e) => e.skillId === skillId);
}

export const SKILL_LABEL: Record<string, string> = Object.fromEntries(EXERCISES.map((e) => [e.skillId, e.title]));

/** Review session: questions drawn from the given due exercises, interleaved. */
export function generateReview(rng: Rng, exerciseIds: readonly string[], count = 10): { question: Question; skillId: string }[] {
  const gens = exerciseIds
    .map(exerciseById)
    .flatMap((d) => (d && d.kind === 'quiz' && d.generate ? [{ skillId: d.skillId, generate: d.generate }] : []));
  if (gens.length === 0) return [];
  const out: { question: Question; skillId: string }[] = [];
  for (let i = 0; i < count; i++) {
    const g = gens[i % gens.length];
    const q = g?.generate(rng, 1)[0];
    if (g && q) out.push({ question: { ...q, id: `review-${i}` }, skillId: g.skillId });
  }
  return shuffle(rng, out);
}

export function scoreOf(correct: number, total: number): number {
  return total > 0 ? correct / total : 0;
}
