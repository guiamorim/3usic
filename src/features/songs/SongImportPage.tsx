import { useState, type ChangeEvent } from 'react';
import { useStore } from '../../app/store';
import { hashQuery, navigate } from '../../app/router';
import { CATALOG } from '../../content/songs';
import { Page } from '../../components/Page';
import { GENRE_LABEL } from '../../content/labels';
import { MAX_SONG_CHARS, parseSongText, songChords, toChordPro, type ParsedSong, type SongFormat } from '../../domain/chordpro';
import { GenreSchema, MAX_USER_SONGS, type Genre } from '../../storage/schema';
import { SongSheet } from './SongSheet';

const MAX_FILE_BYTES = 400 * 1024;

const PLAIN_EXAMPLE = `A Minha Canção - Nome do Artista
Tom: G
Capo: 2

[Refrão]
G         D          Em      C
Aqui vai a letra com acordes por cima
G         D        C
Cada acorde fica sobre a sílaba certa`;

const CHORDPRO_EXAMPLE = `{title: A Minha Canção}
{artist: Nome do Artista}
{key: G}
{capo: 2}
{tempo: 90}

{start_of_chorus}
[G]Aqui vai a [D]letra com [Em]acordes [C]dentro
{end_of_chorus}`;

interface Draft {
  song: ParsedSong;
  format: SongFormat;
  title: string;
  artist: string;
  genre: Genre;
  year: string;
}

