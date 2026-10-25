import { useMemo, useState } from 'react';
import { useStore } from '../../app/store';
import { href } from '../../app/router';
import { Page } from '../../components/Page';
import { GENRE_LABEL } from '../../content/labels';
import { decadeLabel } from '../../content/songs';
import { allSongs, EMPTY_FILTER, facets, filterSongs, missingCount, type SongFilter } from '../../domain/songLibrary';
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
  const { data, completedLessons, settings } = useStore();
  const [f, setF] = useState<SongFilter>(EMPTY_FILTER);
  const known = useMemo(() => knownChordIds(completedLessons, settings.knownChords), [completedLessons, settings.knownChords]);
  const songs = useMemo(() => allSongs(data.songs), [data.songs]);
  const { genres, decades, artists } = useMemo(() => facets(songs), [songs]);
  const list = filterSongs(songs, f, known, data.profile?.genres ?? []);
  const set = (patch: Partial<SongFilter>) => setF((prev) => ({ ...prev, ...patch }));
  const active = JSON.stringify(f) !== JSON.stringify(EMPTY_FILTER);

  return (
    <Page title="Músicas" subtitle="Escolhe uma música para treinar: a app mostra os acordes que te faltam e monta um plano para chegares lá.">
      <div className="button-row">
        <a className="btn btn--primary" href="#/musicas/importar">
          Importar cifra
        </a>
      </div>
      <p className="notice notice--info">
        As músicas famosas mostram só os acordes de uma versão simplificada comum: a letra está protegida por direitos de autor. Confirma sempre com a gravação. As que têm letra completa são de domínio público. Podes importar as tuas próprias cifras; ficam só neste dispositivo.
      </p>

      <div className="filters filters--songs" role="search">
        <label className="field">
          <span>Pesquisar</span>
          <input type="search" value={f.query} onChange={(e) => set({ query: e.target.value })} placeholder="Título, artista ou acorde" />
        </label>
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
      <label className="chip">
        <input type="checkbox" checked={f.playableOnly} onChange={(e) => set({ playableOnly: e.target.checked })} />
        Só as que já consigo tocar (falta no máximo 1 acorde)
      </label>

      <div className="card__head">
        <p className="muted" role="status">
          {list.length} {list.length === 1 ? 'música' : 'músicas'}
        </p>
        {active && (
          <button type="button" className="btn btn--ghost btn--small" onClick={() => setF(EMPTY_FILTER)}>
            Limpar filtros
          </button>
        )}
      </div>

      {list.length === 0 && <p>Nenhuma música corresponde aos filtros.{f.playableOnly && ' Aprende mais acordes ou desliga «Só as que já consigo tocar».'}</p>}
      <ul className="song-list">
        {list.map((s) => {
          const missing = missingCount(s, known);
          const info = analyzeChords(s.chords, known);
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
                  <span className={`difficulty difficulty--${s.difficulty}`}>{DIFFICULTY_LABEL[s.difficulty]}</span>
                  {s.source === 'user' && <span className="badge">Importada</span>}
                  {s.source === 'catalog' && s.fullSheet && <span className="badge">Letra completa</span>}
                  {s.chords.length > 0 &&
                    (missing === 0 ? (
                      <span className="status-ok">Já sabes todos os acordes</span>
                    ) : (
                      <span className="status-warn">
                        {missing === 1 ? 'Falta 1 acorde' : `Faltam ${missing} acordes`}
                      </span>
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
