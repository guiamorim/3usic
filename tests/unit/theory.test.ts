import { describe, expect, it } from 'vitest';
import { chordPitchClasses, diatonicChords, intervalBetween, spell, spelledMajorScale, spelledTriad, totalBeats } from '../../src/domain/theory';

describe('teoria musical', () => {
  it('forma tríades com a ortografia correta', () => {
    expect(spelledTriad('C', 'major')).toEqual(['C', 'E', 'G']);
    expect(spelledTriad('C', 'minor')).toEqual(['C', 'E♭', 'G']);
    expect(spelledTriad('D', 'major')).toEqual(['D', 'F♯', 'A']);
    expect(spelledTriad('F', 'minor')).toEqual(['F', 'A♭', 'C']);
    expect(spelledTriad('B', 'dim')).toEqual(['B', 'D', 'F']);
    expect(spelledTriad('C', 'aug')).toEqual(['C', 'E', 'G♯']);
  });

  it('escreve escalas maiores sem misturar sustenidos e bemóis', () => {
    expect(spelledMajorScale('C')).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
    expect(spelledMajorScale('G')).toEqual(['G', 'A', 'B', 'C', 'D', 'E', 'F♯']);
    expect(spelledMajorScale('F')).toEqual(['F', 'G', 'A', 'B♭', 'C', 'D', 'E']);
    expect(spelledMajorScale('E')).toEqual(['E', 'F♯', 'G♯', 'A', 'B', 'C♯', 'D♯']);
    expect(spell('B♭', 2, 4)).toBe('D');
  });

  it('calcula o campo harmónico maior', () => {
    expect(diatonicChords('G').map((c) => c.symbol)).toEqual(['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F♯dim']);
    expect(diatonicChords('F').map((c) => c.symbol)[3]).toBe('B♭');
  });

  it('calcula intervalos e classes de altura', () => {
    expect(intervalBetween('C', 'G')).toBe(7);
    expect(intervalBetween('G', 'C')).toBe(5);
    expect(chordPitchClasses('A', 'minor')).toEqual(['A', 'C', 'E']);
  });

  it('soma figuras rítmicas', () => {
    expect(totalBeats(['minima', 'seminima', 'colcheia', 'colcheia'])).toBe(4);
    expect(totalBeats([])).toBe(0);
  });
});
