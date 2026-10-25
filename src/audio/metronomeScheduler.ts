// Look-ahead scheduler ("A Tale of Two Clocks" pattern): a coarse JS timer wakes up often and
// schedules clicks precisely on the audio clock a little ahead of time. The timing maths is kept
// pure so it can be unit-tested with a fake clock.

export interface TimeSignature {
  beats: number;
  /** Note value that gets one click: 4 = quarter, 8 = eighth. */
  unit: 4 | 8;
  label: string;
}

export const TIME_SIGNATURES: readonly TimeSignature[] = [
  { beats: 2, unit: 4, label: '2/4' },
  { beats: 3, unit: 4, label: '3/4' },
  { beats: 4, unit: 4, label: '4/4' },
  { beats: 6, unit: 8, label: '6/8' },
];

export const DEFAULT_SIGNATURE: TimeSignature = { beats: 4, unit: 4, label: '4/4' };

export const MIN_BPM = 30;
export const MAX_BPM = 240;

export function clampBpm(bpm: number): number {
  if (!Number.isFinite(bpm)) return 80;
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)));
}

export function secondsPerBeat(bpm: number): number {
  return 60 / clampBpm(bpm);
}

export interface ScheduledBeat {
  time: number;
  /** 0-based position in the bar. */
  beatInBar: number;
  accent: boolean;
}

export interface SchedulerState {
  nextBeatTime: number;
  beatInBar: number;
}

/**
 * Returns every beat that falls inside [now, now + lookAhead) and the state to continue from.
 * In 6/8 the dotted-quarter pulse (beats 0 and 3) is accented lightly, beat 0 strongly.
 */
export function collectBeats(
  state: SchedulerState,
  now: number,
  lookAhead: number,
  bpm: number,
  signature: TimeSignature,
  accentFirst: boolean,
): { beats: ScheduledBeat[]; state: SchedulerState } {
  const beats: ScheduledBeat[] = [];
  let { nextBeatTime, beatInBar } = state;
  const step = secondsPerBeat(bpm);
  // If the tab was throttled and we fell far behind, skip ahead instead of firing a burst.
  if (nextBeatTime < now - step) {
    const missed = Math.ceil((now - nextBeatTime) / step);
    nextBeatTime += missed * step;
    beatInBar = (beatInBar + missed) % signature.beats;
  }
  while (nextBeatTime < now + lookAhead) {
    beats.push({ time: nextBeatTime, beatInBar, accent: accentFirst && beatInBar === 0 });
    nextBeatTime += step;
    beatInBar = (beatInBar + 1) % signature.beats;
  }
  return { beats, state: { nextBeatTime, beatInBar } };
}

/** Tap-tempo: average interval of the most recent taps, ignoring stale ones. */
export function bpmFromTaps(tapTimesMs: readonly number[], maxGapMs = 2000): number | null {
  const recent: number[] = [];
  for (let i = tapTimesMs.length - 1; i >= 0; i--) {
    const t = tapTimesMs[i] as number;
    const prev = recent[0];
    if (prev !== undefined && prev - t > maxGapMs) break;
    recent.unshift(t);
    if (recent.length === 6) break;
  }
  if (recent.length < 2) return null;
  const first = recent[0] as number;
  const last = recent[recent.length - 1] as number;
  const avg = (last - first) / (recent.length - 1);
  return avg > 0 ? clampBpm(60000 / avg) : null;
}
