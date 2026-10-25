// Song-sheet parsing. Two input formats are accepted and both are normalised to ChordPro:
//  1. ChordPro (https://www.chordpro.org): {directives} and inline [C]chords.
//  2. Plain "chords over lyrics" text, as found in most cifra books and sites.
// Everything here is pure string processing: imported text is never evaluated or rendered as HTML.
import { isChordSymbol, parseChordSymbol, transposeSymbol } from './chordSymbols';

export const MAX_SONG_CHARS = 200_000;
export const MAX_SONG_LINES = 3000;
const MAX_LINE_CHARS = 400;
const MAX_META_CHARS = 120;

export type SectionType = 'verse' | 'chorus' | 'bridge' | 'tab' | 'other';

export interface Segment {
  /** Chord sounding from the start of this segment (as written), or null. */
  chord: string | null;
  text: string;
}

export type SongLine =
  | { kind: 'lyrics'; segments: Segment[] }
  | { kind: 'comment'; text: string }
  | { kind: 'tab'; text: string }
  | { kind: 'empty' };

export interface SongSection {
  type: SectionType;
  label: string | null;
  lines: SongLine[];
}

export interface SongMeta {
  title: string;
  artist: string;
  key: string | null;
  capo: number;
  tempo: number | null;
  time: string | null;
  year: number | null;
}

export interface ParsedSong {
  meta: SongMeta;
  sections: SongSection[];
  /** Human-readable notes about content that was ignored or adjusted. */
  warnings: string[];
}

export type SongFormat = 'chordpro' | 'plain';

export type ParseResult = { ok: true; song: ParsedSong; format: SongFormat } | { ok: false; error: string };

const EMPTY_META: SongMeta = { title: '', artist: '', key: null, capo: 0, tempo: null, time: null, year: null };

// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

function sanitize(text: string): string {
  return text.replace(/\r\n?/g, '\n').replace(/\t/g, '    ').replace(CONTROL_RE, '');
}

function clip(s: string, max = MAX_META_CHARS): string {
  return s.trim().slice(0, max);
}

function parseIntIn(raw: string, min: number, max: number): number | null {
  const m = /-?\d+/.exec(raw);
  if (!m) return null;
  const n = Number(m[0]);
  return n >= min && n <= max ? n : null;
}

function applyMeta(meta: SongMeta, key: string, value: string, warnings: string[]): boolean {
  const v = clip(value);
  switch (key) {
    case 'title':
    case 't':
    case 'título':
    case 'titulo':
    case 'música':
    case 'musica':
      meta.title = v;
      return true;
    case 'artist':
    case 'subtitle':
    case 'st':
    case 'artista':
    case 'autor':
    case 'intérprete':
    case 'interprete':
      meta.artist = v;
      return true;
    case 'key':
    case 'tom':
    case 'tonalidade': {
      const k = v.split(/\s+/)[0] ?? '';
      if (isChordSymbol(k)) meta.key = k;
      else if (v) warnings.push(`Tom «${v}» não reconhecido.`);
      return true;
    }
    case 'capo':
    case 'capotraste':
    case 'braçadeira':
    case 'bracadeira': {
      const n = /sem|no|none/i.test(v) ? 0 : parseIntIn(v, 0, 12);
      if (n === null) warnings.push(`Capo «${v}» ignorado.`);
      else meta.capo = n;
      return true;
    }
    case 'tempo':
    case 'bpm': {
      const n = parseIntIn(v, 30, 300);
      if (n === null) warnings.push(`Andamento «${v}» ignorado.`);
      meta.tempo = n;
      return true;
    }
    case 'time':
    case 'compasso':
      meta.time = /^\d{1,2}\/\d{1,2}$/.test(v) ? v : null;
      if (!meta.time && v) warnings.push(`Compasso «${v}» ignorado.`);
      return true;
    case 'year':
    case 'ano': {
      const n = parseIntIn(v, 1000, 2100);
      meta.year = n;
      return true;
    }
    default:
      return false;
  }
}

/** Splits a ChordPro lyric line with inline [chords] into segments. */
function parseInlineChords(line: string): Segment[] {
  const segments: Segment[] = [];
  const re = /\[([^\]]{0,24})\]/g;
  let last = 0;
  let current: Segment = { chord: null, text: '' };
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    current.text += line.slice(last, m.index);
    if (current.chord !== null || current.text) segments.push(current);
    current = { chord: (m[1] ?? '').trim() || null, text: '' };
    last = re.lastIndex;
  }
  current.text += line.slice(last);
  if (current.chord !== null || current.text || segments.length === 0) segments.push(current);
  return segments;
}

