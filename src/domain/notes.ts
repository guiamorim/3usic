// Pitch and note-name helpers. Pure functions, no browser APIs.

export const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export type PitchClass = (typeof PITCH_CLASSES)[number];

/** Portuguese solfège names, used alongside letter names in the UI. */
export const SOLFEGE: Record<PitchClass, string> = {
  C: 'Dó',
  'C#': 'Dó♯',
  D: 'Ré',
  'D#': 'Ré♯',
  E: 'Mi',
  F: 'Fá',
  'F#': 'Fá♯',
  G: 'Sol',
  'G#': 'Sol♯',
  A: 'Lá',
  'A#': 'Lá♯',
  B: 'Si',
};

const FLAT_TO_SHARP: Record<string, PitchClass> = {
  Db: 'C#',
  Eb: 'D#',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
  Cb: 'B',
  Fb: 'E',
  'E#': 'F',
  'B#': 'C',
};

export const A4_MIDI = 69;
export const DEFAULT_A4 = 440;

export function pitchClassIndex(name: string): number {
  const ascii = name.replace('♯', '#').replace('♭', 'b');
  const normalized = FLAT_TO_SHARP[ascii] ?? ascii;
  const idx = PITCH_CLASSES.indexOf(normalized as PitchClass);
  if (idx < 0) throw new Error(`Nota desconhecida: ${name}`);
  return idx;
}

export function pitchClassFromMidi(midi: number): PitchClass {
  return PITCH_CLASSES[((Math.round(midi) % 12) + 12) % 12] as PitchClass;
}

export function octaveFromMidi(midi: number): number {
  return Math.floor(Math.round(midi) / 12) - 1;
}

export function midiToFrequency(midi: number, a4 = DEFAULT_A4): number {
  return a4 * Math.pow(2, (midi - A4_MIDI) / 12);
}

/** Fractional MIDI number for a frequency. */
export function frequencyToMidi(freq: number, a4 = DEFAULT_A4): number {
  if (!(freq > 0) || !Number.isFinite(freq)) throw new RangeError('Frequência inválida');
  return A4_MIDI + 12 * Math.log2(freq / a4);
}

export interface NoteReading {
  midi: number;
  pitchClass: PitchClass;
  octave: number;
  /** Deviation from the nearest equal-tempered note, in cents (-50..+50). */
  cents: number;
  /** Frequency of the nearest equal-tempered note. */
  targetFrequency: number;
}

export function frequencyToNote(freq: number, a4 = DEFAULT_A4): NoteReading {
  const exact = frequencyToMidi(freq, a4);
  const midi = Math.round(exact);
  const cents = Math.round((exact - midi) * 1000) / 10;
  return {
    midi,
    pitchClass: pitchClassFromMidi(midi),
    octave: octaveFromMidi(midi),
    cents,
    targetFrequency: midiToFrequency(midi, a4),
  };
}

export function centsBetween(freq: number, reference: number): number {
  return 1200 * Math.log2(freq / reference);
}

export function noteLabel(pc: PitchClass): string {
  return `${pc.replace('#', '♯')} (${SOLFEGE[pc]})`;
}
