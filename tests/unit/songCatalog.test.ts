import { describe, expect, it } from 'vitest';
import { CATALOG, decadeLabel, decadeOf } from '../../src/content/songs';
import { isChordSymbol, matchChord } from '../../src/domain/chordSymbols';
import { allSongs, catalogEntries, EMPTY_FILTER, facets, filterSongs, findSong, missingCount, versionOf } from '../../src/domain/songLibrary';
import { GenreSchema } from '../../src/storage/schema';

describe('catálogo de músicas', () => {
  it('ids únicos e metadados válidos', () => {
    const ids = CATALOG.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of CATALOG) {
      expect(GenreSchema.safeParse(s.genre).success, s.id).toBe(true);
      expect(isChordSymbol(s.key), `${s.id} tom`).toBe(true);
      expect(s.capo).toBeGreaterThanOrEqual(0);
      expect(s.capo).toBeLessThanOrEqual(9);
      expect(/^\d\/\d$/.test(s.time), `${s.id} compasso`).toBe(true);
      // Either a progression (copyrighted song, no lyrics) or a full public-domain sheet — never both.
      expect(Boolean(s.progression) !== Boolean(s.chordpro), s.id).toBe(true);
    }
  });

  it('todas as progressões contêm apenas acordes reconhecidos', () => {
    for (const s of CATALOG) {
      for (const part of s.progression ?? []) {
        for (const token of part.chords.split(/\s+/).filter((t) => t && t !== '|')) {
          expect(isChordSymbol(token), `${s.id}: ${token}`).toBe(true);
        }
      }
    }
  });

  it('as folhas de domínio público são lidas sem avisos', () => {
    for (const e of catalogEntries().filter((x) => x.fullSheet)) {
      expect(e.full.sheet.warnings, e.id).toEqual([]);
      expect(e.full.chords.length, e.id).toBeGreaterThan(1);
    }
  });

  it('todos os acordes das versões simplificadas têm diagrama na biblioteca', () => {
    const symbols = new Set(catalogEntries().flatMap((e) => e.simple.chords));
    const missing = [...symbols].filter((s) => !matchChord(s)?.chord);
    expect(missing).toEqual([]);
  });

  it('na versão original só faltam diagramas de acordes de passagem', () => {
    const symbols = new Set(catalogEntries().flatMap((e) => e.full.chords));
    const missing = [...symbols].filter((s) => !matchChord(s)?.chord);
    for (const m of missing) expect(m, m).toMatch(/dim|º|°|5\+|aug/);
  });

  it('a versão simplificada nunca tem mais acordes diferentes do que a original', () => {
    for (const e of catalogEntries()) {
      expect(e.simple.chords.length, e.id).toBeLessThanOrEqual(e.full.chords.length);
      if (!e.hasSimple) expect(e.simple.sequence).toEqual(e.full.sequence);
    }
    const ev = catalogEntries().find((e) => e.id === 'evidencias')!;
    expect(ev.hasSimple).toBe(true);
    expect(ev.simple.chords).not.toContain('Cº');
    expect(ev.simple.chords).not.toContain('E/G#');
  });

  it('há rock clássico de cada país pedido, com acordes conferidos', () => {
    const rock = catalogEntries().filter((e) => e.genre === 'rock');
    for (const o of ['BR', 'PT', 'US', 'UK'] as const) {
      expect(rock.filter((e) => e.origin === o && e.chordSource).length, o).toBeGreaterThanOrEqual(5);
    }
  });

  it('décadas', () => {
    expect(decadeOf(1994)).toBe(1990);
    expect(decadeOf(1779)).toBe(1800);
    expect(decadeLabel(1990)).toBe('Anos 90 (1990)');
    expect(decadeLabel(1800)).toBe('Antes de 1900');
  });
});

describe('pesquisa e filtros', () => {
  const songs = allSongs([
    { id: 'song-x', title: 'Minha Canção', artist: 'Eu', genre: 'outro', year: 2024, chordpro: '[C]a [G]b', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  ]);

  it('mostra primeiro as importadas e depois os estilos preferidos', () => {
    const r = filterSongs(songs, EMPTY_FILTER, new Set(), ['blues']);
    expect(r[0]?.id).toBe('song-x');
    expect(r[1]?.genre).toBe('blues');
  });

  it('filtra por estilo, década, artista, dificuldade, texto e origem', () => {
    expect(filterSongs(songs, { ...EMPTY_FILTER, genre: 'mpb-bossa' }, new Set()).every((s) => s.genre === 'mpb-bossa')).toBe(true);
    expect(filterSongs(songs, { ...EMPTY_FILTER, decade: 1990 }, new Set()).map((s) => s.id)).toContain('wonderwall');
    expect(filterSongs(songs, { ...EMPTY_FILTER, artist: 'The Beatles' }, new Set()).map((s) => s.id).sort()).toEqual(['here-comes-the-sun', 'hey-jude', 'let-it-be']);
    expect(filterSongs(songs, { ...EMPTY_FILTER, query: 'cancao' }, new Set()).map((s) => s.id)).toEqual(['song-x']);
    expect(filterSongs(songs, { ...EMPTY_FILTER, difficulty: 1 }, new Set()).every((s) => versionOf(s, 'simple').difficulty === 1)).toBe(true);
    expect(filterSongs(songs, { ...EMPTY_FILTER, origin: 'PT' }, new Set()).every((s) => s.origin === 'PT')).toBe(true);
    expect(filterSongs(songs, { ...EMPTY_FILTER, source: 'full' }, new Set()).every((s) => s.fullSheet)).toBe(true);
    expect(filterSongs(songs, { ...EMPTY_FILTER, source: 'user' }, new Set())).toHaveLength(1);
  });

  it('«já consigo tocar» usa os acordes conhecidos', () => {
    const known = new Set(['G', 'D', 'Am', 'C']);
    const r = filterSongs(songs, { ...EMPTY_FILTER, playableOnly: true }, known);
    expect(r.map((s) => s.id)).toContain('knockin-on-heavens-door');
    expect(r.every((s) => missingCount(versionOf(s, 'simple'), known) <= 1)).toBe(true);
  });

  it('facetas e procura por id', () => {
    const f = facets(songs);
    expect(f.decades[0]).toBe(1800);
    expect(f.artists).toContain('Oasis');
    expect(findSong('song-x', [])).toBeUndefined();
    expect(findSong('let-it-be', [])?.full.chords).toEqual(['C', 'G', 'Am', 'F']);
    expect(f.origins).toEqual(expect.arrayContaining(['BR', 'PT', 'US', 'UK']));
  });
});

describe('secção infantis e festas', () => {
  it('fica separada da lista principal e inclui o Parabéns PT e BR só com acordes', () => {
    const songs = allSongs([]);
    const kids = filterSongs(songs, { ...EMPTY_FILTER, collection: 'infantil' }, new Set());
    const main = filterSongs(songs, EMPTY_FILTER, new Set());
    expect(kids.length).toBeGreaterThanOrEqual(15);
    expect(kids.every((s) => s.kids)).toBe(true);
    expect(main.some((s) => s.kids)).toBe(false);
    for (const id of ['parabens-a-voce-br', 'parabens-a-voce-pt']) {
      const s = findSong(id, [])!;
      expect(s.kids).toBe(true);
      expect(s.fullSheet).toBe(false);
    }
    expect(new Set(kids.map((s) => s.origin))).toEqual(new Set(['BR', 'PT']));
    // Beginner-friendly: every children's song uses at most 4 different chords.
    for (const s of kids) expect(versionOf(s, 'simple').chords.length, s.id).toBeLessThanOrEqual(4);
  });
});