const TAB_LINE_RE = /^\s*[A-Ga-g][#b]?\s*[|:][-\d|hpbrsx/\\~().^ ]{4,}$/;

const SECTION_DIRECTIVES: Record<string, { type: SectionType; start: boolean }> = {
  start_of_chorus: { type: 'chorus', start: true },
  soc: { type: 'chorus', start: true },
  end_of_chorus: { type: 'chorus', start: false },
  eoc: { type: 'chorus', start: false },
  start_of_verse: { type: 'verse', start: true },
  sov: { type: 'verse', start: true },
  end_of_verse: { type: 'verse', start: false },
  eov: { type: 'verse', start: false },
  start_of_bridge: { type: 'bridge', start: true },
  sob: { type: 'bridge', start: true },
  end_of_bridge: { type: 'bridge', start: false },
  eob: { type: 'bridge', start: false },
  start_of_tab: { type: 'tab', start: true },
  sot: { type: 'tab', start: true },
  end_of_tab: { type: 'tab', start: false },
  eot: { type: 'tab', start: false },
};

const DEFAULT_SECTION_LABEL: Record<SectionType, string | null> = {
  verse: null,
  chorus: 'Refrão',
  bridge: 'Ponte',
  tab: 'Tablatura',
  other: null,
};

class SectionBuilder {
  sections: SongSection[] = [];
  private current: SongSection = { type: 'other', label: null, lines: [] };

  open(type: SectionType, label: string | null): void {
    this.flush();
    this.current = { type, label: label ?? DEFAULT_SECTION_LABEL[type], lines: [] };
  }
  close(): void {
    this.flush();
    this.current = { type: 'other', label: null, lines: [] };
  }
  get type(): SectionType {
    return this.current.type;
  }
  push(line: SongLine): void {
    // Collapse runs of empty lines and drop leading ones.
    if (line.kind === 'empty') {
      const prev = this.current.lines.at(-1);
      if (!prev || prev.kind === 'empty') return;
    }
    this.current.lines.push(line);
  }
  /** A blank line in a free section ends a stanza: start a new block so stanzas stay separate. */
  breakStanza(): void {
    if (this.current.type === 'other' && this.current.lines.length > 0) this.close();
  }
  flush(): void {
    while (this.current.lines.at(-1)?.kind === 'empty') this.current.lines.pop();
    if (this.current.lines.length > 0 || this.current.label) this.sections.push(this.current);
  }
  finish(): SongSection[] {
    this.flush();
    this.current = { type: 'other', label: null, lines: [] };
    return this.sections;
  }
}

function checkSize(text: string): string | null {
  if (text.length > MAX_SONG_CHARS) return 'O texto é demasiado grande (máximo 200 000 caracteres).';
  if (!text.trim()) return 'O texto está vazio.';
  return null;
}

function splitLines(text: string, warnings: string[]): string[] | null {
  const lines = sanitize(text).split('\n');
  if (lines.length > MAX_SONG_LINES) return null;
  let clipped = false;
  const out = lines.map((l) => {
    if (l.length > MAX_LINE_CHARS) {
      clipped = true;
      return l.slice(0, MAX_LINE_CHARS);
    }
    return l.trimEnd();
  });
  if (clipped) warnings.push(`Algumas linhas foram cortadas a ${MAX_LINE_CHARS} caracteres.`);
  return out;
}

export function parseChordPro(text: string): ParseResult {
  const sizeError = checkSize(text);
  if (sizeError) return { ok: false, error: sizeError };
  const warnings: string[] = [];
  const lines = splitLines(text, warnings);
  if (!lines) return { ok: false, error: `O texto tem demasiadas linhas (máximo ${MAX_SONG_LINES}).` };
  const meta: SongMeta = { ...EMPTY_META };
  const b = new SectionBuilder();
  const unknownDirectives = new Set<string>();

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith('#')) continue; // ChordPro comment line
    const directive = /^\s*\{\s*([A-Za-z_À-ú]+)\s*(?:[:\s]\s*(.*?))?\s*\}\s*$/.exec(line);
    if (directive) {
      const name = (directive[1] ?? '').toLowerCase();
      const value = directive[2] ?? '';
      const section = SECTION_DIRECTIVES[name];
      if (section) {
        if (section.start) b.open(section.type, value ? clip(value, 60) : null);
        else b.close();
      } else if (name === 'comment' || name === 'c' || name === 'comment_italic' || name === 'ci' || name === 'highlight') {
        if (value) b.push({ kind: 'comment', text: clip(value, 200) });
      } else if (name === 'chorus') {
        b.push({ kind: 'comment', text: value ? `Refrão: ${clip(value, 60)}` : 'Repetir refrão' });
      } else if (!applyMeta(meta, name, value, warnings)) {
        unknownDirectives.add(name);
      }
      continue;
    }
    if (!line.trim()) {
      b.push({ kind: 'empty' });
      b.breakStanza();
      continue;
    }
    if (b.type === 'tab' || TAB_LINE_RE.test(line)) {
      b.push({ kind: 'tab', text: line });
      continue;
    }
    b.push({ kind: 'lyrics', segments: parseInlineChords(line) });
  }
  if (unknownDirectives.size) warnings.push(`Diretivas ignoradas: ${[...unknownDirectives].slice(0, 8).join(', ')}.`);
  return finalize(meta, b.finish(), warnings, 'chordpro');
}

