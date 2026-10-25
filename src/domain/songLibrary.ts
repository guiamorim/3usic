// Unifies catalogue songs and user-imported songs into one searchable list.
import { CATALOG, decadeOf, type CatalogSong, type ProgressionPart } from '../content/songs';
import type { Genre, UserSong } from '../storage/schema';
import { parseChordPro, songChords, songChordSequence, type ParsedSong, type SongSection } from './chordpro';
import { isChordSymbol } from './chordSymbols';
import { analyzeChords, songDifficulty } from './songPlan';

export interface SongEntry {
  id: string;
  source: 'catalog' | 'user';
  title: string;
  artist: string;
  year: number | null;
  yearApprox: boolean;
  genre: Genre;
  /** True when the sheet includes lyrics (public-domain or imported). */
  fullSheet: boolean;
  sheet: ParsedSong;
  /** Chords in playing order. */
  sequence: string[];
  chords: string[];
  difficulty: 1 | 2 | 3;
  strum?: string;
  note?: string;
}

function progressionSections(parts: readonly ProgressionPart[]): SongSection[] {
  return parts.map((p) => ({
    type: 'other' as const,
    label: p.label,
    lines: p.chords
      .split('|')
      .map((bar) => bar.trim().split(/\s+/).filter(isChordSymbol))
      .filter((chords) => chords.length > 0)
      .map((chords) => ({ kind: 'lyrics' as const, segments: chords.map((chord) => ({ chord, text: '' })) })),
  }));
}

function emptySheet(title: string): ParsedSong {
  return { meta: { title, artist: '', key: null, capo: 0, tempo: null, time: null, year: null }, sections: [], warnings: [] };
}

function entry(base: Omit<SongEntry, 'sequence' | 'chords' | 'difficulty'>): SongEntry {
  const sequence = songChordSequence(base.sheet);
  const chords = songChords(base.sheet);
  return { ...base, sequence, chords, difficulty: songDifficulty(chords) };
}

export function catalogEntry(song: CatalogSong): SongEntry {
  let sheet: ParsedSong;
  if (song.chordpro) {
    const r = parseChordPro(song.chordpro);
    sheet = r.ok ? r.song : emptySheet(song.title);
  } else {
    sheet = {
      meta: { title: song.title, artist: song.artist, key: song.key, capo: song.capo, tempo: song.bpm, time: song.time, year: song.year },
      sections: progressionSections(song.progression ?? []),
      warnings: [],
    };
  }
  // Catalogue metadata wins over what the sheet says.
  sheet = { ...sheet, meta: { ...sheet.meta, title: song.title, artist: song.artist, key: song.key, capo: song.capo, tempo: song.bpm, time: song.time, year: song.year } };
  return entry({
    id: song.id,
    source: 'catalog',
    title: song.title,
    artist: song.artist,
    year: song.year,
    yearApprox: song.yearApprox ?? false,
    genre: song.genre,
    fullSheet: Boolean(song.chordpro),
    sheet,
    strum: song.strum,
    note: song.note,
  });
}

export function userEntry(song: UserSong): SongEntry {
  const r = parseChordPro(song.chordpro);
  const sheet = r.ok ? r.song : emptySheet(song.title);
  return entry({
    id: song.id,
    source: 'user',
    title: song.title,
    artist: song.artist,
    year: song.year,
    yearApprox: false,
    genre: song.genre,
    fullSheet: true,
    sheet: { ...sheet, meta: { ...sheet.meta, title: song.title, artist: song.artist, year: song.year } },
  });
}

let catalogCache: SongEntry[] | null = null;

export function catalogEntries(): SongEntry[] {
  catalogCache ??= CATALOG.map(catalogEntry);
  return catalogCache;
}

export function allSongs(userSongs: readonly UserSong[]): SongEntry[] {
  return [...userSongs.map(userEntry), ...catalogEntries()];
}

export function findSong(id: string, userSongs: readonly UserSong[]): SongEntry | undefined {
  const user = userSongs.find((s) => s.id === id);
  if (user) return userEntry(user);
  return catalogEntries().find((s) => s.id === id);
}

export interface SongFilter {
  query: string;
  genre: Genre | '';
  /** Decade start (e.g. 1990), or null for any. */
  decade: number | null;
  artist: string;
  difficulty: 0 | 1 | 2 | 3;
  /** Only songs whose chords are all known (or one missing at most). */
  playableOnly: boolean;
  source: 'all' | 'catalog' | 'user' | 'full';
}

export const EMPTY_FILTER: SongFilter = { query: '', genre: '', decade: null, artist: '', difficulty: 0, playableOnly: false, source: 'all' };

function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Number of library chords the user still has to learn for this song. */
export function missingCount(song: SongEntry, known: ReadonlySet<string>): number {
  return analyzeChords(song.chords, known).filter((c) => !c.known).length;
}

export function filterSongs(songs: readonly SongEntry[], f: SongFilter, known: ReadonlySet<string>, preferredGenres: readonly Genre[] = []): SongEntry[] {
  const q = fold(f.query.trim());
  const out = songs.filter((s) => {
    if (q && !fold(`${s.title} ${s.artist} ${s.chords.join(' ')}`).includes(q)) return false;
    if (f.genre && s.genre !== f.genre) return false;
    if (f.decade !== null && (s.year === null || decadeOf(s.year) !== f.decade)) return false;
    if (f.artist && s.artist !== f.artist) return false;
    if (f.difficulty && s.difficulty !== f.difficulty) return false;
    if (f.playableOnly && missingCount(s, known) > 1) return false;
    if (f.source === 'catalog' && s.source !== 'catalog') return false;
    if (f.source === 'user' && s.source !== 'user') return false;
    if (f.source === 'full' && !s.fullSheet) return false;
    return true;
  });
  const pref = new Set(preferredGenres);
  // Imported first, then the user's preferred styles, then easier songs, then by title.
  return out.sort(
    (a, b) =>
      Number(b.source === 'user') - Number(a.source === 'user') ||
      Number(pref.has(b.genre)) - Number(pref.has(a.genre)) ||
      a.difficulty - b.difficulty ||
      a.title.localeCompare(b.title, 'pt'),
  );
}

export function facets(songs: readonly SongEntry[]): { genres: Genre[]; decades: number[]; artists: string[] } {
  const genres = new Set<Genre>();
  const decades = new Set<number>();
  const artists = new Set<string>();
  for (const s of songs) {
    genres.add(s.genre);
    if (s.year !== null) decades.add(decadeOf(s.year));
    if (s.artist) artists.add(s.artist);
  }
  return {
    genres: [...genres],
    decades: [...decades].sort((a, b) => a - b),
    artists: [...artists].sort((a, b) => a.localeCompare(b, 'pt')),
  };
}
