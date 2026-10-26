import { describe, expect, it } from 'vitest';
import { chordPitchSet, chromagram, fft, judgeChord } from '../../src/domain/chordDetect';
import { beatsPerBar, buildTimeline, eventAt, repeatTimeline, score, totalBeats, verdict } from '../../src/domain/playAlong';
import { collectSlots, countLabels, slotDuration } from '../../src/domain/strumming';
import { STRUMS } from '../../src/content/strums';
import { CATALOG } from '../../src/content/songs';
import { CHORDS } from '../../src/content/chords';
import { soundingMidi } from '../../src/domain/guitar';
import { catalogEntry } from '../../src/domain/songLibrary';
import { parseChordPro } from '../../src/domain/chordpro';

const SR = 48000;

/** Guitar-like chord: every sounding string with decaying harmonics, plus some noise. */
function strum(midis: readonly number[], noise = 0.05, n = 8192): Float32Array {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647 - 0.5;
  };
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let v = 0;
    for (const m of midis) {
      const f = 440 * 2 ** ((m - 69) / 12);
      [1, 0.5, 0.35, 0.25, 0.15].forEach((a, h) => {
        v += a * Math.sin((2 * Math.PI * f * (h + 1) * i) / SR);
      });
    }
    buf[i] = v * 0.1 + noise * rand();
  }
  return buf;
}

const chromaOf = (symbol: string, noise?: number) => {
  const c = CHORDS.find((x) => x.symbol === symbol);
  if (!c) throw new Error(symbol);
  return chromagram(strum(soundingMidi(c.frets), noise), { sampleRate: SR });
};

describe('reconhecimento de acordes (cromagrama)', () => {
  it('FFT de uma sinusoide concentra a energia no bin certo', () => {
    const n = 1024;
    const re = new Float32Array(n);
    const im = new Float32Array(n);
    for (let i = 0; i < n; i++) re[i] = Math.sin((2 * Math.PI * 32 * i) / n);
    fft(re, im);
    const mags = Array.from(re, (r, i) => Math.hypot(r, im[i] ?? 0)).slice(0, n / 2);
    expect(mags.indexOf(Math.max(...mags))).toBe(32);
  });

  it('notas de acordes, incluindo baixo invertido e diminutos', () => {
    expect(chordPitchSet('G')?.sort((a, b) => a - b)).toEqual([2, 7, 11]);
    expect(chordPitchSet('Am')?.sort((a, b) => a - b)).toEqual([0, 4, 9]);
    expect(chordPitchSet('D/F#')?.sort((a, b) => a - b)).toEqual([2, 6, 9]);
    expect(chordPitchSet('Cº')?.sort((a, b) => a - b)).toEqual([0, 3, 6]);
    expect(chordPitchSet('olá')).toBeNull();
  });

  it.each(['G', 'C', 'D', 'Em', 'Am', 'E', 'A', 'Dm', 'F'])('reconhece %s tocado corretamente', (sym) => {
    expect(judgeChord(chromaOf(sym), sym).match).toBe(true);
  });

  it.each([
    ['G', 'Em'],
    ['C', 'Am'],
    ['Am', 'C'],
    ['E', 'Em'],
    ['Em', 'E'],
    ['D', 'Dm'],
    ['A', 'D'],
    ['G', 'C'],
  ])('não aceita %s quando se pedia %s', (played, expected) => {
    expect(judgeChord(chromaOf(played), expected).match).toBe(false);
  });

  it('diz o que parece estar a soar', () => {
    expect(judgeChord(chromaOf('Em'), 'G').heard).toBe('Em');
  });

  it('é tolerante com sétimas e power chords (quem toca a tríade passa)', () => {
    expect(judgeChord(chromaOf('G'), 'G7').match).toBe(true);
    expect(judgeChord(chromaOf('E'), 'E5').match).toBe(true);
    expect(judgeChord(chromaOf('B7'), 'B7').match).toBe(true);
  });

  it('continua a reconhecer com ruído moderado', () => {
    expect(judgeChord(chromaOf('C', 0.3), 'C').match).toBe(true);
  });

  it('silêncio e ruído não contam como acorde', () => {
    expect(judgeChord(chromagram(new Float32Array(8192), { sampleRate: SR }), 'G').match).toBe(false);
    let seed = 3;
    const noise = Float32Array.from({ length: 8192 }, () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647 - 0.5;
    });
    expect(judgeChord(chromagram(noise, { sampleRate: SR }), 'G').match).toBe(false);
  });
});

