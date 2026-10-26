import { describe, expect, it } from 'vitest';
import { OnsetDetector, rhythmReport } from '../../src/domain/rhythm';

const SR = 8000;

/** Silence with decaying noise bursts ("strums") at the given times. */
function signal(times: number[], seconds: number): Float32Array {
  const out = new Float32Array(Math.round(seconds * SR));
  let seed = 1;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  for (const t of times) {
    const start = Math.round(t * SR);
    for (let i = 0; i < SR * 0.4 && start + i < out.length; i++) out[start + i] = (out[start + i] ?? 0) + rnd() * 0.5 * Math.exp(-i / (SR * 0.08));
  }
  for (let i = 0; i < out.length; i++) out[i] = (out[i] ?? 0) + rnd() * 0.002;
  return out;
}

describe('OnsetDetector', () => {
  it('encontra cada golpe uma vez, mesmo com blocos partidos', () => {
    const times = [0.5, 1.0, 1.5, 2.0];
    const s = signal(times, 2.6);
    const d = new OnsetDetector({ sampleRate: SR });
    const found: number[] = [];
    for (let i = 0; i < s.length; i += 1000) found.push(...d.push(s.subarray(i, i + 1000), i / SR));
    expect(found).toHaveLength(4);
    found.forEach((t, i) => expect(Math.abs(t - (times[i] ?? 0))).toBeLessThan(0.012));
  });
});

describe('rhythmReport', () => {
  const expected = Array.from({ length: 16 }, (_, i) => i * 0.5);

  it('desconta a latência do aparelho e dá 100% a quem toca certo', () => {
    const onsets = expected.map((t) => t + 0.12);
    const r = rhythmReport(onsets, expected, 0.5)!;
    expect(r.offsetMs).toBe(120);
    expect(r.onTimePercent).toBe(100);
    expect(r.spreadMs).toBe(0);
    expect(r.trend).toBe('steady');
  });

  it('deteta quem acelera e conta golpes falhados', () => {
    const onsets = expected.map((t, i) => t + 0.1 - i * 0.008).filter((_, i) => i !== 3);
    const r = rhythmReport(onsets, expected, 0.5)!;
    expect(r.matched).toBe(15);
    expect(r.trend).toBe('rushing');
    expect(r.onTimePercent).toBeLessThan(100);
  });

  it('sem golpes suficientes não inventa resultado', () => {
    expect(rhythmReport([0.1, 0.6], expected, 0.5)).toBeNull();
  });
});
