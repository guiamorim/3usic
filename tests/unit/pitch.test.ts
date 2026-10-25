import { describe, expect, it } from 'vitest';
import { detectPitch, PitchSmoother, rms, tuningState } from '../../src/audio/pitch';
import { frequencyToNote } from '../../src/domain/notes';

const SR = 48000;

function tone(freq: number, opts: { harmonics?: number[]; noise?: number; length?: number; seed?: number } = {}): Float32Array {
  const { harmonics = [1], noise = 0, length = 4096 } = opts;
  let seed = opts.seed ?? 1;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647 - 0.5;
  };
  const buf = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    let v = 0;
    harmonics.forEach((amp, h) => {
      v += amp * Math.sin((2 * Math.PI * freq * (h + 1) * i) / SR);
    });
    buf[i] = 0.5 * v + noise * rand();
  }
  return buf;
}

describe('deteção de altura (YIN)', () => {
  it.each([82.41, 110, 146.83, 196, 246.94, 329.63, 440])('deteta %f Hz (sinusoide pura) com erro < 2 cents', (f) => {
    const r = detectPitch(tone(f), { sampleRate: SR });
    expect(r).not.toBeNull();
    expect(Math.abs(1200 * Math.log2(r!.frequency / f))).toBeLessThan(2);
  });

  it('deteta a fundamental num som rico em harmónicos (corda grave)', () => {
    // Guitar low E: weak fundamental, strong 2nd/3rd harmonics.
    const r = detectPitch(tone(82.41, { harmonics: [0.4, 1, 0.8, 0.5, 0.3] }), { sampleRate: SR });
    expect(r).not.toBeNull();
    expect(frequencyToNote(r!.frequency).pitchClass).toBe('E');
    expect(frequencyToNote(r!.frequency).octave).toBe(2);
  });

  it('tolera algum ruído', () => {
    const r = detectPitch(tone(196, { harmonics: [1, 0.5, 0.3], noise: 0.1 }), { sampleRate: SR });
    expect(r).not.toBeNull();
    expect(frequencyToNote(r!.frequency).pitchClass).toBe('G');
  });

  it('devolve null para ruído sem altura definida', () => {
    const noise = tone(0, { harmonics: [0], noise: 1, seed: 42 });
    expect(detectPitch(noise, { sampleRate: SR })).toBeNull();
  });

  it('devolve null para silêncio', () => {
    expect(detectPitch(new Float32Array(4096), { sampleRate: SR })).toBeNull();
    expect(rms(new Float32Array(4096))).toBe(0);
  });

  it('funciona também a 44,1 kHz', () => {
    const buf = new Float32Array(4096);
    for (let i = 0; i < buf.length; i++) buf[i] = Math.sin((2 * Math.PI * 110 * i) / 44100);
    const r = detectPitch(buf, { sampleRate: 44100 });
    expect(r!.frequency).toBeCloseTo(110, 0);
  });
});

describe('estabilização e estado de afinação', () => {
  it('a mediana ignora leituras isoladas erradas', () => {
    const s = new PitchSmoother(5);
    [110, 110.2, 220, 109.9].forEach((f) => s.push(f));
    expect(s.push(110.1)).toBeCloseTo(110.1, 1);
  });

  it('classifica baixo / afinado / alto', () => {
    expect(tuningState(-12)).toBe('flat');
    expect(tuningState(-4)).toBe('in-tune');
    expect(tuningState(4.9)).toBe('in-tune');
    expect(tuningState(8)).toBe('sharp');
  });
});

describe('afinador mais tolerante', () => {
  it('com ruído forte ainda encontra a nota (limiar de recurso)', async () => {
    const { detectPitch: dp } = await import('../../src/audio/pitch');
    const buf = tone(110, { harmonics: [1, 0.6, 0.4], noise: 0.6, seed: 9 });
    const strict = dp(buf, { sampleRate: SR, fallbackThreshold: 0.15 });
    const tolerant = dp(buf, { sampleRate: SR });
    expect(tolerant).not.toBeNull();
    expect(frequencyToNote(tolerant!.frequency).pitchClass).toBe('A');
    // The fallback only adds readings, it never changes a strict one.
    if (strict) expect(strict.frequency).toBeCloseTo(tolerant!.frequency, 1);
  });

  it('o seguidor suaviza pequenas variações e salta para uma nota nova', async () => {
    const { PitchFollower } = await import('../../src/audio/pitch');
    const f = new PitchFollower(1, 0.3, 60);
    expect(f.push(110)).toBe(110);
    const v = f.push(111);
    expect(v).toBeGreaterThan(110);
    expect(v).toBeLessThan(111);
    expect(f.push(147)).toBe(147);
  });
});
