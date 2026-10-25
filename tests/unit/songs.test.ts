import { describe, expect, it } from 'vitest';
import { isChordSymbol, matchChord, parseChordSymbol, simplifyQuality, simplifySymbol, transposeSymbol } from '../../src/domain/chordSymbols';
import {
  detectFormat,
  isChordLine,
  mergeChordLine,
  parseChordPro,
  parsePlainText,
  parseSongText,
  songChords,
  songChordSequence,
  toChordPro,
  transposeSong,
  MAX_SONG_CHARS,
  type ParsedSong,
} from '../../src/domain/chordpro';
import { analyzeChords, buildSongPlan, chordTransitions, knownChordIds, slowTempo, songDifficulty, songFocus, suggestCapo } from '../../src/domain/songPlan';

function ok(r: ReturnType<typeof parseSongText>): ParsedSong {
  if (!r.ok) throw new Error(r.error);
  return r.song;
}

describe('símbolos de acordes', () => {
  it('reconhece acordes comuns e rejeita palavras', () => {
    for (const s of ['C', 'Am', 'F#m', 'Bb', 'G7', 'Cmaj7', 'Dsus4', 'E5', 'D/F#', 'Cadd9', 'Am7(b5)', 'C7M', 'Bm7b5', 'A°', 'Eb', 'G/B', 'F7+', 'E5+', 'Cº', 'G4/B', 'A9', 'F#m7(11)', 'C#m7/B', 'D7(9)', 'E7(#9)', 'Bb9']) {
      expect(isChordSymbol(s), s).toBe(true);
    }
    for (const s of ['Amor', 'Dia', 'Em-te', 'Ele', 'Bom', 'Am,', 'H', 'Cantar', '']) expect(isChordSymbol(s), s).toBe(false);
  });

  it('extrai fundamental, sufixo e baixo', () => {
    expect(parseChordSymbol('D/F#')).toMatchObject({ root: 'D', suffix: '', bass: 'F#' });
    expect(parseChordSymbol('Bbm7')).toMatchObject({ root: 'A#', rootName: 'Bb', suffix: 'm7' });
    expect(parseChordSymbol('C♯m')).toMatchObject({ root: 'C#', rootName: 'C#', suffix: 'm' });
  });

  it('simplifica qualidades para as da biblioteca', () => {
    expect(simplifyQuality('add9')).toBe('major');
    expect(simplifyQuality('7M')).toBe('maj7');
    // Bare «9» is add9 in Brazilian notation; a triad is safe either way.
    expect(simplifyQuality('9')).toBe('major');
    expect(simplifyQuality('7(9)')).toBe('7');
    expect(simplifyQuality('7+')).toBe('maj7');
    expect(simplifyQuality('4')).toBe('sus4');
    expect(simplifyQuality('m7(11)')).toBe('m7');
    expect(simplifyQuality('5+')).toBeNull();
    expect(simplifyQuality('º')).toBeNull();
    expect(simplifyQuality('sus')).toBe('sus4');
    expect(simplifyQuality('dim')).toBeNull();
  });

  it('associa ao acorde mais fácil da biblioteca', () => {
    expect(matchChord('F')?.chord?.id).toBe('F-simples');
    expect(matchChord('Am')).toMatchObject({ chord: { id: 'Am' }, simplified: false });
    expect(matchChord('Cadd9')).toMatchObject({ chord: { id: 'C' }, simplified: true });
    expect(matchChord('D/F#')).toMatchObject({ chord: { id: 'D' }, simplified: true });
    // No Gmaj7 shape in the library: falls back to G.
    expect(matchChord('Gmaj7')).toMatchObject({ chord: { id: 'G' }, simplified: true });
    expect(matchChord('Bdim')?.chord).toBeNull();
    expect(matchChord('palavra')).toBeNull();
  });

  it('gera a versão simplificada de cada acorde', () => {
    expect(simplifySymbol('D/F#')).toBe('D');
    expect(simplifySymbol('Am7')).toBe('Am');
    expect(simplifySymbol('Cmaj7')).toBe('C');
    expect(simplifySymbol('F7+/A')).toBe('F');
    expect(simplifySymbol('G4/B')).toBe('G');
    expect(simplifySymbol('E7')).toBe('E7');
    expect(simplifySymbol('B7')).toBe('B7');
    // No F#7 diagram in the library: falls back to the triad.
    expect(simplifySymbol('F#7')).toBe('F#');
    expect(simplifySymbol('A5')).toBe('A5');
    expect(simplifySymbol('Cº')).toBeNull();
    expect(simplifySymbol('E5+')).toBeNull();
    expect(simplifySymbol('palavra')).toBeNull();
  });

  it('transpõe mantendo o sufixo e o baixo', () => {
    expect(transposeSymbol('Am7', 2)).toBe('Bm7');
    expect(transposeSymbol('D/F#', -2)).toBe('C/E');
    expect(transposeSymbol('G', 3, true)).toBe('Bb');
    expect(transposeSymbol('G', 3)).toBe('A#');
    expect(transposeSymbol('C', -1)).toBe('B');
    expect(transposeSymbol('Em', 12)).toBe('Em');
    expect(transposeSymbol('texto', 2)).toBe('texto');
  });
});

