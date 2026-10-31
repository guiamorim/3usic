// Plucked-string synthesis (Karplus-Strong with a fractional-delay allpass for exact pitch).
// A burst of noise circulates in a delay line one period long; a gentle low-pass in the loop
// makes the high harmonics fade first, as on a real string. Pure function: testable offline.

export interface PluckOptions {
  /** Seconds for the note to fade by 60 dB. */
  sustain?: number;
  /** 0..1: how bright the attack is (pick close to the bridge = bright). */
  brightness?: number;
  /** Seed for the excitation noise, so the same note always sounds the same. */
  seed?: number;
}

export function pluckedString(frequency: number, sampleRate: number, seconds: number, opts: PluckOptions = {}): Float32Array {
  const { sustain = 4, brightness = 0.7, seed = 1 } = opts;
  const out = new Float32Array(Math.max(1, Math.round(seconds * sampleRate)));
  // The two-point average in the loop adds half a sample of delay.
  const delay = sampleRate / frequency - 0.5;
  let length = Math.floor(delay);
  let frac = delay - length;
  // Keep the allpass coefficient in its well-behaved range.
  if (frac < 0.1) {
    length -= 1;
    frac += 1;
  }
  const coef = (1 - frac) / (1 + frac);
  // Loss per period for the requested decay time.
  const loss = Math.pow(10, -3 / (sustain * frequency));

  let state = seed >>> 0 || 1;
  const noise = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff - 0.5;
  };
  const line = new Float32Array(length);
  let smooth = 0;
  for (let i = 0; i < length; i++) {
    smooth += (noise() - smooth) * (0.15 + 0.85 * brightness);
    line[i] = smooth;
  }
  // Remove DC so the note doesn't start with a thump.
  const mean = line.reduce((a, b) => a + b, 0) / length;
  for (let i = 0; i < length; i++) line[i] = (line[i] ?? 0) - mean;

  let idx = 0;
  let prev = 0;
  let apIn = 0;
  let apOut = 0;
  for (let n = 0; n < out.length; n++) {
    const cur = line[idx] ?? 0;
    const avg = loss * 0.5 * (cur + prev);
    prev = cur;
    // First-order allpass: fractional part of the delay.
    const y = coef * avg + apIn - coef * apOut;
    apIn = avg;
    apOut = y;
    line[idx] = y;
    out[n] = cur;
    idx = (idx + 1) % length;
  }
  let peak = 0;
  for (const v of out) peak = Math.max(peak, Math.abs(v));
  if (peak > 0) for (let i = 0; i < out.length; i++) out[i] = ((out[i] ?? 0) / peak) * 0.9;
  return out;
}
