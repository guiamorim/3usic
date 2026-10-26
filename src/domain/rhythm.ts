// Rhythm check for the strumming trainer: finds strum attacks (onsets) in microphone audio and
// compares them with the times the pattern expects. Pure code, fed by the audio layer.
//
// Absolute timing can't be trusted on phones: speaker and microphone latency (often 50–200 ms)
// differ per device. So the report removes the typical (median) offset and judges what latency
// can't fake: how steady the strums are and whether the player speeds up or slows down.

export interface OnsetOptions {
  sampleRate: number;
  /** Analysis hop, in seconds. */
  hop?: number;
  /** Energy must jump this many times above the recent background. */
  ratio?: number;
  /** Ignore anything quieter than this RMS (room noise). */
  floor?: number;
  /** Minimum time between two onsets, in seconds (a strum rings for a while). */
  refractory?: number;
}

/** Streaming onset detector: push consecutive blocks of samples, get attack times back. */
export class OnsetDetector {
  private readonly hopSize: number;
  private readonly ratio: number;
  private readonly floor: number;
  private readonly refractory: number;
  private readonly sampleRate: number;
  private background = 0;
  private lastOnset = -Infinity;
  private carry: number[] = [];
  private carryStart = 0;

  constructor(opts: OnsetOptions) {
    this.sampleRate = opts.sampleRate;
    this.hopSize = Math.max(16, Math.round(opts.sampleRate * (opts.hop ?? 0.005)));
    this.ratio = opts.ratio ?? 3;
    this.floor = opts.floor ?? 0.01;
    this.refractory = opts.refractory ?? 0.07;
  }

  /** `startTime` is the time (seconds, any clock) of the first sample in `samples`. */
  push(samples: Float32Array, startTime: number): number[] {
    const onsets: number[] = [];
    const data = this.carry.length ? [...this.carry, ...samples] : samples;
    const t0 = this.carry.length ? this.carryStart : startTime;
    let i = 0;
    for (; i + this.hopSize <= data.length; i += this.hopSize) {
      let sum = 0;
      for (let k = i; k < i + this.hopSize; k++) {
        const v = data[k] ?? 0;
        sum += v * v;
      }
      const e = Math.sqrt(sum / this.hopSize);
      const t = t0 + i / this.sampleRate;
      if (e > this.floor && e > this.background * this.ratio && t - this.lastOnset >= this.refractory) {
        onsets.push(t);
        this.lastOnset = t;
      }
      // Slow background follower (~50 ms), pulled up quickly so a ringing chord isn't re-detected.
      this.background = e > this.background ? this.background + (e - this.background) * 0.5 : this.background * 0.9 + e * 0.1;
    }
    this.carry = Array.from(data.slice(i));
    this.carryStart = t0 + i / this.sampleRate;
    return onsets;
  }
}

export type Trend = 'steady' | 'rushing' | 'dragging';

export interface RhythmReport {
  /** Strokes the pattern expected while listening. */
  expected: number;
  /** Expected strokes with an attack close enough. */
  matched: number;
  /** Share (0..100) of expected strokes played within the tolerance, after removing latency. */
  onTimePercent: number;
  /** Typical deviation from the beat after removing latency, in ms (lower = steadier). */
  spreadMs: number;
  /** Median offset (device latency plus any constant habit of playing early/late), in ms. */
  offsetMs: number;
  trend: Trend;
}

function median(xs: readonly number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? (s[m] ?? 0) : ((s[m - 1] ?? 0) + (s[m] ?? 0)) / 2;
}

/**
 * Matches each expected stroke time with the nearest onset (within a window that never reaches
 * the neighbouring slot) and summarises the timing. Times in seconds on the same clock.
 */
export function rhythmReport(onsets: readonly number[], expected: readonly number[], slotSec: number, toleranceSec = 0.06): RhythmReport | null {
  const window = Math.min(0.5 * slotSec, 0.25);
  // Latency shifts every onset late by the same amount: search around a first latency estimate.
  const raw: number[] = [];
  for (const t of expected) {
    let best: number | null = null;
    for (const o of onsets) if (o >= t - 0.05 && o <= t + 0.3 && (best === null || Math.abs(o - t) < Math.abs(best - t))) best = o;
    if (best !== null) raw.push(best - t);
  }
  if (raw.length < 4) return null;
  const latency = median(raw);
  const offsets: { t: number; d: number }[] = [];
  for (const t of expected) {
    const target = t + latency;
    let best: number | null = null;
    for (const o of onsets) if (Math.abs(o - target) <= window && (best === null || Math.abs(o - target) < Math.abs(best - target))) best = o;
    if (best !== null) offsets.push({ t, d: best - target });
  }
  if (offsets.length < 4) return null;
  const ds = offsets.map((o) => o.d);
  const mean = ds.reduce((a, b) => a + b, 0) / ds.length;
  const spread = Math.sqrt(ds.reduce((a, d) => a + (d - mean) ** 2, 0) / ds.length);
  const half = Math.floor(offsets.length / 2);
  const avg = (xs: { d: number }[]) => xs.reduce((a, x) => a + x.d, 0) / Math.max(1, xs.length);
  const drift = avg(offsets.slice(half)) - avg(offsets.slice(0, half));
  return {
    expected: expected.length,
    matched: offsets.length,
    onTimePercent: Math.round((ds.filter((d) => Math.abs(d) <= toleranceSec).length / expected.length) * 100),
    spreadMs: Math.round(spread * 1000),
    offsetMs: Math.round(latency * 1000),
    trend: drift < -0.02 ? 'rushing' : drift > 0.02 ? 'dragging' : 'steady',
  };
}