describe('parser ChordPro', () => {
  const sample = `{title: Canção de Teste}
{artist: Autor}
{key: G}
{capo: 2}
{tempo: 90}
{time: 3/4}
# comentário ignorado

[G]Primeira [D]linha da [Em]letra
Sem acordes nesta

{start_of_chorus}
[C]Refrão [G]aqui
{end_of_chorus}
{c: Repetir 2x}
{chorus}
{start_of_tab}
e|---0---3---|
{end_of_tab}
{xpto: desconhecida}`;

  it('lê metadados, secções e acordes', () => {
    const r = parseChordPro(sample);
    expect(r.ok).toBe(true);
    const song = ok(r);
    expect(song.meta).toMatchObject({ title: 'Canção de Teste', artist: 'Autor', key: 'G', capo: 2, tempo: 90, time: '3/4' });
    expect(songChords(song)).toEqual(['G', 'D', 'Em', 'C']);
    expect(songChordSequence(song)).toEqual(['G', 'D', 'Em', 'C', 'G']);
    const chorus = song.sections.find((s) => s.type === 'chorus');
    expect(chorus?.label).toBe('Refrão');
    expect(song.sections.find((s) => s.type === 'tab')?.lines[0]).toEqual({ kind: 'tab', text: 'e|---0---3---|' });
    expect(song.warnings.join(' ')).toContain('xpto');
  });

  it('divide a linha em segmentos acorde+texto', () => {
    const song = ok(parseChordPro('Antes [G]Pri[D]meira'));
    expect(song.sections[0]?.lines[0]).toEqual({
      kind: 'lyrics',
      segments: [
        { chord: null, text: 'Antes ' },
        { chord: 'G', text: 'Pri' },
        { chord: 'D', text: 'meira' },
      ],
    });
  });

  it('separa estrofes por linhas em branco', () => {
    const song = ok(parseChordPro('[C]um\n[G]dois\n\n\n[Am]três'));
    expect(song.sections).toHaveLength(2);
  });

  it('volta a ler o próprio ChordPro sem perder conteúdo', () => {
    const song = ok(parseChordPro(sample));
    const again = ok(parseChordPro(toChordPro(song)));
    expect(again.meta).toEqual(song.meta);
    expect(songChordSequence(again)).toEqual(songChordSequence(song));
    expect(again.sections.map((s) => s.type)).toEqual(song.sections.map((s) => s.type));
  });

  it('neutraliza parênteses retos e chavetas na letra ao serializar', () => {
    const song: ParsedSong = {
      meta: { title: 'X', artist: '', key: null, capo: 0, tempo: null, time: null, year: null },
      sections: [{ type: 'other', label: null, lines: [{ kind: 'lyrics', segments: [{ chord: 'C', text: '{title: hack} [G]' }] }] }],
      warnings: [],
    };
    const again = ok(parseChordPro(toChordPro(song)));
    expect(again.meta.title).toBe('X');
    expect(songChordSequence(again)).toEqual(['C']);
  });

  it('rejeita texto vazio, enorme ou com demasiadas linhas', () => {
    expect(parseChordPro('   ').ok).toBe(false);
    expect(parseChordPro('a'.repeat(MAX_SONG_CHARS + 1)).ok).toBe(false);
    expect(parseChordPro('[C]x\n'.repeat(4000)).ok).toBe(false);
  });

  it('remove caracteres de controlo e ignora valores de metadados inválidos', () => {
    const song = ok(parseChordPro('{title: A\u0000B‮}\n{capo: muitos}\n{tempo: 9999}\n[C]ok'));
    expect(song.meta.title).toBe('AB');
    expect(song.meta.capo).toBe(0);
    expect(song.meta.tempo).toBeNull();
    expect(song.warnings.length).toBeGreaterThanOrEqual(2);
  });
});

