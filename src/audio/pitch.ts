// YIN fundamental-frequency estimator (de Cheveigné & Kawahara, 2002).
// Pure function over a Float32Array so it can be unit-tested with synthetic signals.

export interface PitchResult {
  frequency: number;
  /** 0..1, higher = more periodic (1 - aperiodicity). */
  clarity: number;
}

export interface PitchOptions {
  sampleRate: number;
  /** Absolute threshold on the cumulative mean normalised difference (lower = stricter). */
  threshold?: number;
  minFrequency?: number;
  maxFrequency?: number;
}

export function rms(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    const v = buffer[i] ?? 0;
    sum += v * v;
  }
  return Math.sqrt(sum / Math.max(1, buffer.length));
}

export function detectPitch(buffer: Float32Array, opts: PitchOptions): PitchResult | null {
  const { sampleRate, threshold = 0.15, minFrequency = 60, maxFrequency = 1200 } = opts;
  const half = Math.floor(buffer.length / 2);
  const tauMin = Math.max(2, Math.floor(sampleRate / maxFrequency));
  const tauMax = Math.min(half - 1, Math.ceil(sampleRate / minFrequency));
  if (tauMax <= tauMin) return null;

  // Step 2: difference function.
  const diff = new Float32Array(tauMax + 1);
  for (let tau = 1; tau <= tauMax; tau++) {
    let sum = 0;
    for (let i = 0; i < half; i++) {
      const d = (buffer[i] ?? 0) - (buffer[i + tau] ?? 0);
      sum += d * d;
    }
    diff[tau] = sum;
  }

  // Step 3: cumulative mean normalised difference.
  const cmnd = new Float32Array(tauMax + 1);
  cmnd[0] = 1;
  let running = 0;
  for (let tau = 1; tau <= tauMax; tau++) {
    running += diff[tau] ?? 0;
    cmnd[tau] = running === 0 ? 1 : ((diff[tau] ?? 0) * tau) / running;
  }

  // Step 4: absolute threshold — first dip below threshold, then walk to its local minimum.
  let tauEstimate = -1;
  for (let tau = tauMin; tau <= tauMax; tau++) {
    if ((cmnd[tau] ?? 1) < threshold) {
      while (tau + 1 <= tauMax && (cmnd[tau + 1] ?? 1) < (cmnd[tau] ?? 1)) tau++;
      tauEstimate = tau;
      break;
    }
  }
  if (tauEstimate < 0) return null;

  // Step 5: parabolic interpolation for sub-sample precision.
  let betterTau = tauEstimate;
  if (tauEstimate > 1 && tauEstimate < tauMax) {
    const s0 = cmnd[tauEstimate - 1] ?? 0;
    const s1 = cmnd[tauEstimate] ?? 0;
    const s2 = cmnd[tauEstimate + 1] ?? 0;
    const denom = 2 * (2 * s1 - s2 - s0);
    if (denom !== 0) betterTau = tauEstimate + (s2 - s0) / denom;
  }

  const frequency = sampleRate / betterTau;
  if (frequency < minFrequency || frequency > maxFrequency) return null;
  return { frequency, clarity: 1 - (cmnd[tauEstimate] ?? 1) };
}

/** Median of the last N readings to stabilise the needle against octave jumps and noise. */
export class PitchSmoother {
  private readonly values: number[] = [];
  constructor(private readonly size = 5) {}

  push(freq: number): number {
    this.values.push(freq);
    if (this.values.length > this.size) this.values.shift();
    const sorted = [...this.values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)] ?? freq;
  }

  reset(): void {
    this.values.length = 0;
  }
}

export type TuningState = 'flat' | 'in-tune' | 'sharp';

export const IN_TUNE_CENTS = 5;

export function tuningState(cents: number, tolerance = IN_TUNE_CENTS): TuningState {
  if (cents < -tolerance) return 'flat';
  if (cents > tolerance) return 'sharp';
  return 'in-tune';
}
