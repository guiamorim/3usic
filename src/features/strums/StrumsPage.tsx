import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../app/store';
import { href } from '../../app/router';
import { Page } from '../../components/Page';
import { SlotClock } from '../../audio/slotClock';
import { chuckAt, clickAt, pluck, strumAt } from '../../audio/synth';
import { getOutputContext, isAudioSupported } from '../../audio/context';
import { RhythmInput } from '../../audio/rhythmInput';
import type { TunerError } from '../../audio/tuner';
import { rhythmReport, type RhythmReport, type Trend } from '../../domain/rhythm';
import { clampBpm } from '../../audio/metronomeScheduler';
import { chordById } from '../../content/chords';
import { STRUMS, strumById, type Stroke, type StrumPattern } from '../../content/strums';
import { CATALOG } from '../../content/songs';
import { countLabels } from '../../domain/strumming';
import { soundingMidi } from '../../domain/guitar';
import { DIFFICULTY_LABEL } from '../songs/SongsPage';

const STROKE_SYMBOL: Record<Stroke, string> = {
  D: '↓',
  U: '↑',
  X: '✕',
  B: 'B',
  '-': '·',
};
const STROKE_NAME: Record<Stroke, string> = {
  D: 'para baixo',
  U: 'para cima',
  X: 'abafado',
  B: 'baixo (nota grave)',
  '-': 'no ar',
};
const MIC_ERROR: Record<TunerError, string> = {
  unsupported: 'Este navegador não permite usar o microfone.',
  insecure: 'O microfone só funciona em ligações seguras (HTTPS).',
  denied: 'O acesso ao microfone foi recusado. Autoriza-o nas definições do navegador para este site.',
  'no-mic': 'Não foi encontrado nenhum microfone.',
  busy: 'O microfone está a ser usado por outra aplicação.',
  unknown: 'Não foi possível iniciar o microfone.',
};

const TREND_TEXT: Record<Trend, string> = {
  steady: 'Andamento estável do princípio ao fim.',
  rushing: 'Estás a acelerar: no fim tocavas mais cedo do que no início. Conta em voz alta e relaxa a mão.',
  dragging: 'Estás a atrasar: no fim tocavas mais tarde do que no início. Mantém a mão sempre em movimento.',
};

// Listening starts after one bar, so the first (usually late) strums don't count.
const SETTLE_BARS = 1;

