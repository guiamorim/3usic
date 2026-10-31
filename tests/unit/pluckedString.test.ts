import { describe, expect, it } from 'vitest';
import { pluckedString } from '../../src/audio/pluckedString';
import { detectPitch, rms } from '../../src/audio/pitch';

const SR = 48000;
const cents = (f: number, ref: number) => 1200 * Math.log2(f / ref);

describe('pluckedString', () => {
  for (const [name, f] of [
    ['6.ª corda (Mi2)', 82.41],
    ['5.ª corda (Lá2)', 110],
    ['3.ª corda (Sol3)', 196],
    ['1.ª corda (Mi4)', 329.63],
  ] as const) {
    it(`soa afinada: ${name}`, () => {
      const s = pluckedString(f, SR, 1.5);
      const window = s.slice(Math.round(0.4 * SR), Math.round(0.4 * SR) + 4096);
      const p = detectPitch(window, { sampleRate: SR });
      expect(p).not.toBeNull();
      expect(Math.abs(cents(p!.frequency, f))).toBeLessThan(3);
    });
  }

  it('decai como uma corda e não satura', () => {
    const s = pluckedString(110, SR, 3, { sustain: 3 });
    expect(s.reduce((m, v) => Math.max(m, Math.abs(v)), 0)).toBeLessThanOrEqual(0.9001);
    const early = rms(s.slice(0, SR / 4));
    const late = rms(s.slice(2.5 * SR, 2.75 * SR));
    expect(late).toBeLessThan(early / 10);
    expect(late).toBeGreaterThan(0);
  });
});
