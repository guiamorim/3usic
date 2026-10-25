import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../app/store';
import { href } from '../../app/router';
import { Page } from '../../components/Page';
import { SlotClock } from '../../audio/slotClock';
import { chuckAt, clickAt, pluck, strumAt } from '../../audio/synth';
import { isAudioSupported } from '../../audio/context';
import { clampBpm } from '../../audio/metronomeScheduler';
import { chordById } from '../../content/chords';
import { STRUMS, strumById, type Stroke, type StrumPattern } from '../../content/strums';
import { CATALOG } from '../../content/songs';
import { countLabels } from '../../domain/strumming';
import { soundingMidi } from '../../domain/guitar';
import { DIFFICULTY_LABEL } from '../songs/SongsPage';

const STROKE_SYMBOL: Record<Stroke, string> = { D: '↓', U: '↑', X: '✕', B: 'B', '-': '·' };
const STROKE_NAME: Record<Stroke, string> = { D: 'para baixo', U: 'para cima', X: 'abafado', B: 'baixo (nota grave)', '-': 'no ar' };
const PRACTICE_CHORDS = ['G', 'C', 'D', 'Em', 'Am', 'E', 'A', 'Dm', 'E5', 'A5'] as const;

function StrumGrid({ pattern, active }: { pattern: StrumPattern; active: number | null }) {
  const counts = countLabels(pattern);
  return (
    <table className="strum strum--grid">
      <caption className="visually-hidden">Batida {pattern.name}: ↓ para baixo, ↑ para cima, ✕ abafado, B baixo, · no ar</caption>
      <tbody>
        <tr>
          {pattern.strokes.map((s, i) => (
            <td
              key={i}
              className={`${s === '-' ? 'strum__ghost' : 'strum__stroke'}${pattern.accents?.includes(i) ? ' strum__accent' : ''}${active === i ? ' strum__now' : ''}`}
              aria-label={STROKE_NAME[s]}
            >
              {STROKE_SYMBOL[s]}
            </td>
          ))}
        </tr>
        <tr>
          {counts.map((c, i) => (
            <td key={i} className={`strum__count${i % pattern.subdivision === 0 ? ' strum__count--beat' : ''}`}>
              {c}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

function StrumList() {
  return (
    <Page title="Batidas" subtitle="Padrões de rasgueado para treinar a mão direita, do mais simples ao mais exigente. Ouve, vê o cursor e toca junto.">
      <details className="card">
        <summary>Como ler as batidas</summary>
        <ul>
          <li>↓ golpe para baixo (das cordas graves para as agudas) · ↑ golpe para cima (só as cordas agudas).</li>
          <li>· a mão faz o movimento no ar, sem tocar: é isto que mantém o ritmo certo.</li>
          <li>✕ abafado: a mão bate nas cordas com a palma, som percussivo · B nota grave do acorde, com o polegar.</li>
          <li>Números são os tempos; «e», «a» e «&» são as subdivisões entre tempos.</li>
        </ul>
      </details>
      <ul className="song-list">
        {STRUMS.map((p) => (
          <li key={p.id}>
            <a className="card song-card" href={href('batidas', p.id)}>
              <strong className="song-card__title">{p.name}</strong>
              <span className="muted">{p.style}</span>
              <span className="song-card__meta">
                <span className={`difficulty difficulty--${p.level}`}>{DIFFICULTY_LABEL[p.level]}</span>
                <span className="badge">
                  {p.beats} tempos · {p.subdivision === 2 ? 'colcheias' : p.subdivision === 3 ? 'tercinas' : 'semicolcheias'}
                </span>
              </span>
              <span className="strum-inline" aria-hidden="true">
                {p.strokes.map((s) => STROKE_SYMBOL[s]).join(' ')}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Page>
  );
}

function StrumTrainer({ pattern }: { pattern: StrumPattern }) {
  const { recordPractice } = useStore();
  const [bpm, setBpm] = useState(pattern.bpm.start);
  const [chordId, setChordId] = useState<string>('G');
  const [guide, setGuide] = useState(true);
  const [click, setClick] = useState(true);
  const [active, setActive] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const clock = useRef<SlotClock | null>(null);
  const opts = useRef({ chordId, guide, click });
  const slots = pattern.strokes.length;
  const index = STRUMS.findIndex((p) => p.id === pattern.id);
  const next = STRUMS[index + 1];
  const songs = CATALOG.filter((s) => pattern.songIds?.includes(s.id));

  useEffect(() => {
    opts.current = { chordId, guide, click };
  }, [chordId, guide, click]);

  useEffect(() => {
    clock.current?.setBpm(bpm);
  }, [bpm]);

  const recordRef = useRef(recordPractice);
  useEffect(() => {
    recordRef.current = recordPractice;
  }, [recordPractice]);

  useEffect(() => {
    const onHide = () => {
      if (document.hidden) stop();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      stop();
    };
    // stop() only touches refs and setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stop(): void {
    const c = clock.current;
    if (!c) return;
    const seconds = c.elapsed();
    c.stop();
    clock.current = null;
    setRunning(false);
    setActive(null);
    if (seconds >= 20) void recordRef.current('strum', seconds, `Batida: ${pattern.name}`);
  }

  function schedule(slot: number, time: number, ctx: AudioContext): void {
    const i = slot % slots;
    const { chordId: id, guide: g, click: c } = opts.current;
    if (c && i % pattern.subdivision === 0) clickAt(ctx, time, i === 0, 0.3);
    if (!g) return;
    const chord = chordById(id);
    const midis = chord ? soundingMidi(chord.frets) : [];
    const stroke = pattern.strokes[i];
    const accent = pattern.accents?.includes(i) ?? false;
    const vol = accent ? 0.2 : 0.13;
    if (stroke === 'D') strumAt(ctx, midis, time, 'down', vol, 0.6);
    else if (stroke === 'U') strumAt(ctx, midis, time, 'up', vol, 0.5);
    else if (stroke === 'X') chuckAt(ctx, time, 0.45);
    else if (stroke === 'B' && midis[0] !== undefined) pluck(ctx, midis[0], time, 0.7, 0.3);
  }

  async function toggle(): Promise<void> {
    if (clock.current) {
      stop();
      return;
    }
    const c = new SlotClock(bpm, pattern.subdivision, schedule, (slot) => setActive(slot % slots));
    clock.current = c;
    try {
      await c.start();
      setRunning(true);
    } catch {
      clock.current = null;
    }
  }

  return (
    <Page title={pattern.name} back={{ href: '#/batidas', label: 'Batidas' }} subtitle={pattern.style}>
      <section className="card">
        <p>{pattern.description}</p>
        <StrumGrid pattern={pattern} active={active} />
        <div className="bpm bpm--compact">
          <button type="button" className="btn btn--round" onClick={() => setBpm((b) => clampBpm(b - 5))} aria-label="Diminuir 5 BPM">
            −5
          </button>
          <output className="bpm__value" aria-label="Andamento">
            {bpm}
            <small>BPM</small>
          </output>
          <button type="button" className="btn btn--round" onClick={() => setBpm((b) => clampBpm(b + 5))} aria-label="Aumentar 5 BPM">
            +5
          </button>
        </div>
        <p className="hint center">
          Começa a {pattern.bpm.start} BPM. Objetivo: {pattern.bpm.target} BPM sem falhar o movimento.
        </p>
        <div className="filters">
          <label className="field">
            <span>Acorde</span>
            <select value={chordId} onChange={(e) => setChordId(e.target.value)}>
              {PRACTICE_CHORDS.filter((id) => chordById(id)).map((id) => (
                <option key={id} value={id}>
                  {chordById(id)?.symbol}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="chip">
          <input type="checkbox" checked={guide} onChange={(e) => setGuide(e.target.checked)} />
          Ouvir a batida
        </label>
        <label className="chip">
          <input type="checkbox" checked={click} onChange={(e) => setClick(e.target.checked)} />
          Clique nos tempos
        </label>
        <div className="button-row button-row--center">
          <button type="button" className="btn btn--primary btn--large" onClick={() => void toggle()} disabled={!isAudioSupported()}>
            {running ? 'Parar' : 'Tocar'}
          </button>
        </div>
        <p className="visually-hidden" aria-live="polite">
          {running ? `A tocar a ${bpm} batidas por minuto` : 'Parado'}
        </p>
      </section>

      <section className="card">
        <h2>Dicas</h2>
        <ul>
          {pattern.tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p className="hint">Sugestão de treino: 2 minutos só a ouvir e a mexer a mão no ar, depois 3 minutos a tocar. Desliga «Ouvir a batida» quando já não precisares e fica só com o clique.</p>
      </section>

      {songs.length > 0 && (
        <section className="card">
          <h2>Músicas onde funciona</h2>
          <ul>
            {songs.map((s) => (
              <li key={s.id}>
                <a href={href('musicas', s.id)}>
                  {s.title} · {s.artist}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      {next && (
        <a className="btn btn--secondary" href={href('batidas', next.id)}>
          Próxima batida: {next.name}
        </a>
      )}
    </Page>
  );
}

export function StrumsPage({ patternId }: { patternId?: string }) {
  if (!patternId) return <StrumList />;
  const pattern = strumById(patternId);
  if (!pattern) {
    return (
      <Page title="Batida não encontrada" back={{ href: '#/batidas', label: 'Batidas' }}>
        <p>Esta batida não existe.</p>
      </Page>
    );
  }
  return <StrumTrainer pattern={pattern} />;
}
