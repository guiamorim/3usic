import { PITCH_CLASSES, pitchClassIndex, type PitchClass } from './notes';

export type ChordQuality = 'major' | 'minor' | '7' | 'maj7' | 'm7' | 'sus2' | 'sus4' | '5';

/** Semitone offsets from the root. */
export const CHORD_FORMULAS: Record<ChordQuality, readonly number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  '7': [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  '5': [0, 7],
};

export const QUALITY_LABEL: Record<ChordQuality, string> = {
  major: 'maior',
  minor: 'menor',
  '7': 'sétima (dominante)',
  maj7: 'sétima maior',
  m7: 'menor com sétima',
  sus2: 'suspenso 2',
  sus4: 'suspenso 4',
  '5': 'power chord (quinta)',
};

export function transpose(pc: PitchClass | string, semitones: number): PitchClass {
  const idx = pitchClassIndex(pc);
  return PITCH_CLASSES[(((idx + semitones) % 12) + 12) % 12] as PitchClass;
}

export function chordPitchClasses(root: string, quality: ChordQuality): PitchClass[] {
  return CHORD_FORMULAS[quality].map((s) => transpose(root, s));
}

export interface IntervalInfo {
  semitones: number;
  name: string;
  short: string;
}

export const INTERVALS: readonly IntervalInfo[] = [
  { semitones: 0, name: 'Uníssono', short: 'P1' },
  { semitones: 1, name: 'Segunda menor', short: '2m' },
  { semitones: 2, name: 'Segunda maior', short: '2M' },
  { semitones: 3, name: 'Terceira menor', short: '3m' },
  { semitones: 4, name: 'Terceira maior', short: '3M' },
  { semitones: 5, name: 'Quarta perfeita', short: '4P' },
  { semitones: 6, name: 'Trítono', short: 'TT' },
  { semitones: 7, name: 'Quinta perfeita', short: '5P' },
  { semitones: 8, name: 'Sexta menor', short: '6m' },
  { semitones: 9, name: 'Sexta maior', short: '6M' },
  { semitones: 10, name: 'Sétima menor', short: '7m' },
  { semitones: 11, name: 'Sétima maior', short: '7M' },
  { semitones: 12, name: 'Oitava', short: '8P' },
];

export function intervalBySemitones(semitones: number): IntervalInfo {
  const i = INTERVALS.find((x) => x.semitones === semitones);
  if (!i) throw new RangeError(`Intervalo não suportado: ${semitones}`);
  return i;
}

/** Ascending interval (0–11) between two pitch classes. */
export function intervalBetween(from: string, to: string): number {
  return (((pitchClassIndex(to) - pitchClassIndex(from)) % 12) + 12) % 12;
}

const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11] as const;

export function majorScale(root: string): PitchClass[] {
  return MAJOR_STEPS.map((s) => transpose(root, s));
}

// ---- Spelling (letter names with correct accidentals, e.g. B♭ in F major, E♭ in Cm) ----

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11] as const;

/**
 * Spells the note `semitones` above `root` using the letter `degree` steps above the root letter.
 * Example: spell('C', 2, 3) = 'E♭' (minor third), spell('F', 3, 5) = 'B♭'.
 */
export function spell(root: string, degree: number, semitones: number): string {
  const letterIdx = LETTERS.indexOf(root[0] as (typeof LETTERS)[number]);
  if (letterIdx < 0) throw new Error(`Nota desconhecida: ${root}`);
  const targetLetter = (letterIdx + degree) % 7;
  const targetPc = (pitchClassIndex(root) + semitones) % 12;
  let acc = (targetPc - (LETTER_PC[targetLetter] as number) + 12) % 12;
  if (acc > 6) acc -= 12;
  const accidental = acc === 0 ? '' : acc === 1 ? '♯' : acc === 2 ? '𝄪' : acc === -1 ? '♭' : '𝄫';
  return `${LETTERS[targetLetter]}${accidental}`;
}

export function spelledMajorScale(root: string): string[] {
  return MAJOR_STEPS.map((semi, degree) => spell(root, degree, semi));
}

/** Correctly spelled triad: root, third, fifth. */
export function spelledTriad(root: string, quality: 'major' | 'minor' | 'dim' | 'aug'): string[] {
  const third = quality === 'major' || quality === 'aug' ? 4 : 3;
  const fifth = quality === 'dim' ? 6 : quality === 'aug' ? 8 : 7;
  return [spell(root, 0, 0), spell(root, 2, third), spell(root, 4, fifth)];
}

const DIATONIC_QUALITIES: readonly ('major' | 'minor' | 'dim')[] = ['major', 'minor', 'minor', 'major', 'major', 'minor', 'dim'];
const ROMAN = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'] as const;

export interface DiatonicChord {
  degree: (typeof ROMAN)[number];
  /** Spelled root, e.g. 'B♭'. */
  root: string;
  quality: 'major' | 'minor' | 'dim';
  symbol: string;
}

/** Triads built on each degree of a major key, correctly spelled. */
export function diatonicChords(key: string): DiatonicChord[] {
  const scale = spelledMajorScale(key);
  return scale.map((root, i) => {
    const quality = DIATONIC_QUALITIES[i] as 'major' | 'minor' | 'dim';
    const suffix = quality === 'major' ? '' : quality === 'minor' ? 'm' : 'dim';
    return { degree: ROMAN[i] as DiatonicChord['degree'], root, quality, symbol: `${root}${suffix}` };
  });
}

/** Beat values in a simple meter where the quarter note = 1 beat. */
export const NOTE_VALUES = {
  semibreve: { beats: 4, label: 'Semibreve', symbol: '𝅝' },
  minima: { beats: 2, label: 'Mínima', symbol: '𝅗𝅥' },
  seminima: { beats: 1, label: 'Semínima', symbol: '♩' },
  colcheia: { beats: 0.5, label: 'Colcheia', symbol: '♪' },
  semicolcheia: { beats: 0.25, label: 'Semicolcheia', symbol: '𝅘𝅥𝅯' },
} as const;
export type NoteValue = keyof typeof NOTE_VALUES;

export function totalBeats(values: readonly NoteValue[]): number {
  return values.reduce((sum, v) => sum + NOTE_VALUES[v].beats, 0);
}
