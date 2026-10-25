import { midiToFrequency } from '../domain/notes';
import { getOutputContext } from './context';

/** Short plucked-string-like tone. Returns the end time. */
export function pluck(ctx: AudioContext, midi: number, when: number, duration = 1.2, volume = 0.35, a4 = 440): number {
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const f = midiToFrequency(midi, a4);
  osc.type = 'triangle';
  osc.frequency.value = f;
  osc2.type = 'sine';
  osc2.frequency.value = f * 2;
  filter.type = 'lowpass';
  filter.frequency.value = Math.min(8000, f * 8);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(volume, when + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  const g2 = ctx.createGain();
  g2.gain.value = 0.3;
  osc.connect(filter);
  osc2.connect(g2).connect(filter);
  filter.connect(gain).connect(ctx.destination);
  osc.start(when);
  osc2.start(when);
  osc.stop(when + duration + 0.05);
  osc2.stop(when + duration + 0.05);
  return when + duration;
}

/** Plays two notes one after the other, then together (interval ear training). */
export async function playInterval(low: number, high: number): Promise<void> {
  const ctx = await getOutputContext();
  const t = ctx.currentTime + 0.05;
  pluck(ctx, low, t, 0.9);
  pluck(ctx, high, t + 0.8, 0.9);
  pluck(ctx, low, t + 1.7, 1.4, 0.25);
  pluck(ctx, high, t + 1.7, 1.4, 0.25);
}

/** Sustained reference tone for tuning by ear. */
export async function playReference(midi: number, a4 = 440, seconds = 2.5): Promise<void> {
  const ctx = await getOutputContext();
  pluck(ctx, midi, ctx.currentTime + 0.02, seconds, 0.4, a4);
}

/** Strums the sounding notes of a chord from low to high. */
export async function strum(midis: readonly number[]): Promise<void> {
  const ctx = await getOutputContext();
  const t = ctx.currentTime + 0.05;
  midis.forEach((m, i) => pluck(ctx, m, t + i * 0.035, 1.8, 0.18));
}
