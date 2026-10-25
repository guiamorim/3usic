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

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();

function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  let buf = noiseBuffers.get(ctx);
  if (!buf) {
    buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.1), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffers.set(ctx, buf);
  }
  return buf;
}

/** Strummed chord at `when`: down strokes go low → high over all strings, up strokes high → low over the top four. */
export function strumAt(ctx: AudioContext, midis: readonly number[], when: number, dir: 'down' | 'up', volume = 0.16, duration = 0.9): void {
  const notes = dir === 'down' ? midis : [...midis].reverse().slice(0, 4);
  notes.forEach((m, i) => pluck(ctx, m, when + i * 0.012, duration, dir === 'down' ? volume : volume * 0.75));
}

/** Percussive muted strum («abafado»). */
export function chuckAt(ctx: AudioContext, when: number, volume = 0.5): void {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1800;
  filter.Q.value = 0.8;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, when);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.06);
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(when);
  src.stop(when + 0.08);
}

/** Metronome-style click. Square wave at 1.2–1.8 kHz: audible on phone speakers. */
export function clickAt(ctx: AudioContext, when: number, accent: boolean, volume = 0.4): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = accent ? 1800 : 1200;
  const v = Math.max(0.0002, volume * (accent ? 1 : 0.7));
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(v, when + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.07);
  osc.connect(gain).connect(ctx.destination);
  osc.start(when);
  osc.stop(when + 0.08);
}