describe('tocar junto: linha do tempo e pontuação', () => {
  const song = catalogEntry(CATALOG.find((s) => s.id === 'tempo-perdido')!);

  it('compassos do catálogo: acordes no mesmo compasso dividem os tempos', () => {
    const t = buildTimeline(song.full.sheet, {
      beatsPerBar: 4,
      barsFromLines: true,
      beatsPerChord: 4,
    });
    expect(t.length).toBeGreaterThan(0);
    // Every bar adds up to 4 beats.
    expect(totalBeats(t) % 4).toBe(0);
    t.forEach((e, i) => {
      expect(e.index).toBe(i);
      if (i > 0) expect(e.startBeat).toBe(t[i - 1]!.startBeat + t[i - 1]!.beats);
    });
  });

  it('junta acordes repetidos seguidos e mantém a letra das cifras importadas', () => {
    const r = parseChordPro('{title: X}\n[G]Uma [G]linha [D]aqui\n[C]Outra');
    if (!r.ok) throw new Error();
    const t = buildTimeline(r.song, {
      beatsPerBar: 4,
      barsFromLines: false,
      beatsPerChord: 2,
    });
    expect(t.map((e) => [e.chord, e.beats])).toEqual([
      ['G', 4],
      ['D', 2],
      ['C', 2],
    ]);
    expect(t[0]?.lyric).toBe('Uma linha aqui');
  });

  it('repete a progressão e encontra o acorde de cada tempo', () => {
    const base = buildTimeline(song.simple.sheet, {
      beatsPerBar: 4,
      barsFromLines: true,
      beatsPerChord: 4,
    });
    const t = repeatTimeline(base, 2);
    expect(t).toHaveLength(base.length * 2);
    expect(totalBeats(t)).toBe(totalBeats(base) * 2);
    expect(eventAt(t, -1)).toBe(-1);
    expect(eventAt(t, 0)).toBe(0);
    expect(eventAt(t, totalBeats(base) + 0.1)).toBe(base.length);
    expect(eventAt(t, totalBeats(t))).toBe(-1);
  });

  it('compasso a partir da assinatura', () => {
    expect(beatsPerBar('3/4')).toBe(3);
    expect(beatsPerBar('6/8')).toBe(6);
    expect(beatsPerBar(null)).toBe(4);
    expect(beatsPerBar('lixo')).toBe(4);
  });

  it('classifica cada acorde e calcula a pontuação', () => {
    expect(verdict({ frames: 10, voiced: 8, matched: 4 })).toBe('hit');
    expect(verdict({ frames: 10, voiced: 8, matched: 1 })).toBe('miss');
    expect(verdict({ frames: 10, voiced: 1, matched: 1 })).toBe('silent');
    expect(score(['hit', 'hit', 'miss', 'hit', 'silent'])).toEqual({
      hits: 3,
      misses: 1,
      silent: 1,
      percent: 60,
      bestStreak: 2,
    });
    expect(score([]).percent).toBe(0);
  });
});

describe('batidas', () => {
  it('cada padrão tem um golpe por subdivisão e dados coerentes', () => {
    const ids = new Set<string>();
    for (const p of STRUMS) {
      expect(ids.has(p.id)).toBe(false);
      ids.add(p.id);
      expect(p.strokes).toHaveLength(p.beats * p.subdivision);
      expect(p.strokes.some((s) => s !== '-')).toBe(true);
      for (const a of p.accents ?? []) expect(a).toBeLessThan(p.strokes.length);
      expect(p.bpm.start).toBeLessThanOrEqual(p.bpm.target);
      for (const id of p.songIds ?? []) expect(CATALOG.some((s) => s.id === id)).toBe(true);
    }
  });

  it('rótulos de contagem', () => {
    expect(countLabels({ beats: 2, subdivision: 2 })).toEqual(['1', 'e', '2', 'e']);
    expect(countLabels({ beats: 1, subdivision: 3 })).toEqual(['1', 'e', 'a']);
    expect(countLabels({ beats: 1, subdivision: 4 })).toEqual(['1', 'e', '&', 'a']);
  });

  it('agenda subdivisões sem saltar nem duplicar, e recupera de atrasos', () => {
    const d = slotDuration(120, 2);
    expect(d).toBeCloseTo(0.25);
    let state = { nextTime: 0, slot: 0 };
    const seen: number[] = [];
    for (let now = 0; now < 2; now += 0.025) {
      const r = collectSlots(state, now, 0.1, d);
      state = r.state;
      seen.push(...r.slots.map((s) => s.slot));
    }
    expect(seen).toEqual([...Array(seen.length).keys()]);
    // Tab was in background for 5 s: no burst of old slots.
    const late = collectSlots(state, 7, 0.1, d);
    expect(late.slots.length).toBeLessThanOrEqual(1);
    expect(late.slots[0]!.time).toBeGreaterThanOrEqual(7);
  });
});

describe('sensibilidade do Tocar junto', () => {
  it('a sensibilidade alta aceita menos reconhecimentos do que a baixa', async () => {
    const { THRESHOLDS, verdict } = await import('../../src/domain/playAlong');
    const t = { frames: 10, voiced: 10, matched: 3 };
    expect(verdict(t, THRESHOLDS.high.hitRatio)).toBe('hit');
    expect(verdict(t, THRESHOLDS.normal.hitRatio)).toBe('miss');
    expect(verdict(t, THRESHOLDS.low.hitRatio)).toBe('miss');
    expect(THRESHOLDS.high.minSimilarity).toBeLessThan(THRESHOLDS.low.minSimilarity);
  });
});
