import { describe, expect, it } from 'vitest';
import { bpmFromTaps, clampBpm, collectBeats, TIME_SIGNATURES } from '../../src/audio/metronomeScheduler';

const FOUR = TIME_SIGNATURES.find((t) => t.label === '4/4')!;
const THREE = TIME_SIGNATURES.find((t) => t.label === '3/4')!;

describe('agendamento do metrónomo', () => {
  it('agenda batidas espaçadas exatamente segundo o BPM', () => {
    const { beats } = collectBeats({ nextBeatTime: 0, beatInBar: 0 }, 0, 2.01, 120, FOUR, true);
    expect(beats.map((b) => b.time)).toEqual([0, 0.5, 1, 1.5, 2]);
  });

  it('acentua só o primeiro tempo do compasso', () => {
    const { beats } = collectBeats({ nextBeatTime: 0, beatInBar: 0 }, 0, 3.5, 60, THREE, true);
    expect(beats.map((b) => b.accent)).toEqual([true, false, false, true]);
    const noAccent = collectBeats({ nextBeatTime: 0, beatInBar: 0 }, 0, 3.5, 60, THREE, false);
    expect(noAccent.beats.every((b) => !b.accent)).toBe(true);
  });

  it('continua sem duplicar nem saltar batidas entre chamadas sucessivas', () => {
    let state = { nextBeatTime: 0, beatInBar: 0 };
    const times: number[] = [];
    for (let now = 0; now < 5; now += 0.025) {
      const r = collectBeats(state, now, 0.1, 100, FOUR, true);
      state = r.state;
      times.push(...r.beats.map((b) => b.time));
    }
    for (let i = 1; i < times.length; i++) expect(times[i]! - times[i - 1]!).toBeCloseTo(0.6, 9);
  });

  it('salta batidas perdidas (separador em segundo plano) em vez de as disparar todas', () => {
    const r = collectBeats({ nextBeatTime: 0, beatInBar: 0 }, 10, 0.1, 60, FOUR, true);
    expect(r.beats.length).toBeLessThanOrEqual(1);
    expect(r.beats[0]!.time).toBeGreaterThanOrEqual(9);
  });

  it('limita o BPM a valores válidos', () => {
    expect(clampBpm(10)).toBe(30);
    expect(clampBpm(999)).toBe(240);
    expect(clampBpm(Number.NaN)).toBe(80);
    expect(clampBpm(99.6)).toBe(100);
  });

  it('calcula o andamento por toques', () => {
    expect(bpmFromTaps([0, 500, 1000, 1500])).toBe(120);
    expect(bpmFromTaps([0])).toBeNull();
    // Old taps (> 2 s gap) are ignored.
    expect(bpmFromTaps([0, 5000, 6000, 7000])).toBe(60);
  });
});