describe('parser de texto simples (acordes por cima da letra)', () => {
  it('deteta linhas de acordes', () => {
    expect(isChordLine('G        D/F#     Em   C')).toBe(true);
    expect(isChordLine('| Am  | F  | C  G |  (2x)')).toBe(true);
    expect(isChordLine('Em casa de ferreiro')).toBe(false);
    expect(isChordLine('A casa')).toBe(false);
  });

  it('junta acordes e letra por coluna', () => {
    expect(mergeChordLine('    G       D', 'Era uma vez um gato')).toEqual([
      { chord: null, text: 'Era ' },
      { chord: 'G', text: 'uma vez ' },
      { chord: 'D', text: 'um gato' },
    ]);
    // Chord past the end of the lyric keeps an empty segment.
    expect(mergeChordLine('G          C', 'Olá')).toEqual([
      { chord: 'G', text: 'Olá' },
      { chord: 'C', text: '' },
    ]);
  });

  const cifra = `Canção Inventada - Banda Exemplo
Tom: D
Capo: 2

[Intro] D  A  Bm  G

[Primeira Parte]
D               A
Caminho pela rua
Bm              G
Sem saber para onde

[Refrão]
G    A       D
Canta comigo
Esta linha não tem acordes

E|-----2-----|
B|---3---3---|`;

  it('lê cabeçalho, secções e acordes', () => {
    const song = ok(parsePlainText(cifra));
    expect(song.meta).toMatchObject({ title: 'Canção Inventada', artist: 'Banda Exemplo', key: 'D', capo: 2 });
    expect(songChords(song)).toEqual(['D', 'A', 'Bm', 'G']);
    expect(song.sections.map((s) => s.label)).toEqual(['Intro', 'Primeira Parte', 'Refrão']);
    expect(song.sections.map((s) => s.type)).toEqual(['other', 'other', 'chorus']);
    expect(song.sections.at(-1)?.lines.filter((l) => l.kind === 'tab')).toHaveLength(2);
    expect(song.sections[1]?.lines.filter((l) => l.kind === 'lyrics')).toHaveLength(2);
  });

  it('deteta o formato automaticamente', () => {
    expect(detectFormat(cifra)).toBe('plain');
    expect(detectFormat('{title: x}\n[C]a')).toBe('chordpro');
    expect(detectFormat('[C]um [G]dois')).toBe('chordpro');
    expect(detectFormat('[Refrão]\nC G\nlá lá')).toBe('plain');
  });

  it('converte texto simples em ChordPro equivalente', () => {
    const song = ok(parsePlainText(cifra));
    const cp = toChordPro(song);
    expect(cp).toContain('{title: Canção Inventada}');
    expect(cp).toContain('[D]Caminho pela rua');
    const again = ok(parseChordPro(cp));
    expect(songChordSequence(again)).toEqual(songChordSequence(song));
  });

  it('avisa quando não encontra acordes', () => {
    const song = ok(parseSongText('Só letra\nsem nada'));
    expect(song.warnings.join(' ')).toMatch(/acordes/);
  });
});