export function SongImportPage() {
  const { data, saveSong } = useStore();
  // «Colar a minha cifra» from a catalogue song: the import is linked to it.
  const [forSong] = useState(() => CATALOG.find((c) => c.id === hashQuery().get('para')) ?? null);
  const [text, setText] = useState('');
  const [format, setFormat] = useState<SongFormat | 'auto'>('auto');
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const full = data.songs.length >= MAX_USER_SONGS;

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setError('O ficheiro é demasiado grande para uma cifra (máximo 400 KB).');
      return;
    }
    try {
      const content = await file.text();
      setText(content);
      preview(content);
    } catch {
      setError('Não foi possível ler o ficheiro.');
    }
  }

  function preview(source = text) {
    setDraft(null);
    const r = parseSongText(source, format);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setError(null);
    const fallbackGenre = data.profile?.genres[0] ?? 'outro';
    setDraft({
      song: r.song,
      format: r.format,
      title: forSong?.title ?? r.song.meta.title,
      artist: forSong?.artist ?? r.song.meta.artist,
      genre: forSong?.genre ?? (GenreSchema.safeParse(fallbackGenre).success ? fallbackGenre : 'outro'),
      year: forSong ? String(forSong.year) : r.song.meta.year ? String(r.song.meta.year) : '',
    });
  }

  async function save() {
    if (!draft) return;
    const title = draft.title.trim().slice(0, 120);
    if (!title) {
      setError('Indica o título da música.');
      return;
    }
    const yearNum = draft.year.trim() ? Number(draft.year) : null;
    if (yearNum !== null && (!Number.isInteger(yearNum) || yearNum < 1000 || yearNum > 2100)) {
      setError('O ano deve ser um número entre 1000 e 2100.');
      return;
    }
    const artist = draft.artist.trim().slice(0, 120);
    const chordpro = toChordPro({ ...draft.song, meta: { ...draft.song.meta, title, artist, year: yearNum } });
    if (chordpro.length > MAX_SONG_CHARS) {
      setError('A cifra convertida é demasiado grande.');
      return;
    }
    setSaving(true);
    const id = await saveSong({ title, artist, genre: draft.genre, year: yearNum, chordpro, ...(forSong ? { catalogId: forSong.id } : {}) });
    setSaving(false);
    if (id) navigate(`#/musicas/${encodeURIComponent(forSong ? forSong.id : id)}`);
    else setError('Não foi possível guardar a música.');
  }

  const chords = draft ? songChords(draft.song) : [];

  return (
    <Page
      title={forSong ? `Colar cifra: ${forSong.title}` : 'Importar cifra'}
      back={forSong ? { href: `#/musicas/${encodeURIComponent(forSong.id)}`, label: forSong.title } : { href: '#/musicas', label: 'Músicas' }}
      subtitle="Cola o texto de uma cifra ou escolhe um ficheiro. A app reorganiza-a e cria um plano para a aprenderes."
    >
      {forSong && (
        <p className="notice notice--tip">
          Copia a cifra com letra de um site de cifras (seleciona o texto, copia e cola aqui). Fica associada a «{forSong.title}» e aparece na página da música e no modo Tocar junto.
        </p>
      )}
      <p className="notice notice--info">
        A cifra fica guardada só neste dispositivo e nunca é enviada para nenhum servidor. Importa apenas para uso pessoal: letras e cifras de músicas conhecidas têm normalmente direitos de autor.
      </p>
      {full && <p className="notice notice--error">Atingiste o limite de {MAX_USER_SONGS} músicas importadas. Apaga alguma antes de importar outra.</p>}

      <details className="card">
        <summary>Que formatos aceita?</summary>
        <p>
          <strong>Texto simples</strong>: acordes numa linha e a letra na linha de baixo, alinhados por espaços (como na maioria dos sites e livros de cifras). Linhas como «Tom: G», «Capo: 2» e títulos de secção como «[Refrão]» ou «Refrão:» são reconhecidos.
        </p>
        <pre className="code-sample">{PLAIN_EXAMPLE}</pre>
        <p>
          <strong>ChordPro</strong> (ficheiros .cho, .chordpro, .crd, .pro): formato aberto, com os acordes entre parênteses retos dentro da letra e diretivas entre chavetas. É também o formato em que a app guarda as cifras.
        </p>
        <pre className="code-sample">{CHORDPRO_EXAMPLE}</pre>
        <p className="hint">Acordes com nomes ingleses (C, D, E, F, G, A, B). Uma linha que só tenha acordes é lida como linha de acordes.</p>
      </details>

      <label className="field">
        <span>Ficheiro (.txt, .cho, .chordpro, .crd, .pro)</span>
        <input type="file" accept=".txt,.cho,.chordpro,.crd,.pro,text/plain" onChange={(e) => void onFile(e)} disabled={full} />
      </label>
      <label className="field">
        <span>Ou cola aqui a cifra</span>
        <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} maxLength={MAX_SONG_CHARS} spellCheck={false} disabled={full} />
      </label>
      <label className="field">
        <span>Formato</span>
        <select value={format} onChange={(e) => setFormat(e.target.value as SongFormat | 'auto')}>
          <option value="auto">Detetar automaticamente</option>
          <option value="plain">Texto simples (acordes por cima da letra)</option>
          <option value="chordpro">ChordPro</option>
        </select>
      </label>
      <div className="button-row">
        <button type="button" className="btn btn--primary" onClick={() => preview()} disabled={!text.trim() || full}>
          Pré-visualizar
        </button>
      </div>
      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}

      {draft && (
        <section className="card" aria-labelledby="pre-visualizacao">
          <h2 id="pre-visualizacao">Pré-visualização</h2>
          <p className="muted">
            Lido como {draft.format === 'chordpro' ? 'ChordPro' : 'texto simples'}. {chords.length} {chords.length === 1 ? 'acorde diferente' : 'acordes diferentes'}
            {chords.length > 0 && `: ${chords.join(', ')}`}.
          </p>
          {draft.song.warnings.length > 0 && (
            <ul className="notice notice--tip" aria-label="Avisos">
              {draft.song.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
          <label className="field">
            <span>Título</span>
            <input value={draft.title} maxLength={120} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required />
          </label>
          <label className="field">
            <span>Artista</span>
            <input value={draft.artist} maxLength={120} onChange={(e) => setDraft({ ...draft, artist: e.target.value })} />
          </label>
          <label className="field">
            <span>Estilo</span>
            <select value={draft.genre} onChange={(e) => setDraft({ ...draft, genre: e.target.value as Genre })}>
              {(Object.keys(GENRE_LABEL) as Genre[]).map((g) => (
                <option key={g} value={g}>
                  {GENRE_LABEL[g]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Ano (opcional)</span>
            <input inputMode="numeric" value={draft.year} maxLength={4} onChange={(e) => setDraft({ ...draft, year: e.target.value.replace(/\D/g, '') })} />
          </label>
          <SongSheet song={draft.song} />
          <div className="button-row">
            <button type="button" className="btn btn--primary" onClick={() => void save()} disabled={saving}>
              Guardar música
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setDraft(null)}>
              Cancelar
            </button>
          </div>
        </section>
      )}
    </Page>
  );
}
