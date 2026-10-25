import { describe, expect, it } from 'vitest';
import { frequencyToMidi, frequencyToNote, midiToFrequency, pitchClassIndex } from '../../src/domain/notes';
import { fretPitchClass, nearestString } from '../../src/domain/guitar';

describe('conversão frequência ↔ nota', () => {
  it('A4 = 440 Hz corresponde a MIDI 69', () => {
    expect(frequencyToMidi(440)).toBeCloseTo(69, 6);
    expect(midiToFrequency(69)).toBeCloseTo(440, 6);
  });

  it.each([
    [82.41, 'E', 2],
    [110, 'A', 2],
    [146.83, 'D', 3],
    [196, 'G', 3],
    [246.94, 'B', 3],
    [329.63, 'E', 4],
    [261.63, 'C', 4],
  ])('%f Hz é %s%i', (freq, pc, octave) => {
    const n = frequencyToNote(freq);
    expect(n.pitchClass).toBe(pc);
    expect(n.octave).toBe(octave);
    expect(Math.abs(n.cents)).toBeLessThan(1);
  });

  it('mede desvios em cents', () => {
    const sharp = 440 * Math.pow(2, 20 / 1200);
    expect(frequencyToNote(sharp).cents).toBeCloseTo(20, 0);
    const flat = 440 * Math.pow(2, -30 / 1200);
    const n = frequencyToNote(flat);
    expect(n.pitchClass).toBe('A');
    expect(n.cents).toBeCloseTo(-30, 0);
  });

  it('respeita uma referência A4 diferente', () => {
    expect(frequencyToNote(442, 442).cents).toBe(0);
    expect(frequencyToNote(442, 440).cents).toBeCloseTo(7.9, 0);
  });

  it('rejeita frequências inválidas', () => {
    expect(() => frequencyToMidi(0)).toThrow();
    expect(() => frequencyToMidi(-10)).toThrow();
    expect(() => frequencyToMidi(Number.NaN)).toThrow();
  });

  it('aceita bemóis', () => {
    expect(pitchClassIndex('Bb')).toBe(pitchClassIndex('A#'));
    expect(() => pitchClassIndex('H')).toThrow();
  });
});

describe('braço da guitarra', () => {
  it('nomeia notas no braço em afinação padrão', () => {
    expect(fretPitchClass(6, 0)).toBe('E');
    expect(fretPitchClass(6, 1)).toBe('F');
    expect(fretPitchClass(6, 5)).toBe('A');
    expect(fretPitchClass(5, 3)).toBe('C');
    expect(fretPitchClass(3, 2)).toBe('A');
    expect(fretPitchClass(2, 1)).toBe('C');
    expect(fretPitchClass(1, 12)).toBe('E');
  });

  it('identifica a corda mais próxima', () => {
    expect(nearestString(110).string.number).toBe(5);
    expect(nearestString(80).string.number).toBe(6);
    expect(nearestString(80).cents).toBeLessThan(0);
    expect(nearestString(250).string.number).toBe(2);
  });
});
