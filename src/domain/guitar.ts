import { midiToFrequency, pitchClassFromMidi, type PitchClass } from './notes';

export interface GuitarString {
  /** 1 = highest-pitched string (thin E), 6 = lowest (thick E). */
  number: 1 | 2 | 3 | 4 | 5 | 6;
  openMidi: number;
  pitchClass: PitchClass;
  label: string;
}

/** Standard tuning E2 A2 D3 G3 B3 E4, listed from string 6 (low) to string 1 (high). */
export const STANDARD_TUNING: readonly GuitarString[] = [
  { number: 6, openMidi: 40, pitchClass: 'E', label: 'Mi grave (E2)' },
  { number: 5, openMidi: 45, pitchClass: 'A', label: 'Lá (A2)' },
  { number: 4, openMidi: 50, pitchClass: 'D', label: 'Ré (D3)' },
  { number: 3, openMidi: 55, pitchClass: 'G', label: 'Sol (G3)' },
  { number: 2, openMidi: 59, pitchClass: 'B', label: 'Si (B3)' },
  { number: 1, openMidi: 64, pitchClass: 'E', label: 'Mi agudo (E4)' },
];

export function stringByNumber(n: number): GuitarString {
  const s = STANDARD_TUNING.find((g) => g.number === n);
  if (!s) throw new RangeError(`Corda inválida: ${n}`);
  return s;
}

export function fretMidi(stringNumber: number, fret: number): number {
  if (!Number.isInteger(fret) || fret < 0 || fret > 24) throw new RangeError(`Casa inválida: ${fret}`);
  return stringByNumber(stringNumber).openMidi + fret;
}

export function fretPitchClass(stringNumber: number, fret: number): PitchClass {
  return pitchClassFromMidi(fretMidi(stringNumber, fret));
}

export interface StringMatch {
  string: GuitarString;
  frequency: number;
  cents: number;
}

/** Nearest open string in standard tuning for a detected frequency (used by the tuner). */
export function nearestString(freq: number, a4 = 440): StringMatch {
  let best: StringMatch | null = null;
  for (const s of STANDARD_TUNING) {
    const f = midiToFrequency(s.openMidi, a4);
    const cents = 1200 * Math.log2(freq / f);
    if (!best || Math.abs(cents) < Math.abs(best.cents)) best = { string: s, frequency: f, cents };
  }
  return best as StringMatch;
}

/**
 * Frets for a chord shape, ordered from string 6 to string 1.
 * -1 = muted (not played), 0 = open, n = absolute fret number.
 */
export type ChordFrets = readonly [number, number, number, number, number, number];

export function soundingMidi(frets: ChordFrets): number[] {
  const out: number[] = [];
  frets.forEach((fret, i) => {
    if (fret < 0) return;
    const s = STANDARD_TUNING[i];
    if (s) out.push(s.openMidi + fret);
  });
  return out;
}

export function soundingPitchClasses(frets: ChordFrets): Set<PitchClass> {
  return new Set(soundingMidi(frets).map(pitchClassFromMidi));
}

export function bassPitchClass(frets: ChordFrets): PitchClass | null {
  const notes = soundingMidi(frets);
  if (notes.length === 0) return null;
  return pitchClassFromMidi(Math.min(...notes));
}
