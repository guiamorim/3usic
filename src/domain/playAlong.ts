// "Tocar junto": turns a song sheet into a timeline of chords (in beats) and scores each chord
// from what the microphone heard. Pure functions; the page drives them with the audio clock.
import type { ParsedSong } from './chordpro';

export interface PlayEvent {
  index: number;
  chord: string;
  /** Beat (from 0) at which the chord starts, after the count-in. */
  startBeat: number;
  beats: number;
  section: string | null;
  /** Lyric line this chord belongs to, when the sheet has lyrics. */
  lyric: string | null;
}

export interface TimelineOptions {
  beatsPerBar: number;
  /**
   * Catalogue progressions store one bar per line: chords in a line share the bar.
   * Imported sheets (lyrics) don't say how long a chord lasts: each gets `beatsPerChord`.
   */
  barsFromLines: boolean;
  beatsPerChord: number;
}

/** Beats per bar from a time signature like "3/4" or "6/8" (counts the numerator). */
export function beatsPerBar(time: string | null): number {
  const n = Number(time?.split('/')[0]);
  return Number.isInteger(n) && n >= 2 && n <= 12 ? n : 4;
}

/** Splits `total` beats among `parts` chords, giving leftovers to the first ones (4 → 2+1+1 for 3). */
function split(total: number, parts: number): number[] {
  const base = Math.floor(total / parts);
  if (base === 0) return Array<number>(parts).fill(1);
  return Array.from({ length: parts }, (_, i) => base + (i < total % parts ? 1 : 0));
}

export function buildTimeline(sheet: ParsedSong, opts: TimelineOptions): PlayEvent[] {
  const raw: Omit<PlayEvent, 'index' | 'startBeat'>[] = [];
  for (const section of sheet.sections) {
    for (const line of section.lines) {
      if (line.kind !== 'lyrics') continue;
      const chords = line.segments.map((s) => s.chord).filter((c): c is string => !!c);
      if (chords.length === 0) continue;
      const text = line.segments
        .map((s) => s.text)
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
      const lyric = text || null;
      const lengths = opts.barsFromLines && !lyric ? split(opts.beatsPerBar, chords.length) : chords.map(() => opts.beatsPerChord);
      chords.forEach((chord, i) =>
        raw.push({
          chord,
          beats: lengths[i] ?? opts.beatsPerChord,
          section: section.label,
          lyric,
        }),
      );
    }
  }
  // Merge repeated chords (e.g. "C | C") into one longer event: easier to read and to judge.
  const merged: typeof raw = [];
  for (const e of raw) {
    const prev = merged[merged.length - 1];
    if (prev && prev.chord === e.chord && prev.lyric === e.lyric && prev.section === e.section) prev.beats += e.beats;
    else merged.push({ ...e });
  }
  let beat = 0;
  return merged.map((e, index) => {
    const ev = { ...e, index, startBeat: beat };
    beat += e.beats;
    return ev;
  });
}

/** Plays the whole timeline `times` times in a row (catalogue progressions are written once). */
export function repeatTimeline(timeline: readonly PlayEvent[], times: number): PlayEvent[] {
  const length = totalBeats(timeline);
  const out: PlayEvent[] = [];
  for (let r = 0; r < Math.max(1, times); r++) {
    for (const e of timeline)
      out.push({
        ...e,
        index: out.length,
        startBeat: e.startBeat + r * length,
      });
  }
  return out;
}

export function totalBeats(timeline: readonly PlayEvent[]): number {
  const last = timeline[timeline.length - 1];
  return last ? last.startBeat + last.beats : 0;
}

/** Index of the event playing at `beat` (fractional), or -1 before the start / after the end. */
export function eventAt(timeline: readonly PlayEvent[], beat: number): number {
  if (beat < 0) return -1;
  for (let i = timeline.length - 1; i >= 0; i--) {
    const e = timeline[i];
    if (e && beat >= e.startBeat) return beat < e.startBeat + e.beats ? i : -1;
  }
  return -1;
}

export type ChordVerdict = 'hit' | 'miss' | 'silent';

export interface FrameTally {
  /** Analysis frames inside the judging window. */
  frames: number;
  /** Frames with enough sound to analyse. */
  voiced: number;
  /** Voiced frames where the expected chord was recognised. */
  matched: number;
}

export const EMPTY_TALLY: FrameTally = { frames: 0, voiced: 0, matched: 0 };

export type MicSensitivity = 'low' | 'normal' | 'high';

export interface DetectionThresholds {
  /** RMS below which a frame counts as silence (room noise, gaps between strums). */
  voicedRms: number;
  /** Minimum chroma similarity with the expected chord (see judgeChord). */
  minSimilarity: number;
  /** Share of voiced frames that must recognise the chord for a hit. */
  hitRatio: number;
}

/**
 * Untested on real devices yet: «normal» is the lab default. «low» suits noisy rooms (fewer
 * false hits), «high» suits quiet phone mics or soft playing (more forgiving).
 */
export const THRESHOLDS: Record<MicSensitivity, DetectionThresholds> = {
  low: { voicedRms: 0.012, minSimilarity: 0.68, hitRatio: 0.45 },
  normal: { voicedRms: 0.006, minSimilarity: 0.6, hitRatio: 0.35 },
  high: { voicedRms: 0.003, minSimilarity: 0.52, hitRatio: 0.25 },
};

/**
 * A chord counts as played when it was recognised in at least `hitRatio` (35 % by default) of
 * the frames with sound (strums decay and hands move, so 100 % is unrealistic). Too little sound = silent.
 */
export function verdict(t: FrameTally, hitRatio = THRESHOLDS.normal.hitRatio): ChordVerdict {
  if (t.voiced < Math.max(2, t.frames * 0.15)) return 'silent';
  return t.matched / t.voiced >= hitRatio ? 'hit' : 'miss';
}

export interface PlayScore {
  hits: number;
  misses: number;
  silent: number;
  /** 0..100, hits over judged chords. */
  percent: number;
  bestStreak: number;
}

export function score(verdicts: readonly ChordVerdict[]): PlayScore {
  let streak = 0;
  let bestStreak = 0;
  let hits = 0;
  let misses = 0;
  let silent = 0;
  for (const v of verdicts) {
    if (v === 'hit') {
      hits++;
      streak++;
      bestStreak = Math.max(bestStreak, streak);
    } else {
      if (v === 'miss') misses++;
      else silent++;
      streak = 0;
    }
  }
  const judged = verdicts.length;
  return {
    hits,
    misses,
    silent,
    percent: judged ? Math.round((hits / judged) * 100) : 0,
    bestStreak,
  };
}
