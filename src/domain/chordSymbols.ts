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
// Covers international and Brazilian notation: m7, maj7, 7M, 7+, 7(9), 4 (= sus4), 5+, º, ø, add9…
const SUFFIX_RE =
  /^(?:m|min|-|maj|M|dim|°|º|aug|\+|ø)?(?:\d{1,2}|maj\d{0,2}|M|add\d{1,2}|sus\d{0,2}|[#b♯♭+-]\d{1,2}|\+|°|º|ø|\((?:[#b♯♭+-]?\d{1,2}(?:[,/][#b♯♭+-]?\d{1,2})?|maj7|7M|M7|add\d{1,2}|sus\d)\))*$/;

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

/**
 * Maps a suffix to the closest quality the library covers, or null (diminished, augmented, unknown).
 * A bare «9» is read as add9 (Brazilian usage) rather than a dominant ninth: both reduce safely to a triad.
 */
export function simplifyQuality(suffix: string): ChordQuality | null {
  const s = suffix.replace(/\s/g, '');
  if (/^(dim|°|º|ø)/.test(s) || /^m7?\(?[b-]5\)?$/.test(s)) return null;
  if (/^(aug|\+)/.test(s) || /5\+|\+5|#5/.test(s)) return null;
  if (/^(m|min|-)(?!aj)/.test(s)) {
    const rest = s.replace(/^(m|min|-)/, '');
    if (/^(\(?maj7\)?|\(?7M\)?|\(?M7\)?)/.test(rest)) return 'minor';
    return /^(7|9|11|13)/.test(rest) ? 'm7' : 'minor';
  }
  if (/^(maj7?|maj9|M7|M9|7M|7\+)/.test(s)) return 'maj7';
  if (s === '' || s === 'M' || /^(6|69|add\d{1,2}|9|\(9\)|6\(9\)|2)$/.test(s)) return s === '2' ? 'sus2' : 'major';
  if (/^(sus2|7sus2)$/.test(s)) return 'sus2';
  if (/^(sus4?|4|7sus4?|7\(?4\)?|9sus4|sus\(?4\)?)$/.test(s)) return 'sus4';
  if (s === '5') return '5';
  if (/^(7|9|11|13)/.test(s) || /^7\(?[#b♯♭+-]?\d/.test(s)) return '7';
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

/** Suffixes that name exactly one of the library qualities (international and Brazilian spellings). */
const EXACT_SUFFIXES = new Set(['', 'M', 'm', 'min', '-', 'maj7', '7M', '7+', 'M7', 'm7', 'min7', '-7', '7', 'sus2', '2', 'sus4', 'sus', '4', '5']);

export function matchChord(raw: string): ChordMatch | null {
  const parsed = parseChordSymbol(raw);
  if (!parsed) return null;
  const quality = simplifyQuality(parsed.suffix);
  if (!quality) return { parsed, chord: null, simplified: false };
  let chord = libraryChord(parsed.root, quality);
  let simplified = parsed.bass !== null || !EXACT_SUFFIXES.has(parsed.suffix);
  // Fall back from 7th/sus/maj7 to the plain triad if the library lacks that shape.
  if (!chord && quality !== 'major' && quality !== 'minor') {
    const triad = quality === 'm7' ? 'minor' : 'major';
    chord = libraryChord(parsed.root, triad);
    simplified = chord !== null;
  }
  return { parsed, chord, simplified };
}

/**
 * Beginner-friendly symbol: drops the slash bass and extensions, keeps major/minor, power chords
 * and easy dominant sevenths. Returns null for passing chords that a simplified version leaves out
 * (diminished, augmented, unknown).
 */
export function simplifySymbol(raw: string): string | null {
  const p = parseChordSymbol(raw);
  if (!p) return null;
  const q = simplifyQuality(p.suffix);
  if (q === null) return null;
  // Power chords are already beginner-friendly: keep them.
  let suffix = q === 'minor' || q === 'm7' ? 'm' : q === '7' ? '7' : q === '5' ? '5' : '';
  if (suffix === '7' && !libraryChord(p.root, '7')) suffix = '';
  return p.rootName + suffix;
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