// ---------- Plain "chords over lyrics" ----------

/** Tokens allowed on a chord line besides chords: bar lines, repeats and riff markers. */
const CHORD_LINE_FILLER_RE = /^(?:\||\|\||:\|\||\|\|:|-+|\/+|\.+|%|[(]?\d{1,2}x[)]?|[(]?x\d{1,2}[)]?|N\.?C\.?|\(|\))$/i;

function chordTokens(line: string): { col: number; token: string }[] {
  const out: { col: number; token: string }[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) out.push({ col: m.index, token: m[0] });
  return out;
}

/** A chord line has at least one chord and nothing but chords and bar/repeat markers. */
export function isChordLine(line: string): boolean {
  const tokens = chordTokens(line);
  let chords = 0;
  for (const { token } of tokens) {
    const t = token.replace(/^\(|\)$/g, '');
    if (isChordSymbol(t)) chords++;
    else if (!CHORD_LINE_FILLER_RE.test(token)) return false;
  }
  return chords > 0;
}

/** Merges a chord line above a lyric line, column by column, into segments. */
export function mergeChordLine(chordLine: string, lyric: string): Segment[] {
  const chords = chordTokens(chordLine).filter(({ token }) => isChordSymbol(token.replace(/^\(|\)$/g, '')));
  if (chords.length === 0) return [{ chord: null, text: lyric }];
  const segments: Segment[] = [];
  const first = chords[0]?.col ?? 0;
  if (first > 0) segments.push({ chord: null, text: lyric.slice(0, first) });
  chords.forEach(({ col, token }, i) => {
    const end = chords[i + 1]?.col ?? Infinity;
    segments.push({ chord: token.replace(/^\(|\)$/g, ''), text: lyric.slice(col, end === Infinity ? undefined : end) });
  });
  // Drop a whitespace-only leading segment.
  if (segments[0]?.chord === null && !segments[0].text.trim()) segments.shift();
  return segments;
}

/** Chords-only line (intro, solo…): one segment per chord. */
function chordOnlySegments(line: string): Segment[] {
  return chordTokens(line)
    .map(({ token }) => token.replace(/^\(|\)$/g, ''))
    .filter((t) => isChordSymbol(t))
    .map((chord) => ({ chord, text: '' }));
}

const SECTION_LABELS: [RegExp, SectionType][] = [
  [/^(refr[ãa]o|chorus|coro)/i, 'chorus'],
  [/^(ponte|bridge|pr[ée]-?refr[ãa]o|pre-?chorus)/i, 'bridge'],
  [/^(verso|estrofe|verse|parte)/i, 'verse'],
  [/^(tab|tablatura|riff|solo|dedilhado)/i, 'tab'],
];

