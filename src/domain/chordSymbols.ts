// Chord-symbol parsing for imported cifras / ChordPro. Maps symbols to the chord library when possible.
import { CHORDS, type Chord } from '../content/chords';
import { pitchClassIndex, PITCH_CLASSES, type PitchClass } from './notes';
import type { ChordQuality } from './theory';

export interface ParsedChord {
  /** Symbol as written (trimmed). */
  symbol: string;
  root: PitchClass;
  /** Root as written, e.g. "Bb" or "F#". */
  rootName: string;
  /** Suffix as written, e.g. "m7", "sus4", "maj7". */
  suffix: string;
  bass: string | null;
}

// Root, optional accidental, suffix, optional slash bass.
const CHORD_RE = /^([A-G])([#b♯♭]?)([^/\s]*)(?:\/([A-G][#b♯♭]?))?$/;
// Suffixes we recognise (anything else is rejected so lyric words are not mistaken for chords).
const SUFFIX_RE =
  /^(?:m|min|-|maj|M|dim|°|aug|\+|sus|sus2|sus4|add9|add2|add11|5|6|7|9|11|13|m6|m7|m9|m11|maj7|maj9|M7|7M|m7b5|ø|7sus4|7sus2|dim7|°7|m\(maj7\)|mmaj7|6\/9|69|7b9|7#9|7#5|7b5|9sus4)?(?:\(?[#b♯♭]?\d{1,2}\)?)*$/;

export function parseChordSymbol(raw: string): ParsedChord | null {
  const symbol = raw.trim();
  if (!symbol || symbol.length > 16) return null;
  // «6/9» is a suffix, not a slash bass.
  const m = CHORD_RE.exec(symbol.replace('6/9', '69'));
  if (!m) return null;
  const [, letter = '', acc = '', suffix = '', bass] = m;
  if (!SUFFIX_RE.test(suffix)) return null;
  const rootName = letter + acc.replace('♯', '#').replace('♭', 'b');
  let root: PitchClass;
  try {
    root = PITCH_CLASSES[pitchClassIndex(rootName)] as PitchClass;
  } catch {
    return null;
  }
  return { symbol, root, rootName, suffix, bass: bass ? bass.replace('♯', '#').replace('♭', 'b') : null };
}

export function isChordSymbol(token: string): boolean {
  return parseChordSymbol(token) !== null;
}

/** Simplifies a suffix to one of the qualities the library covers. */
export function simplifyQuality(suffix: string): ChordQuality | null {
  const s = suffix.replace(/[()]/g, '');
  if (s === '' || s === 'M' || /^(add9|add2|6|69|6\/9|add11)$/.test(s)) return 'major';
  if (/^(m|min|-|m6|madd9|m9|m11)$/.test(s)) return /^(m9|m11)$/.test(s) ? 'm7' : 'minor';
  if (/^(maj7|M7|7M|maj9)$/.test(s)) return 'maj7';
  if (/^(m7|min7|-7)$/.test(s)) return 'm7';
  if (/^(7|9|11|13|7b9|7#9)$/.test(s)) return '7';
  if (/^(sus2)$/.test(s)) return 'sus2';
  if (/^(sus|sus4|7sus4|9sus4)$/.test(s)) return 'sus4';
  if (s === '7sus2') return 'sus2';
  if (s === '5') return '5';
  return null;
}

export interface ChordMatch {
  parsed: ParsedChord;
  /** Library chord to learn for this symbol, if any. */
  chord: Chord | null;
  /** True when the library chord is a simplification (e.g. Cadd9 → C, D/F# → D). */
  simplified: boolean;
}

function libraryChord(root: PitchClass, quality: ChordQuality): Chord | null {
  // Prefer the easiest shape for the same root/quality (e.g. simplified F before full barre F).
  const candidates = CHORDS.filter((c) => c.root === root && c.quality === quality).sort((a, b) => a.difficulty - b.difficulty);
  return candidates[0] ?? null;
}

export function matchChord(raw: string): ChordMatch | null {
  const parsed = parseChordSymbol(raw);
  if (!parsed) return null;
  const quality = simplifyQuality(parsed.suffix);
  if (!quality) return { parsed, chord: null, simplified: false };
  let chord = libraryChord(parsed.root, quality);
  let simplified = parsed.bass !== null || !['', 'm', 'maj7', 'm7', '7', 'sus2', 'sus4', '5'].includes(parsed.suffix);
  // Fall back from 7th/sus/maj7 to the plain triad if the library lacks that shape.
  if (!chord && quality !== 'major' && quality !== 'minor') {
    const triad = quality === 'm7' ? 'minor' : 'major';
    chord = libraryChord(parsed.root, triad);
    simplified = chord !== null;
  }
  return { parsed, chord, simplified };
}

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/** Transposes a chord symbol by semitones, keeping its suffix. Non-chords are returned unchanged. */
export function transposeSymbol(raw: string, semitones: number, preferFlats = false): string {
  const p = parseChordSymbol(raw);
  if (!p || semitones % 12 === 0) return raw;
  const names = preferFlats ? FLAT_NAMES : SHARP_NAMES;
  const shift = (name: string) => names[(((pitchClassIndex(name) + semitones) % 12) + 12) % 12] as string;
  return `${shift(p.rootName)}${p.suffix}${p.bass ? `/${shift(p.bass)}` : ''}`;
}
