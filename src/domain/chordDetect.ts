// Chord recognition from microphone audio: chromagram (energy per pitch class) compared with
// chord templates. Pure functions over Float32Array so they can be tested with synthetic signals.
// This checks "is the expected chord sounding?", not free transcription: a much easier problem.
import { parseChordSymbol, simplifyQuality } from './chordSymbols';
import { pitchClassIndex } from './notes';
import { CHORD_FORMULAS } from './theory';

/** In-place iterative radix-2 FFT. `re.length` must be a power of two. */
export function fft(re: Float32Array, im: Float32Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i] ?? 0;
      re[i] = re[j] ?? 0;
      re[j] = tr;
      const ti = im[i] ?? 0;
      im[i] = im[j] ?? 0;
      im[j] = ti;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k;
        const b = a + len / 2;
        const xr = (re[b] ?? 0) * cr - (im[b] ?? 0) * ci;
        const xi = (re[b] ?? 0) * ci + (im[b] ?? 0) * cr;
        re[b] = (re[a] ?? 0) - xr;
        im[b] = (im[a] ?? 0) - xi;
        re[a] = (re[a] ?? 0) + xr;
        im[a] = (im[a] ?? 0) + xi;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }
}

export interface ChromaOptions {
  sampleRate: number;
  /** Below ~130 Hz FFT bins are wider than a semitone at usual sizes; bass notes still show via harmonics. */
  minHz?: number;
  /** Keeps metronome clicks (1.2 kHz and up) out of the analysis. */
  maxHz?: number;
}

/**
 * 12-bin chroma (C, C#, … B), L2-normalised. Returns all zeros for silence.
 * The buffer length is truncated to the largest power of two.
 */
export function chromagram(buffer: Float32Array, opts: ChromaOptions): Float32Array {
  const { sampleRate, minHz = 130, maxHz = 1100 } = opts;
  let n = 1;
  while (n * 2 <= buffer.length) n *= 2;
  const re = new Float32Array(n);
  const im = new Float32Array(n);
  for (let i = 0; i < n; i++) re[i] = (buffer[i] ?? 0) * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)));
  fft(re, im);
  const chroma = new Float32Array(12);
  const binHz = sampleRate / n;
  const lo = Math.max(1, Math.ceil(minHz / binHz));
  const hi = Math.min(n / 2 - 1, Math.floor(maxHz / binHz));
  for (let k = lo; k <= hi; k++) {
    const mag = Math.hypot(re[k] ?? 0, im[k] ?? 0);
    const midi = 69 + 12 * Math.log2((k * binHz) / 440);
    const pc = ((Math.round(midi) % 12) + 12) % 12;
    // Square root compresses loud fundamentals so every chord tone counts.
    chroma[pc] = (chroma[pc] ?? 0) + Math.sqrt(mag);
  }
  let norm = 0;
  for (const v of chroma) norm += v * v;
  norm = Math.sqrt(norm);
  if (norm > 0) for (let i = 0; i < 12; i++) chroma[i] = (chroma[i] ?? 0) / norm;
  return chroma;
}

/** Pitch-class indices (0 = C) of a chord symbol, including a slash bass; null if not a chord. */
export function chordPitchSet(symbol: string): number[] | null {
  const p = parseChordSymbol(symbol);
  if (!p) return null;
  const root = pitchClassIndex(p.root);
  const s = p.suffix;
  let formula: readonly number[];
  if (/dim|°|º/.test(s)) formula = /7/.test(s) ? [0, 3, 6, 9] : [0, 3, 6];
  else if (/ø|m7b5|m7\(b5\)/.test(s)) formula = [0, 3, 6, 10];
  else if (/aug|\+$|5\+|#5/.test(s) && !/7\+/.test(s)) formula = [0, 4, 8];
  else formula = CHORD_FORMULAS[simplifyQuality(s) ?? 'major'];
  const set = new Set(formula.map((i) => (root + i) % 12));
  if (p.bass) set.add(pitchClassIndex(p.bass));
  return [...set];
}

// Harmonics 1–4 of a plucked string land on the root (h1, h2, h4) and the fifth (h3).
const HARMONICS: readonly [number, number][] = [
  [0, 1],
  [12, 0.6],
  [19, 0.36],
  [24, 0.22],
];

function template(pcs: readonly number[]): Float32Array {
  const t = new Float32Array(12);
  for (const pc of pcs) for (const [semis, w] of HARMONICS) t[(pc + semis) % 12] = (t[(pc + semis) % 12] ?? 0) + w;
  let norm = 0;
  for (const v of t) norm += v * v;
  norm = Math.sqrt(norm);
  for (let i = 0; i < 12; i++) t[i] = (t[i] ?? 0) / norm;
  return t;
}

function cosine(a: Float32Array, b: Float32Array): number {
  let s = 0;
  for (let i = 0; i < 12; i++) s += (a[i] ?? 0) * (b[i] ?? 0);
  return s;
}

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** The 24 major and minor triads: what a beginner most likely plays instead of the expected chord. */
const COMPETITORS: readonly { label: string; root: number; t: Float32Array }[] = NAMES.flatMap((name, root) => [
  { label: name, root, t: template([root, (root + 4) % 12, (root + 7) % 12]) },
  { label: `${name}m`, root, t: template([root, (root + 3) % 12, (root + 7) % 12]) },
]);

export interface ChordJudgement {
  match: boolean;
  /** Cosine similarity with the expected chord, 0..1. */
  similarity: number;
  /** Best-scoring alternative triad, e.g. "Em" (useful feedback: "parece Em"). */
  heard: string | null;
}

export const MIN_SIMILARITY = 0.6;
const TIE_TOLERANCE = 0.03;

/**
 * Is the expected chord what is sounding? Accepts it when it scores at least as well as every
 * other major/minor triad (with a small tolerance). Same-root triads don't compete with power
 * chords or with 7th/sus extensions of that root, so a beginner playing the triad still passes.
 */
export function judgeChord(chroma: Float32Array, expected: string): ChordJudgement {
  const pcs = chordPitchSet(expected);
  const p = parseChordSymbol(expected);
  if (!pcs || !p) return { match: false, similarity: 0, heard: null };
  const silent = chroma.every((v) => v === 0);
  if (silent) return { match: false, similarity: 0, heard: null };
  const similarity = cosine(chroma, template(pcs));
  const root = pitchClassIndex(p.root);
  const lenient = simplifyQuality(p.suffix) !== 'major' && simplifyQuality(p.suffix) !== 'minor';
  let bestOther = 0;
  let heard: string | null = null;
  let bestOverall = -1;
  for (const c of COMPETITORS) {
    const s = cosine(chroma, c.t);
    if (s > bestOverall) {
      bestOverall = s;
      heard = c.label;
    }
    const sameChord = c.label === `${NAMES[root]}${simplifyQuality(p.suffix) === 'minor' ? 'm' : ''}` && !lenient;
    if (sameChord || (lenient && c.root === root)) continue;
    bestOther = Math.max(bestOther, s);
  }
  const match = similarity >= MIN_SIMILARITY && similarity >= bestOther - TIE_TOLERANCE;
  return { match, similarity, heard };
}