/** Recognises section headers like «[Refrão]», «Refrão:», «[Intro] G D Em» or «Verso 2:». */
function sectionHeader(line: string): { type: SectionType; label: string; rest: string } | null {
  const bracket = /^\s*\[([^\]]{1,40})\]\s*(.*)$/.exec(line);
  const colon = /^\s*([A-Za-zÀ-ú][A-Za-zÀ-ú0-9 .-]{1,30}):\s*(.*)$/.exec(line);
  const m = bracket ?? colon;
  if (!m) return null;
  const label = (m[1] ?? '').trim();
  if (bracket && isChordSymbol(label)) return null;
  const known = SECTION_LABELS.find(([re]) => re.test(label));
  const isIntroLike = /^(intro|introdu[çc][ãa]o|outro|final|fim|interl[úu]dio|instrumental|solo)/i.test(label);
  if (!bracket && !known && !isIntroLike) return null;
  const type: SectionType = known ? known[1] : 'other';
  return { type: type === 'tab' && !/^(tab|tablatura)/i.test(label) ? 'other' : type, label: clip(label, 60), rest: m[2] ?? '' };
}

const META_LINE_RE = /^\s*(t[ií]tulo|m[úu]sica|artista|autor|int[ée]rprete|tom|tonalidade|capo|capotraste|bra[çc]adeira|bpm|tempo|compasso|ano)\s*:\s*(.+)$/i;

export function parsePlainText(text: string): ParseResult {
  const sizeError = checkSize(text);
  if (sizeError) return { ok: false, error: sizeError };
  const warnings: string[] = [];
  const lines = splitLines(text, warnings);
  if (!lines) return { ok: false, error: `O texto tem demasiadas linhas (máximo ${MAX_SONG_LINES}).` };
  const meta: SongMeta = { ...EMPTY_META };
  const b = new SectionBuilder();
  let headerZone = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (!line.trim()) {
      b.push({ kind: 'empty' });
      b.breakStanza();
      continue;
    }
    const metaMatch = META_LINE_RE.exec(line);
    if (metaMatch && applyMeta(meta, (metaMatch[1] ?? '').toLowerCase(), metaMatch[2] ?? '', warnings)) continue;

    // «Title - Artist» on the very first content line, if it has no chords.
    if (headerZone && !meta.title && !isChordLine(line) && !sectionHeader(line)) {
      const dash = /^(.{1,80}?)\s+[-–—]\s+(.{1,80})$/.exec(line.trim());
      if (dash) {
        meta.title = clip(dash[1] ?? '');
        if (!meta.artist) meta.artist = clip(dash[2] ?? '');
        headerZone = false;
        continue;
      }
    }
    headerZone = false;

    const header = sectionHeader(line);
    if (header) {
      b.open(header.type, header.label);
      if (header.rest.trim()) {
        if (isChordLine(header.rest)) b.push({ kind: 'lyrics', segments: chordOnlySegments(header.rest) });
        else if (TAB_LINE_RE.test(header.rest)) b.push({ kind: 'tab', text: header.rest });
        else b.push({ kind: 'lyrics', segments: [{ chord: null, text: header.rest.trim() }] });
      }
      continue;
    }
    if (TAB_LINE_RE.test(line)) {
      b.push({ kind: 'tab', text: line });
      continue;
    }
    if (isChordLine(line)) {
      const next = lines[i + 1];
      if (next !== undefined && next.trim() && !isChordLine(next) && !TAB_LINE_RE.test(next) && !sectionHeader(next) && !META_LINE_RE.test(next)) {
        b.push({ kind: 'lyrics', segments: mergeChordLine(line, next) });
        i++;
      } else {
        b.push({ kind: 'lyrics', segments: chordOnlySegments(line) });
      }
      continue;
    }
    b.push({ kind: 'lyrics', segments: [{ chord: null, text: line }] });
  }
  return finalize(meta, b.finish(), warnings, 'plain');
}

/** ChordPro if it uses {directives} or inline [Chord] markers; plain text otherwise. */
export function detectFormat(text: string): SongFormat {
  const sample = text.slice(0, 20_000);
  if (/^\s*\{\s*[A-Za-z_]+\s*[:}\s]/m.test(sample)) return 'chordpro';
  const inline = sample.match(/\[([^\]\s]{1,16})\]/g) ?? [];
  const chordMarkers = inline.filter((m) => isChordSymbol(m.slice(1, -1))).length;
  return chordMarkers >= 2 ? 'chordpro' : 'plain';
}

export function parseSongText(text: string, format: SongFormat | 'auto' = 'auto'): ParseResult {
  const f = format === 'auto' ? detectFormat(text) : format;
  return f === 'chordpro' ? parseChordPro(text) : parsePlainText(text);
}