describe('transposição de músicas', () => {
  it('transpõe todos os acordes e o tom', () => {
    const song = ok(parseChordPro('{key: G}\n[G]a [D/F#]b [Em]c'));
    const up = transposeSong(song, 2);
    expect(up.meta.key).toBe('A');
    expect(songChordSequence(up)).toEqual(['A', 'E/G#', 'F#m']);
    expect(transposeSong(song, 0)).toBe(song);
  });
});

describe('plano por música', () => {
  it('conhece os acordes das lições concluídas e os marcados', () => {
    const known = knownChordIds(new Set(['l4-1']), ['Bm']);
    expect(known.has('Em')).toBe(true);
    expect(known.has('Bm')).toBe(true);
    expect(known.has('G')).toBe(false);
  });

  it('analisa acordes conhecidos, em falta e não suportados', () => {
    const info = analyzeChords(['G', 'D', 'G', 'Bdim', 'F'], new Set(['G', 'F']));
    expect(info.map((i) => [i.symbol, i.chord?.id ?? null, i.known])).toEqual([
      ['G', 'G', true],
      ['D', 'D', false],
      ['Bdim', null, false],
      ['F', 'F-simples', true],
    ]);
  });

  it('conta mudanças entre acordes sem direção', () => {
    const t = chordTransitions(['G', 'D', 'G', 'D', 'Em', 'Em', 'C']);
    expect(t[0]).toMatchObject({ count: 3 });
    expect([t[0]?.a, t[0]?.b].sort()).toEqual(['D', 'G']);
    expect(t).toHaveLength(3);
  });

  it('gera passos: aprender, mudanças, lento, ritmo real', () => {
    const plan = buildSongPlan({ sequence: ['G', 'D', 'Em', 'C', 'G', 'D'], known: new Set(['G', 'D']), tempo: 100 });
    expect(plan.readiness).toBe(0.5);
    expect(plan.steps.filter((s) => s.kind === 'learn').map((s) => (s.kind === 'learn' ? s.chordId : ''))).toEqual(['Em', 'C']);
    expect(plan.steps.filter((s) => s.kind === 'changes')).toHaveLength(3);
    expect(plan.steps.at(-2)).toEqual({ kind: 'slow', bpm: 60 });
    expect(plan.steps.at(-1)).toEqual({ kind: 'full', bpm: 100 });
  });

  it('andamento lento razoável', () => {
    expect(slowTempo(null)).toBe(60);
    expect(slowTempo(60)).toBe(40);
    expect(slowTempo(140)).toBe(85);
  });

  it('sugere capo quando simplifica claramente', () => {
    // Eb – Cm – Ab – Bb is all barre chords; capo 3 gives C – Am – F – G.
    const s = suggestCapo(['Eb', 'Cm', 'Ab', 'Bb'], new Set(['C', 'Am', 'G', 'F']));
    expect(s?.capo).toBe(3);
    expect(s?.shapes).toEqual(['C', 'Am', 'F', 'G']);
    // Already easy: no suggestion.
    expect(suggestCapo(['G', 'C', 'D'], new Set(['G', 'C', 'D']))).toBeNull();
  });

  it('estima a dificuldade pelo acorde mais difícil', () => {
    expect(songDifficulty(['E', 'A', 'D'])).toBe(1);
    expect(songDifficulty(['G', 'C', 'D'])).toBe(2);
    expect(songDifficulty(['G', 'Bm'])).toBe(3);
    expect(songDifficulty(['C', 'Bdim'])).toBe(3);
  });

  it('resume o foco do dia', () => {
    const learn = buildSongPlan({ sequence: ['G', 'D', 'Em', 'C'], known: new Set(['G', 'D']), tempo: 100 });
    expect(songFocus(learn)).toBe('aprende os acordes Em e C.');
    const ready = buildSongPlan({ sequence: ['G', 'D', 'G'], known: new Set(['G', 'D']), tempo: null });
    expect(songFocus(ready)).toBe('treina a mudança G ↔ D e toca-a do início ao fim a 60 BPM.');
  });
});