function RhythmResult({ report }: { report: RhythmReport | null }) {
  if (!report) {
    return (
      <section className="card summary" aria-live="polite">
        <h2>Ritmo: sem dados suficientes</h2>
        <p>A app não ouviu golpes suficientes. Toca pelo menos 20 segundos, mais perto do telemóvel, e confirma que o microfone está autorizado.</p>
      </section>
    );
  }
  return (
    <section className="card summary" aria-live="polite">
      <h2>Ritmo: {report.onTimePercent}% dos golpes no tempo</h2>
      <dl className="stats">
        <div>
          <dt>Regularidade</dt>
          <dd>±{report.spreadMs} ms</dd>
        </div>
        <div>
          <dt>Golpes ouvidos</dt>
          <dd>
            {report.matched} de {report.expected}
          </dd>
        </div>
      </dl>
      <p>{TREND_TEXT[report.trend]}</p>
      <p>
        {report.spreadMs <= 25
          ? 'Muito regular. Sobe 5 BPM.'
          : report.spreadMs <= 45
            ? 'Bom. Repete a este andamento até ficares abaixo de ±25 ms.'
            : 'Ainda irregular: baixa 10 BPM e liga «Ouvir a batida» para imitares o movimento.'}
      </p>
      <p className="hint">
        «No tempo» = até 60 ms do sítio certo. A app desconta o atraso do microfone e do altifalante deste aparelho (cerca de {report.offsetMs} ms), por isso mede a regularidade e não se tocas sempre
        um pouco antes ou depois. Golpes para cima, mais suaves, podem não ser ouvidos. Com auscultadores o resultado é mais fiável.
      </p>
    </section>
  );
}

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
  const [checkRhythm, setCheckRhythm] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [report, setReport] = useState<RhythmReport | null | undefined>(undefined);
  const clock = useRef<SlotClock | null>(null);
  const rhythm = useRef<{
    input: RhythmInput;
    expected: number[];
    from: number;
    slotSec: number;
  } | null>(null);
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
    const r = rhythm.current;
    if (r) {
      r.input.stop();
      rhythm.current = null;
      // Strokes in the last 0.3 s may not have been played or heard yet.
      void getOutputContext()
        .then((ctx) => {
          const until = ctx.currentTime - 0.3;
          setReport(
            rhythmReport(
              r.input.onsets,
              r.expected.filter((t) => t >= r.from && t <= until),
              r.slotSec,
            ),
          );
        })
        .catch(() => setReport(null));
    }
    setRunning(false);
    setActive(null);
    if (seconds >= 20) void recordRef.current('strum', seconds, `Batida: ${pattern.name}`);
  }

  function schedule(slot: number, time: number, ctx: AudioContext): void {
    const i = slot % slots;
    const { chordId: id, guide: g, click: c } = opts.current;
    if (c && i % pattern.subdivision === 0) clickAt(ctx, time, i === 0, 0.3);
    const stroke = pattern.strokes[i];
    if (rhythm.current && stroke && stroke !== '-') rhythm.current.expected.push(time);
    if (!g) return;
    const chord = chordById(id);
    const midis = chord ? soundingMidi(chord.frets) : [];
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
    setMicError(null);
    setReport(undefined);
    const c = new SlotClock(bpm, pattern.subdivision, schedule, (slot) => setActive(slot % slots));
    clock.current = c;
    try {
      await c.start();
      setRunning(true);
    } catch {
      clock.current = null;
      return;
    }
    if (!checkRhythm) return;
    const ctx = await getOutputContext();
    const input = new RhythmInput();
    const slotSec = 60 / bpm / pattern.subdivision;
    rhythm.current = {
      input,
      expected: [],
      from: ctx.currentTime + SETTLE_BARS * slots * slotSec,
      slotSec,
    };
    const err = await input.start(ctx);
    if (err) {
      rhythm.current = null;
      setMicError(MIC_ERROR[err]);
    }
  }

  return (
    <Page title={pattern.name} back={{ href: '#/batidas', label: 'Batidas' }} subtitle={pattern.style}>
      <section className="card">
        <p>{pattern.description}</p>
        <StrumGrid pattern={pattern} active={active} />
        <div className="bpm bpm--compact">
          <button type="button" className="btn btn--round" onClick={() => setBpm((b) => clampBpm(b - 5))} aria-label="Diminuir 5 BPM" disabled={running && checkRhythm}>
            −5
          </button>
          <output className="bpm__value" aria-label="Andamento">
            {bpm}
            <small>BPM</small>
          </output>
          <button type="button" className="btn btn--round" onClick={() => setBpm((b) => clampBpm(b + 5))} aria-label="Aumentar 5 BPM" disabled={running && checkRhythm}>
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
          <input type="checkbox" checked={guide && !checkRhythm} disabled={checkRhythm} onChange={(e) => setGuide(e.target.checked)} />
          Ouvir a batida{checkRhythm ? ' (desligado durante a avaliação)' : ''}
        </label>
        <label className="chip">
          <input type="checkbox" checked={click} onChange={(e) => setClick(e.target.checked)} />
          Clique nos tempos
        </label>
        <label className="chip">
          <input type="checkbox" checked={checkRhythm} disabled={running} onChange={(e) => setCheckRhythm(e.target.checked)} />
          Avaliar o meu ritmo (microfone)
        </label>
        {checkRhythm && !running && (
          <p className="hint">Toca a batida durante pelo menos 20 segundos e carrega em «Parar». O som é analisado só neste aparelho, nada é gravado. Usa auscultadores para o clique, se puderes.</p>
        )}
        {micError && (
          <p className="notice notice--error" role="alert">
            {micError}
          </p>
        )}
        <div className="button-row button-row--center">
          <button type="button" className="btn btn--primary btn--large" onClick={() => void toggle()} disabled={!isAudioSupported()}>
            {running ? 'Parar' : 'Tocar'}
          </button>
        </div>
        <p className="visually-hidden" aria-live="polite">
          {running ? `A tocar a ${bpm} batidas por minuto` : 'Parado'}
        </p>
      </section>

      {report !== undefined && <RhythmResult report={report} />}

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