function finalize(meta: SongMeta, sections: SongSection[], warnings: string[], format: SongFormat): ParseResult {
  const song: ParsedSong = { meta, sections, warnings };
  const symbols = songChordSequence(song);
  if (sections.length === 0) return { ok: false, error: 'Não foi encontrado conteúdo na cifra.' };
  if (symbols.length === 0) warnings.push('Não foram encontrados acordes. Confirma o formato: acordes por cima da letra, ou [C] dentro da letra (ChordPro).');
  const unknown = new Set<string>();
  for (const s of sections)
    for (const l of s.lines)
      if (l.kind === 'lyrics') for (const seg of l.segments) if (seg.chord && !parseChordSymbol(seg.chord)) unknown.add(seg.chord);
  if (unknown.size) warnings.push(`Acordes não reconhecidos: ${[...unknown].slice(0, 8).join(', ')}.`);
  return { ok: true, song, format };
}

// ---------- Queries and transformations ----------

/** Every valid chord symbol in playing order (repeats included). */
export function songChordSequence(song: ParsedSong): string[] {
  const out: string[] = [];
  for (const s of song.sections)
    for (const l of s.lines)
      if (l.kind === 'lyrics') for (const seg of l.segments) if (seg.chord && parseChordSymbol(seg.chord)) out.push(seg.chord);
  return out;
}

/** Unique chord symbols in order of first appearance. */
export function songChords(song: ParsedSong): string[] {
  return [...new Set(songChordSequence(song))];
}

export function transposeSong(song: ParsedSong, semitones: number, preferFlats = false): ParsedSong {
  if (semitones % 12 === 0) return song;
  const t = (c: string) => transposeSymbol(c, semitones, preferFlats);
  return {
    ...song,
    meta: { ...song.meta, key: song.meta.key ? t(song.meta.key) : null },
    sections: song.sections.map((s) => ({
      ...s,
      lines: s.lines.map((l) => (l.kind === 'lyrics' ? { kind: 'lyrics', segments: l.segments.map((seg) => ({ ...seg, chord: seg.chord ? t(seg.chord) : null })) } : l)),
    })),
  };
}

const SECTION_DIRECTIVE_NAME: Record<Exclude<SectionType, 'other'>, string> = {
  verse: 'verse',
  chorus: 'chorus',
  bridge: 'bridge',
  tab: 'tab',
};

function escapeLyric(text: string): string {
  // Brackets in lyrics would be read back as chords; braces at line start as directives.
  return text.replace(/\[/g, '(').replace(/\]/g, ')');
}

/** Serialises to ChordPro. parseChordPro(toChordPro(s)) yields an equivalent song. */
export function toChordPro(song: ParsedSong): string {
  const { meta } = song;
  const out: string[] = [];
  if (meta.title) out.push(`{title: ${meta.title}}`);
  if (meta.artist) out.push(`{artist: ${meta.artist}}`);
  if (meta.key) out.push(`{key: ${meta.key}}`);
  if (meta.capo) out.push(`{capo: ${meta.capo}}`);
  if (meta.tempo) out.push(`{tempo: ${meta.tempo}}`);
  if (meta.time) out.push(`{time: ${meta.time}}`);
  if (meta.year) out.push(`{year: ${meta.year}}`);
  for (const s of song.sections) {
    out.push('');
    const typed = s.type !== 'other';
    if (typed) {
      const name = SECTION_DIRECTIVE_NAME[s.type as Exclude<SectionType, 'other'>];
      const label = s.label && s.label !== DEFAULT_SECTION_LABEL[s.type] ? `: ${s.label}` : '';
      out.push(`{start_of_${name}${label}}`);
    } else if (s.label) {
      out.push(`{comment: ${s.label}}`);
    }
    for (const l of s.lines) {
      if (l.kind === 'empty') out.push('');
      else if (l.kind === 'comment') out.push(`{comment: ${l.text.replace(/[{}]/g, '')}}`);
      else if (l.kind === 'tab') out.push(s.type === 'tab' ? l.text : `{start_of_tab}\n${l.text}\n{end_of_tab}`);
      else {
        const text = l.segments.map((seg) => `${seg.chord ? `[${seg.chord}]` : ''}${escapeLyric(seg.text)}`).join('');
        out.push(text.startsWith('{') || text.startsWith('#') ? ` ${text}` : text);
      }
    }
    if (typed) out.push(`{end_of_${SECTION_DIRECTIVE_NAME[s.type as Exclude<SectionType, 'other'>]}}`);
  }
  return out.join('\n').trim() + '\n';
}
