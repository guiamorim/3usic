import { useMemo, useState } from 'react';
import { useStore } from '../../app/store';
import { href, navigate } from '../../app/router';
import { Page, ProgressBar } from '../../components/Page';
import { ChordDiagram } from '../../components/ChordDiagram';
import { chordById } from '../../content/chords';
import { GENRE_LABEL } from '../../content/labels';
import { songChordSequence, toChordPro, transposeSong } from '../../domain/chordpro';
import { transposeSymbol } from '../../domain/chordSymbols';
import { findSong, VERSION_LABEL, versionOf, type SongVersion } from '../../domain/songLibrary';
import { ORIGIN_LABEL } from '../../content/songs';
import { buildSongPlan, chordLabel, knownChordIds, suggestCapo, type SongStep } from '../../domain/songPlan';
import { SongSheet } from './SongSheet';
import { parseChordPro, songChords } from '../../domain/chordpro';
import { ChordStrip } from './ChordStrip';
import { DIFFICULTY_LABEL } from './SongsPage';

const FLAT_KEYS = new Set(['F', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm']);
const PRACTICE_MINUTES = [5, 10, 15, 20, 30] as const;

/** Pair id used by «Mudanças num minuto»: a dashed id (F-simples) must come second. */
export function changesPair(a: string, b: string): string {
  return a.includes('-') ? `${b}-${a}` : `${a}-${b}`;
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

export function SongDetailPage({ songId }: { songId: string }) {
  const { data, completedLessons, settings, saveSettings, deleteSong, recordPractice } = useStore();
  const song = useMemo(() => findSong(songId, data.songs), [songId, data.songs]);
  const [semitones, setSemitones] = useState(0);
  const [extraCapo, setExtraCapo] = useState(0);
  const [minutes, setMinutes] = useState<number>(10);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const known = useMemo(() => knownChordIds(completedLessons, settings.knownChords), [completedLessons, settings.knownChords]);
  const fromLessons = useMemo(() => knownChordIds(completedLessons), [completedLessons]);
  // The user's own cifra (with lyrics) pasted for this catalogue song, if any.
  const linked = useMemo(() => data.songs.filter((s) => s.catalogId === songId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0], [data.songs, songId]);
  const linkedSheet = useMemo(() => {
    if (!linked) return null;
    const r = parseChordPro(linked.chordpro);
    return r.ok ? r.song : null;
  }, [linked]);

  if (!song) {
    return (
      <Page title="Música não encontrada" back={{ href: '#/musicas', label: 'Músicas' }}>
        <p>Esta música não existe ou foi apagada.</p>
      </Page>
    );
  }

  const version: SongVersion = settings.songVersion ?? 'simple';
  const current = versionOf(song, version);
  const base = current.sheet;
  const key = base.meta.key;
  const preferFlats = key ? /^[A-G]b/.test(key) || FLAT_KEYS.has(key) : false;
  // Sounding key changes with `semitones`; the extra capo only changes the shapes you play.
  const shapes = transposeSong(base, semitones - extraCapo, preferFlats);
  const totalCapo = base.meta.capo + extraCapo;
  const sequence = songChordSequence(shapes);
  const plan = buildSongPlan({ sequence, known, tempo: base.meta.tempo });
  const capoTip = extraCapo === 0 ? suggestCapo(songChordSequence(transposeSong(base, semitones, preferFlats)), known) : null;
  const isTarget = settings.targetSongId === song.id;
  const knownList = settings.knownChords ?? [];

  async function toggleKnown(id: string, value: boolean) {
    const next = value ? [...new Set([...knownList, id])] : knownList.filter((k) => k !== id);
    await saveSettings({ knownChords: next.slice(0, 100) });
  }

  async function toggleTarget() {
    const ok = await saveSettings({ targetSongId: isTarget ? undefined : song?.id });
    if (ok) setMessage(isTarget ? 'Deixou de ser a tua música objetivo.' : 'Música objetivo definida: aparece no teu plano diário.');
  }

  async function logPractice() {
    const ok = await recordPractice('song', minutes * 60, `Música: ${song?.title ?? ''}`);
    setMessage(ok ? `Registados ${minutes} minutos a tocar esta música.` : 'Não foi possível guardar.');
  }

  async function openMetronome(bpm: number) {
    await saveSettings({ metronomeBpm: Math.min(240, Math.max(30, bpm)) });
    navigate('#/metronomo');
  }

  function downloadChordPro() {
    if (!song) return;
    const blob = new Blob([toChordPro(shapes)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${song.title.replace(/[^\p{L}\p{N} _-]/gu, '').trim() || 'musica'}.cho`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function remove() {
    if (!song) return;
    const ok = await deleteSong(song.id);
    if (ok) navigate('#/musicas');
    else setMessage('Não foi possível apagar.');
  }

  function stepContent(step: SongStep) {
    switch (step.kind) {
      case 'learn':
        return (
          <>
            Aprende o acorde <a href={href('acordes', step.chordId)}>{chordLabel(step.chordId)}</a>
            {chordById(step.chordId)?.barre ? ' (pestana: dá-lhe tempo)' : ''}.
          </>
        );
      case 'changes':
        return (
          <>
            Treina a mudança{' '}
            <a href={href('praticar', 'mudancas', changesPair(step.a, step.b))}>
              {chordLabel(step.a)} ↔ {chordLabel(step.b)}
            </a>{' '}
            — é das mais frequentes nesta música.
          </>
        );
      case 'slow':
        return (
          <>
            Toca a música toda devagar, a {step.bpm} BPM, sem parar nas mudanças.{' '}
            <button type="button" className="btn btn--small btn--secondary" onClick={() => void openMetronome(step.bpm)}>
              Metrónomo a {step.bpm}
            </button>
          </>
        );
      case 'full':
        return step.bpm ? (
          <>
            Sobe aos poucos (5 BPM de cada vez) até ao andamento original, cerca de {step.bpm} BPM.{' '}
            <button type="button" className="btn btn--small btn--secondary" onClick={() => void openMetronome(step.bpm ?? 60)}>
              Metrónomo a {step.bpm}
            </button>
          </>
        ) : (
          <>Toca junto com a gravação original.</>
        );
    }
  }

  const meta = base.meta;
  return (
    <Page title={song.title} back={{ href: '#/musicas', label: 'Músicas' }} subtitle={`${song.artist}${song.year !== null ? ` · ${song.yearApprox ? 'c. ' : ''}${song.year}` : ''}`}>
      <ul className="tag-list" aria-label="Detalhes">
        <li>{GENRE_LABEL[song.genre]}</li>
        {song.origin && <li>{ORIGIN_LABEL[song.origin]}</li>}
        <li>Dificuldade: {DIFFICULTY_LABEL[current.difficulty]}</li>
        {meta.key && <li>Tom: {transposeSymbol(meta.key, semitones, preferFlats)}</li>}
        <li>{totalCapo > 0 ? `Capo na ${totalCapo}.ª casa` : 'Sem capo'}</li>
        {meta.tempo && <li>{meta.tempo} BPM</li>}
        {meta.time && <li>Compasso {meta.time}</li>}
        {song.tuning && <li>Afinação: {song.tuning}</li>}
        {song.source === 'user' && <li>Importada (só neste dispositivo)</li>}
      </ul>
      {song.hasSimple && (
        <fieldset className="version-switch">
          <legend>Versão dos acordes</legend>
          <div className="choice-group choice-group--inline">
            {(['simple', 'full'] as const).map((v) => (
              <label key={v} className="chip">
                <input type="radio" name="versao" checked={version === v} onChange={() => void saveSettings({ songVersion: v })} />
                {VERSION_LABEL[v]}
              </label>
            ))}
          </div>
          <p className="hint">
            {version === 'simple'
              ? 'Sem baixos trocados, extensões nem acordes de passagem: a mesma harmonia com menos acordes diferentes.'
              : `Acordes como na gravação (${song.full.chords.length} diferentes, contra ${song.simple.chords.length} na simplificada).`}
          </p>
        </fieldset>
      )}
      {song.source === 'catalog' && !song.fullSheet && (
        <p className="hint">
          Só acordes, sem letra (direitos de autor).{' '}
          {song.chordSource ? `Acordes conferidos em ${song.chordSource}; as cifras desses sites são feitas por utilizadores e podem ter erros.` : 'Acordes escritos de memória, ainda não conferidos numa fonte.'} Confirma com a gravação; o andamento é aproximado.
        </p>
      )}
      {song.note && <p className="notice notice--tip">{song.note}</p>}

      <div className="button-row">
        <button type="button" className={isTarget ? 'btn btn--secondary' : 'btn btn--primary'} onClick={() => void toggleTarget()} aria-pressed={isTarget}>
          {isTarget ? 'É a tua música objetivo ✓' : 'Quero aprender esta'}
        </button>
        <a className="btn btn--primary" href={`${href('musicas', linked?.id ?? song.id)}/tocar`}>
          Tocar junto{linked ? ' (com a letra)' : ''}
        </a>
      </div>
      {message && (
        <p className="notice notice--success" role="status">
          {message}
        </p>
      )}

      <section className="card" aria-labelledby="plano-musica">
        <h2 id="plano-musica">O teu plano para esta música</h2>
        <ProgressBar value={plan.readiness} label="Acordes que já sabes" />
        <p className="muted">
          Já sabes {plan.chords.filter((c) => c.known).length} de {plan.chords.length} acordes.
          {plan.unsupported.length > 0 && ` Sem diagrama na app: ${plan.unsupported.join(', ')}.`}
        </p>
        {capoTip && (
          <div className="notice notice--tip">
            <p>
              Sugestão: com capo na {base.meta.capo + capoTip.capo}.ª casa, tocas as formas <strong>{capoTip.shapes.join(' – ')}</strong>, mais fáceis para ti. Soa igual.
            </p>
            <button type="button" className="btn btn--small btn--secondary" onClick={() => setExtraCapo(capoTip.capo)}>
              Usar estas formas
            </button>
          </div>
        )}
        <ol className="song-steps">
          {plan.steps.map((s, i) => (
            <li key={i}>{stepContent(s)}</li>
          ))}
        </ol>
        {song.strum && <p className="hint">Ritmo sugerido: {song.strum}</p>}
      </section>

      <section className="card" aria-labelledby="tom-capo">
        <h2 id="tom-capo">Tom e capo</h2>
        <div className="transpose">
          <span className="transpose__group" role="group" aria-label="Transpor (muda o tom)">
            <span>Tom</span>
            <button type="button" className="btn btn--round btn--small" aria-label="Descer meio-tom" onClick={() => setSemitones((n) => Math.max(-11, n - 1))}>
              −
            </button>
            <span className="transpose__value" aria-live="polite">
              {signed(semitones)}
            </span>
            <button type="button" className="btn btn--round btn--small" aria-label="Subir meio-tom" onClick={() => setSemitones((n) => Math.min(11, n + 1))}>
              +
            </button>
          </span>
          <span className="transpose__group" role="group" aria-label="Capo extra (mantém o som, muda as formas)">
            <span>Capo extra</span>
            <button type="button" className="btn btn--round btn--small" aria-label="Menos uma casa de capo" onClick={() => setExtraCapo((n) => Math.max(0, n - 1))}>
              −
            </button>
            <span className="transpose__value" aria-live="polite">
              {extraCapo}
            </span>
            <button type="button" className="btn btn--round btn--small" aria-label="Mais uma casa de capo" onClick={() => setExtraCapo((n) => Math.min(9, n + 1))}>
              +
            </button>
          </span>
          {(semitones !== 0 || extraCapo !== 0) && (
            <button type="button" className="btn btn--ghost btn--small" onClick={() => (setSemitones(0), setExtraCapo(0))}>
              Repor original
            </button>
          )}
        </div>
      </section>

      <section aria-labelledby="acordes-musica">
        <h2 id="acordes-musica">Acordes</h2>
        <ul className="song-chords">
          {plan.chords.map((c) => (
            <li key={c.symbol} className="card">
              <strong>{c.symbol}</strong>
              {c.chord ? (
                <>
                  <a href={href('acordes', c.chord.id)}>
                    <ChordDiagram chord={c.chord} size="sm" showFingers={false} />
                  </a>
                  {c.simplified && <span className="hint">Simplificado: {c.chord.symbol}</span>}
                  {fromLessons.has(c.chord.id) ? (
                    <span className="status-ok">Aprendido numa lição</span>
                  ) : (
                    <label className="chip">
                      <input type="checkbox" checked={knownList.includes(c.chord.id)} onChange={(e) => void toggleKnown(c.chord?.id ?? '', e.target.checked)} />
                      Já sei
                    </label>
                  )}
                </>
              ) : (
                <span className="hint">Sem diagrama na app</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {song.source === 'catalog' && !song.fullSheet && (
        <section className="card" aria-labelledby="letra">
          <h2 id="letra">Letra e cifra completa</h2>
          {linkedSheet && linked ? (
            <>
              <p className="muted">A tua cifra, guardada só neste dispositivo.</p>
              <ChordStrip symbols={songChords(linkedSheet)} />
              <SongSheet song={linkedSheet} />
              <div className="button-row">
                <a className="btn btn--secondary" href={href('musicas', linked.id)}>
                  Abrir a minha cifra (transpor, apagar)
                </a>
              </div>
            </>
          ) : (
            <>
              <p>
                A letra desta música tem direitos de autor, por isso a app não a pode incluir. Os sites de cifras pagam licenças para a mostrar. Podes abri-la lá e colar aqui a cifra com letra: fica só no teu dispositivo, para uso pessoal.
              </p>
              <div className="button-row">
                <a className="btn btn--secondary" href={`https://duckduckgo.com/?q=${encodeURIComponent(`${song.title} ${song.artist} site:cifraclub.com.br`)}`} target="_blank" rel="noopener noreferrer">
                  Procurar no Cifra Club ↗
                </a>
                <a className="btn btn--secondary" href={`https://duckduckgo.com/?q=${encodeURIComponent(`${song.title} ${song.artist} cifra letra`)}`} target="_blank" rel="noopener noreferrer">
                  Procurar noutros sites ↗
                </a>
                <a className="btn btn--primary" href={`#/musicas/importar?para=${encodeURIComponent(song.id)}`}>
                  Colar a cifra com letra
                </a>
              </div>
              <p className="hint">Os botões ↗ abrem um site externo no navegador (a pesquisa envia o título e o artista para esse site). A app em si não faz pedidos a terceiros.</p>
            </>
          )}
        </section>
      )}

      <section className="card" aria-labelledby="cifra">
        <h2 id="cifra">{song.fullSheet ? 'Cifra' : 'Progressão'}</h2>
        <ChordStrip symbols={songChords(shapes)} />
        <SongSheet song={shapes} />
      </section>

      <section className="card" aria-labelledby="registar">
        <h2 id="registar">Registar prática</h2>
        <div className="button-row">
          <label className="field">
            <span>Minutos a tocar esta música</span>
            <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
              {PRACTICE_MINUTES.map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="button" className="btn btn--secondary" onClick={() => void logPractice()}>
          Registar
        </button>
      </section>

      {song.source === 'user' && (
        <section className="card" aria-labelledby="gerir">
          <h2 id="gerir">Gerir</h2>
          <div className="button-row">
            <button type="button" className="btn btn--secondary" onClick={downloadChordPro}>
              Descarregar em ChordPro (.cho)
            </button>
            {!confirmDelete ? (
              <button type="button" className="btn btn--ghost" onClick={() => setConfirmDelete(true)}>
                Apagar música
              </button>
            ) : (
              <>
                <button type="button" className="btn btn--danger" onClick={() => void remove()}>
                  Confirmar: apagar «{song.title}»
                </button>
                <button type="button" className="btn btn--ghost" onClick={() => setConfirmDelete(false)}>
                  Cancelar
                </button>
              </>
            )}
          </div>
        </section>
      )}
    </Page>
  );
}
