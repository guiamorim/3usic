import { describe, expect, it } from 'vitest';
import { CHORDS, chordById, chordFullName, searchChords } from '../../src/content/chords';
import { bassPitchClass, soundingMidi, soundingPitchClasses } from '../../src/domain/guitar';
import { chordPitchClasses } from '../../src/domain/theory';

describe('biblioteca de acordes — correção musical', () => {
  it.each(CHORDS.map((c) => [c.id, c] as const))('%s soa exatamente as notas do acorde', (_id, chord) => {
    const expected = new Set(chordPitchClasses(chord.root, chord.quality));
    const sounding = soundingPitchClasses(chord.frets);
    // Every sounding note belongs to the chord…
    for (const pc of sounding) expect(expected).toContain(pc);
    // …and every chord tone is present. In four-note chords the perfect fifth may be omitted
    // (standard practice, e.g. the open C7 shape x32310).
    const fifth = chordPitchClasses(chord.root, 'major')[2];
    for (const pc of expected) {
      if (expected.size === 4 && pc === fifth) continue;
      expect(sounding).toContain(pc);
    }
  });

  it.each(CHORDS.map((c) => [c.id, c] as const))('%s tem a fundamental no baixo', (_id, chord) => {
    expect(bassPitchClass(chord.frets)).toBe(chord.root);
  });

  it.each(CHORDS.map((c) => [c.id, c] as const))('%s tem dedilhação coerente', (_id, chord) => {
    chord.frets.forEach((fret, i) => {
      const finger = chord.fingers[i] ?? 0;
      if (fret <= 0) expect(finger).toBe(0);
      else expect(finger).toBeGreaterThanOrEqual(1);
      expect(finger).toBeLessThanOrEqual(4);
    });
    expect(soundingMidi(chord.frets).length).toBeGreaterThanOrEqual(3);
    // A finger can't be on two different frets at once.
    const fretByFinger = new Map<number, number>();
    chord.frets.forEach((fret, i) => {
      const finger = chord.fingers[i] ?? 0;
      if (finger === 0) return;
      const prev = fretByFinger.get(finger);
      if (prev !== undefined) expect(prev).toBe(fret);
      fretByFinger.set(finger, fret);
    });
    // Span must be playable (≤ 4 frets).
    const pressed = chord.frets.filter((f) => f > 0);
    if (pressed.length) expect(Math.max(...pressed) - Math.min(...pressed)).toBeLessThanOrEqual(3);
  });

  it('as pestanas cobrem cordas com o indicador na casa indicada', () => {
    for (const c of CHORDS.filter((x) => x.barre)) {
      const b = c.barre!;
      for (let s = b.fromString; s >= b.toString; s--) {
        const fret = c.frets[6 - s];
        expect(fret, `${c.id} corda ${s}`).toBeGreaterThanOrEqual(b.fret);
      }
      expect(c.fingers[6 - b.fromString]).toBe(1);
      expect(c.fingers[6 - b.toString]).toBe(1);
    }
  });

  it('ids são únicos e transições apontam para acordes existentes', () => {
    const ids = CHORDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of CHORDS) for (const t of c.transitions) expect(chordById(t), `${c.id} → ${t}`).toBeDefined();
  });
});

describe('pesquisa de acordes', () => {
  it('encontra por símbolo, nome e categoria, sem acentos', () => {
    expect(searchChords('am').map((c) => c.id)).toEqual(expect.arrayContaining(['Am', 'Am7']));
    expect(searchChords('re menor').map((c) => c.id)).toContain('Dm');
    expect(searchChords('pestana').length).toBeGreaterThan(3);
    expect(searchChords('').length).toBe(CHORDS.length);
    expect(searchChords('zzz')).toEqual([]);
  });

  it('dá nomes em português', () => {
    expect(chordFullName(chordById('Bb')!)).toBe('Si♭ maior');
    expect(chordFullName(chordById('Am')!)).toBe('Lá menor');
  });
});
