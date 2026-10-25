// Unifies catalogue songs and user-imported songs into one searchable list.
import { CATALOG, decadeOf, type CatalogSong, type Origin, type ProgressionPart } from '../content/songs';
import type { Genre, UserSong } from '../storage/schema';
import { parseChordPro, simplifySong, songChords, songChordSequence, type ParsedSong, type SongSection } from './chordpro';
import { isChordSymbol } from './chordSymbols';
import { analyzeChords, songDifficulty } from './songPlan';

export type SongVersion = 'simple' | 'full';

export const VERSION_LABEL: Record<SongVersion, string> = {
  simple: 'Simplificada',
  full: 'Mais próxima do original',
};

export interface VersionView {
  sheet: ParsedSong;
  /** Chords in playing order. */
  sequence: string[];
  chords: string[];
  difficulty: 1 | 2 | 3;
}

export interface SongEntry {
  id: string;
  source: 'catalog' | 'user';
  title: string;
  artist: string;
  year: number | null;
  yearApprox: boolean;
  genre: Genre;
  origin: Origin | null;
  /** True when the sheet includes lyrics (public-domain or imported). */
  fullSheet: boolean;
  full: VersionView;
  simple: VersionView;
  /** False when both versions use exactly the same chords. */
  hasSimple: boolean;
  strum?: string;
  note?: string;
  tuning?: string;
  /** Where the catalogue chords were checked, if they were. */
  chordSource?: string;
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

function view(sheet: ParsedSong): VersionView {
  const chords = songChords(sheet);
  return { sheet, sequence: songChordSequence(sheet), chords, difficulty: songDifficulty(chords) };
}

function withVersions(full: ParsedSong, simpleOverride?: ParsedSong): Pick<SongEntry, 'full' | 'simple' | 'hasSimple'> {
  const f = view(full);
  const s = view(simpleOverride ?? simplifySong(full));
  return { full: f, simple: s, hasSimple: s.sequence.join(' ') !== f.sequence.join(' ') };
}

export function catalogEntry(song: CatalogSong): SongEntry {
  const meta = { title: song.title, artist: song.artist, key: song.key, capo: song.capo, tempo: song.bpm, time: song.time, year: song.year };
  let sheet: ParsedSong;
  if (song.chordpro) {
    const r = parseChordPro(song.chordpro);
    sheet = r.ok ? r.song : emptySheet(song.title);
  } else {
    sheet = { meta, sections: progressionSections(song.progression ?? []), warnings: [] };
  }
  // Catalogue metadata wins over what the sheet says.
  sheet = { ...sheet, meta: { ...sheet.meta, ...meta } };
  const simpleOverride = song.simple ? { meta, sections: progressionSections(song.simple), warnings: [] } : undefined;
  return {
    id: song.id,
    source: 'catalog',
    title: song.title,
    artist: song.artist,
    year: song.year,
    yearApprox: song.yearApprox ?? false,
    genre: song.genre,
    origin: song.origin,
    fullSheet: Boolean(song.chordpro),
    ...withVersions(sheet, simpleOverride),
    strum: song.strum,
    note: song.note,
    tuning: song.tuning,
    chordSource: song.chordSource,
  };
}

export function userEntry(song: UserSong): SongEntry {
  const r = parseChordPro(song.chordpro);
  const parsed = r.ok ? r.song : emptySheet(song.title);
  const sheet = { ...parsed, meta: { ...parsed.meta, title: song.title, artist: song.artist, year: song.year } };
  return {
    id: song.id,
    source: 'user',
    title: song.title,
    artist: song.artist,
    year: song.year,
    yearApprox: false,
    genre: song.genre,
    origin: null,
    fullSheet: true,
    ...withVersions(sheet),
  };
}

export function versionOf(song: SongEntry, version: SongVersion): VersionView {
  return version === 'simple' && song.hasSimple ? song.simple : song.full;
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
  origin: Origin | '';
  /** Decade start (e.g. 1990), or null for any. */
  decade: number | null;
  artist: string;
  difficulty: 0 | 1 | 2 | 3;
  /** Only songs whose chords are all known (or one missing at most). */
  playableOnly: boolean;
  source: 'all' | 'catalog' | 'user' | 'full';
}

export const EMPTY_FILTER: SongFilter = { query: '', genre: '', origin: '', decade: null, artist: '', difficulty: 0, playableOnly: false, source: 'all' };

function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Number of library chords the user still has to learn for this version of the song. */
export function missingCount(v: VersionView, known: ReadonlySet<string>): number {
  return analyzeChords(v.chords, known).filter((c) => !c.known).length;
}

export function filterSongs(
  songs: readonly SongEntry[],
  f: SongFilter,
  known: ReadonlySet<string>,
  preferredGenres: readonly Genre[] = [],
  version: SongVersion = 'simple',
): SongEntry[] {
  const q = fold(f.query.trim());
  const out = songs.filter((s) => {
    const v = versionOf(s, version);
    if (q && !fold(`${s.title} ${s.artist} ${v.chords.join(' ')}`).includes(q)) return false;
    if (f.genre && s.genre !== f.genre) return false;
    if (f.origin && s.origin !== f.origin) return false;
    if (f.decade !== null && (s.year === null || decadeOf(s.year) !== f.decade)) return false;
    if (f.artist && s.artist !== f.artist) return false;
    if (f.difficulty && v.difficulty !== f.difficulty) return false;
    if (f.playableOnly && missingCount(v, known) > 1) return false;
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
      versionOf(a, version).difficulty - versionOf(b, version).difficulty ||
      a.title.localeCompare(b.title, 'pt'),
  );
}

export function facets(songs: readonly SongEntry[]): { genres: Genre[]; origins: Origin[]; decades: number[]; artists: string[] } {
  const genres = new Set<Genre>();
  const origins = new Set<Origin>();
  const decades = new Set<number>();
  const artists = new Set<string>();
  for (const s of songs) {
    genres.add(s.genre);
    if (s.origin) origins.add(s.origin);
    if (s.year !== null) decades.add(decadeOf(s.year));
    if (s.artist) artists.add(s.artist);
  }
  return {
    genres: [...genres],
    origins: [...origins],
    decades: [...decades].sort((a, b) => a - b),
    artists: [...artists].sort((a, b) => a.localeCompare(b, 'pt')),
  };
}
