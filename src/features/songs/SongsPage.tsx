import { useMemo, useState } from 'react';
import { useStore } from '../../app/store';
import { hashQuery, href } from '../../app/router';
import { Page } from '../../components/Page';
import { GENRE_LABEL } from '../../content/labels';
import { decadeLabel, ORIGIN_LABEL, type Origin } from '../../content/songs';
import { allSongs, EMPTY_FILTER, facets, filterSongs, missingCount, VERSION_LABEL, versionOf, type SongFilter, type SongVersion } from '../../domain/songLibrary';
import { analyzeChords, knownChordIds } from '../../domain/songPlan';
import type { Genre } from '../../storage/schema';

export const DIFFICULTY_LABEL = ['', 'Fácil', 'Média', 'Difícil'] as const;

const SOURCE_LABEL: Record<SongFilter['source'], string> = {
  all: 'Todas',
  catalog: 'Catálogo',
  full: 'Com letra completa',
  user: 'Importadas por mim',
};

export function SongsPage() {
  const { data, completedLessons, settings, saveSettings } = useStore();
  const version: SongVersion = settings.songVersion ?? 'simple';
  const [f, setF] = useState<SongFilter>(() => ({ ...EMPTY_FILTER, collection: hashQuery().get('colecao') === 'infantil' ? 'infantil' : 'main' }));
  const known = useMemo(() => knownChordIds(completedLessons, settings.knownChords), [completedLessons, settings.knownChords]);
  const songs = useMemo(() => allSongs(data.songs), [data.songs]);
  const { genres, origins, decades, artists } = useMemo(() => facets(songs.filter((s) => s.kids === (f.collection === 'infantil'))), [songs, f.collection]);
  const list = filterSongs(songs, f, known, data.profile?.genres ?? [], version);
  const set = (patch: Partial<SongFilter>) => setF((prev) => ({ ...prev, ...patch }));
  const active = JSON.stringify({ ...f, collection: 'main' }) !== JSON.stringify(EMPTY_FILTER);
  const kids = f.collection === 'infantil';
  const filterCount = [f.genre, f.origin, f.decade, f.artist, f.difficulty, f.source !== EMPTY_FILTER.source].filter(Boolean).length;
  // The section lives in the URL so «← voltar» from a song returns to it (replaceState: no new history entry).
  const setCollection = (collection: 'main' | 'infantil') => {
    set({ collection });
    history.replaceState(history.state, '', collection === 'infantil' ? '#/musicas?colecao=infantil' : '#/musicas');
  };

  return (
    <Page title="Músicas" subtitle="Escolhe uma música para treinar: a app mostra os acordes que te faltam e monta um plano para chegares lá.">
      <div className="segmented" role="group" aria-label="Secção">
        <button type="button" className="segmented__item" aria-pressed={!kids} onClick={() => setCollection('main')}>
          Todas as músicas
        </button>
        <button type="button" className="segmented__item" aria-pressed={kids} onClick={() => setCollection('infantil')}>
          Infantis e festas
        </button>
      </div>
      {kids && (
        <p className="notice notice--info">
          Cantigas de roda e canções infantis tradicionais do Brasil e de Portugal, com letra completa (domínio público) e acordes fáceis, quase sempre só dois ou três. O «Parabéns a você» está nas
          versões brasileira e portuguesa, só com acordes.
        </p>
      )}
      <details className="song-about" hidden={kids}>
        <summary>Só acordes, sem letra · porquê?</summary>
        <p className="hint">
          As músicas famosas mostram só os acordes (a letra está protegida por direitos de autor), numa versão simplificada ou mais próxima do original. Confirma sempre com a gravação. As que têm
          letra completa são de domínio público. Podes <a href="#/musicas/importar">importar as tuas próprias cifras</a>; ficam só neste dispositivo.
        </p>
      </details>

      <div role="search">
        <label className="field">
          <span>Pesquisar</span>
          <input type="search" value={f.query} onChange={(e) => set({ query: e.target.value })} placeholder="Título, artista ou acorde" />
        </label>
      </div>
      <label className="chip chip--ready">
        <input type="checkbox" checked={f.playableOnly} onChange={(e) => set({ playableOnly: e.target.checked })} />
        Prontas a tocar (falta no máximo 1 acorde)
      </label>
      <details className="filters-panel">
        <summary>Filtros{filterCount > 0 ? ` · ${filterCount} ${filterCount === 1 ? 'ativo' : 'ativos'}` : ''}</summary>
        <div className="filters filters--songs">
          <label className="field">
            <span>Estilo</span>
            <select value={f.genre} onChange={(e) => set({ genre: e.target.value as Genre | '' })}>
              <option value="">Todos</option>
              {genres.map((g) => (
                <option key={g} value={g}>
                  {GENRE_LABEL[g]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>País</span>
            <select value={f.origin} onChange={(e) => set({ origin: e.target.value as Origin | '' })}>
              <option value="">Todos</option>
              {origins.map((o) => (
                <option key={o} value={o}>
                  {ORIGIN_LABEL[o]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Época</span>
            <select value={f.decade ?? ''} onChange={(e) => set({ decade: e.target.value ? Number(e.target.value) : null })}>
              <option value="">Todas</option>
              {decades.map((d) => (
                <option key={d} value={d}>
                  {decadeLabel(d)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Artista</span>
            <select value={f.artist} onChange={(e) => set({ artist: e.target.value })}>
              <option value="">Todos</option>
              {artists.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Dificuldade</span>
            <select value={f.difficulty} onChange={(e) => set({ difficulty: Number(e.target.value) as SongFilter['difficulty'] })}>
              <option value={0}>Todas</option>
              <option value={1}>Fácil</option>
              <option value={2}>Média</option>
              <option value={3}>Difícil (pestana ou acordes raros)</option>
            </select>
          </label>
          <label className="field">
            <span>Origem</span>
            <select value={f.source} onChange={(e) => set({ source: e.target.value as SongFilter['source'] })}>
              {(Object.keys(SOURCE_LABEL) as SongFilter['source'][]).map((s) => (
                <option key={s} value={s}>
                  {SOURCE_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <fieldset className="version-switch">
          <legend>Versão dos acordes</legend>
          <div className="choice-group choice-group--inline">
            {(['simple', 'full'] as const).map((v) => (
              <label key={v} className="chip">
                <input type="radio" name="versao-lista" checked={version === v} onChange={() => void saveSettings({ songVersion: v })} />
                {VERSION_LABEL[v]}
              </label>
            ))}
          </div>
        </fieldset>
      </details>

      <div className="card__head">
        <p className="muted" role="status">
          {list.length} {list.length === 1 ? 'música' : 'músicas'}
        </p>
        {active ? (
          <button type="button" className="btn btn--ghost btn--small" onClick={() => setF({ ...EMPTY_FILTER, collection: f.collection })}>
            Limpar filtros
          </button>
        ) : (
          <a className="btn btn--secondary btn--small" href="#/musicas/importar">
            + Importar cifra
          </a>
        )}
      </div>

      {list.length === 0 && <p>Nenhuma música corresponde aos filtros.{f.playableOnly && ' Aprende mais acordes ou desliga «Prontas a tocar».'}</p>}
      <ul className="song-list">
        {list.map((s) => {
          const v = versionOf(s, version);
          const missing = missingCount(v, known);
          const info = analyzeChords(v.chords, known);
          return (
            <li key={s.id}>
              <a className="card song-card" href={href('musicas', s.id)}>
                <strong className="song-card__title">{s.title}</strong>
                <span className="muted">
                  {s.artist}
                  {s.year !== null && ` · ${s.yearApprox ? 'c. ' : ''}${s.year}`}
                </span>
                <span className="song-card__meta">
                  <span className="badge">{GENRE_LABEL[s.genre]}</span>
                  <span className={`difficulty difficulty--${v.difficulty}`}>{DIFFICULTY_LABEL[v.difficulty]}</span>
                  {s.origin && <span className="badge">{ORIGIN_LABEL[s.origin]}</span>}
                  {s.source === 'user' && <span className="badge">Importada</span>}
                  {s.source === 'catalog' && s.fullSheet && <span className="badge">Letra completa</span>}
                  {v.chords.length > 0 &&
                    (missing === 0 ? (
                      <span className="status-ok">Já sabes todos os acordes</span>
                    ) : (
                      <span className="status-warn">{missing === 1 ? 'Falta 1 acorde' : `Faltam ${missing} acordes`}</span>
                    ))}
                </span>
                <ul className="chord-chips" aria-label="Acordes">
                  {info.map((c) => (
                    <li key={c.symbol} className={c.known ? 'is-known' : undefined}>
                      {c.symbol}
                      {c.known && <span className="visually-hidden"> (já sabes)</span>}
                    </li>
                  ))}
                </ul>
              </a>
            </li>
          );
        })}
      </ul>
    </Page>
  );
}
