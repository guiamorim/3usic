import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../../app/store';
import { href } from '../../app/router';
import { Page } from '../../components/Page';
import { ChordDiagram } from '../../components/ChordDiagram';
import { SlotClock } from '../../audio/slotClock';
import { MicInput } from '../../audio/micInput';
import { clickAt, strumAt } from '../../audio/synth';
import { rms } from '../../audio/pitch';
import type { TunerError } from '../../audio/tuner';
import { matchChord } from '../../domain/chordSymbols';
import { chromagram, judgeChord } from '../../domain/chordDetect';
import { soundingMidi } from '../../domain/guitar';
import {
  beatsPerBar,
  buildTimeline,
  repeatTimeline,
  EMPTY_TALLY,
  eventAt,
  score,
  THRESHOLDS,
  totalBeats,
  verdict,
  type ChordVerdict,
  type FrameTally,
  type MicSensitivity,
  type PlayEvent,
} from '../../domain/playAlong';
import { clampBpm } from '../../audio/metronomeScheduler';
import { slowTempo } from '../../domain/songPlan';
import { findSong, VERSION_LABEL, versionOf, type SongVersion } from '../../domain/songLibrary';

type Mode = 'tempo' | 'espera';
type Phase = 'setup' | 'running' | 'done';

const MIC_ERROR: Record<TunerError, string> = {
  unsupported: 'Este navegador não permite usar o microfone. Podes tocar junto sem avaliação.',
  insecure: 'O microfone só funciona em ligações seguras (HTTPS).',
  denied: 'O acesso ao microfone foi recusado. Autoriza-o nas definições do navegador para este site, ou toca sem avaliação.',
  'no-mic': 'Não foi encontrado nenhum microfone.',
  busy: 'O microfone está a ser usado por outra aplicação.',
  unknown: 'Não foi possível iniciar o microfone.',
};

const ANALYSIS_MS = 100;
// Consecutive recognised frames needed to move on in «esperar» mode (~0.3 s).
const WAIT_FRAMES = 3;

const now = () => performance.now();

const SENSITIVITY_LABEL: Record<MicSensitivity, string> = {
  low: 'Baixa: sala com ruído, menos acertos falsos',
  normal: 'Normal',
  high: 'Alta: microfone fraco ou tocar suave, mais tolerante',
};

interface Live {
  match: boolean;
  heard: string | null;
  level: number;
  rms: number;
  similarity: number;
}

const VERDICT_TEXT: Record<ChordVerdict, string> = {
  hit: 'Certo',
  miss: 'Não reconhecido',
  silent: 'Sem som',
};

function chordMidis(symbol: string): number[] | null {
  const m = matchChord(symbol);
  return m?.chord ? soundingMidi(m.chord.frets) : null;
}

export function PlayAlongPage({ songId }: { songId: string }) {
  const { data, settings, recordPractice, saveSettings } = useStore();
  const sensitivity: MicSensitivity = settings.micSensitivity ?? 'normal';
  const limits = THRESHOLDS[sensitivity];
  const song = useMemo(() => findSong(songId, data.songs), [songId, data.songs]);
  const version: SongVersion = settings.songVersion ?? 'simple';
  const view = song ? versionOf(song, version) : null;
  const meta = view?.sheet.meta;
  const barBeats = beatsPerBar(meta?.time ?? null);
  const barsFromLines = song?.source === 'catalog' && !song.fullSheet;

  const [mode, setMode] = useState<Mode>('tempo');
  const [bpm, setBpm] = useState(() => slowTempo(meta?.tempo ?? null));
  const [beatsPerChord, setBeatsPerChord] = useState(4);
  const [click, setClick] = useState(true);
  const [backing, setBacking] = useState(false);
  const [useMic, setUseMic] = useState(true);
  const [phase, setPhase] = useState<Phase>('setup');
  const [beat, setBeat] = useState(-barBeats);
  const [waitIndex, setWaitIndex] = useState(0);
  const [verdicts, setVerdicts] = useState<ChordVerdict[]>([]);
  const [live, setLive] = useState<Live | null>(null);
  const [diagnostics, setDiagnostics] = useState(false);
  const [tally, setTally] = useState<FrameTally | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(false);
  const [evaluated, setEvaluated] = useState(false);
  const [repeats, setRepeats] = useState(2);

  const timeline = useMemo(
    () =>
      view
        ? repeatTimeline(
            buildTimeline(view.sheet, {
              beatsPerBar: barBeats,
              barsFromLines,
              beatsPerChord,
            }),
            barsFromLines ? repeats : 1,
          )
        : [],
    [view, barBeats, barsFromLines, beatsPerChord, repeats],
  );
  const total = totalBeats(timeline);

  const clock = useRef<SlotClock | null>(null);
  const mic = useRef<MicInput | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const tallies = useRef<FrameTally[]>([]);
  const judged = useRef(0);
  const streak = useRef(0);
  const startedAt = useRef(0);

  function stopAll(): void {
    clock.current?.stop();
    clock.current = null;
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    mic.current?.stop();
    mic.current = null;
    setMicOn(false);
  }

  // Release the microphone and stop sound when leaving the page or the tab.
  useEffect(() => {
    const onHide = () => {
      if (document.hidden) {
        stopAll();
        setPhase((p) => (p === 'running' ? 'done' : p));
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      stopAll();
    };
  }, []);

  if (!song || !view) {
    return (
      <Page title="Música não encontrada" back={{ href: '#/musicas', label: 'Músicas' }}>
        <p>Esta música não existe ou foi apagada.</p>
      </Page>
    );
  }

  const back = { href: href('musicas', song.id), label: song.title };
  const needsMic = mode === 'espera';

  function finish(final: ChordVerdict[]): void {
    setEvaluated(mic.current !== null);
    stopAll();
    setPhase('done');
    setLive(null);
    const seconds = (now() - startedAt.current) / 1000;
    if (seconds >= 20 && song) void recordPractice('song', seconds, `Tocar junto: ${song.title}`);
    setVerdicts(final);
  }

  function closeEvent(index: number): void {
    const v = verdict(tallies.current[index] ?? EMPTY_TALLY, limits.hitRatio);
    judged.current = index + 1;
    setVerdicts((prev) => {
      const next = [...prev];
      next[index] = v;
      return next;
    });
  }

  async function start(): Promise<void> {
    setMicError(null);
    setVerdicts([]);
    tallies.current = timeline.map(() => ({ ...EMPTY_TALLY }));
    judged.current = 0;
    streak.current = 0;
    startedAt.current = now();

    const wantMic = useMic || needsMic;
    // Start audio output inside the click (iOS) before awaiting the microphone.
    const sc = mode === 'tempo' ? new SlotClock(bpm, 1, schedule, (slot) => setBeat(slot - barBeats)) : null;
    const clockStarted = sc ? sc.start(0.4) : Promise.resolve();
    if (wantMic) {
      const m = new MicInput(8192);
      const err = await m.start();
      if (err) {
        setMicError(MIC_ERROR[err]);
        if (needsMic) {
          sc?.stop();
          return;
        }
      } else {
        mic.current = m;
        setMicOn(true);
      }
    }
    await clockStarted.catch(() => undefined);
    clock.current = sc;
    setBeat(-barBeats);
    setWaitIndex(0);
    setPhase('running');
    if (mic.current) {
      const buf = new Float32Array(8192);
      let consecutive = 0;
      let wait = 0;
      timer.current = setInterval(() => {
        const m = mic.current;
        if (!m?.read(buf)) return;
        const level = rms(buf);
        const voiced = level > limits.voicedRms;
        let index: number;
        let inWindow = true;
        if (mode === 'tempo') {
          const c = clock.current;
          if (!c) return;
          const pos = (c.elapsed() - 0.4) / (60 / bpm) - barBeats;
          index = eventAt(timeline, pos);
          // Skip the first part of each chord: hands are still moving.
          const ev = timeline[index];
          if (ev) inWindow = pos - ev.startBeat >= Math.min(0.5, ev.beats * 0.25);
          for (let i = judged.current; i < (index < 0 ? (pos >= total ? timeline.length : 0) : index); i++) closeEvent(i);
          if (index < 0) {
            setLive(null);
            return;
          }
        } else {
          index = wait;
        }
        const ev = timeline[index] as PlayEvent;
        const j = voiced ? judgeChord(chromagram(buf, { sampleRate: m.sampleRate }), ev.chord, limits.minSimilarity) : null;
        setLive({
          match: !!j?.match,
          heard: j?.heard ?? null,
          level: Math.min(1, Math.sqrt(level / 0.2)),
          rms: level,
          similarity: j?.similarity ?? 0,
        });
        if (mode === 'tempo') {
          if (!inWindow) return;
          const t = tallies.current[index] ?? { ...EMPTY_TALLY };
          t.frames++;
          if (voiced) t.voiced++;
          if (j?.match) t.matched++;
          tallies.current[index] = t;
          setTally({ ...t });
          return;
        }
        consecutive = j?.match ? consecutive + 1 : 0;
        if (consecutive >= WAIT_FRAMES) {
          consecutive = 0;
          tallies.current[index] = { frames: 1, voiced: 1, matched: 1 };
          closeEvent(index);
          wait++;
          if (wait >= timeline.length) {
            finish(timeline.map(() => 'hit'));
            return;
          }
          setWaitIndex(wait);
        }
      }, ANALYSIS_MS);
    }
  }

  function schedule(slot: number, time: number, ctx: AudioContext): void {
    const b = slot - barBeats;
    if (b >= total) {
      // One beat after the end: stop on the main thread.
      if (b === total) setTimeout(() => finishTempo(), Math.max(0, (time - ctx.currentTime) * 1000));
      return;
    }
    const barStart = ((b % barBeats) + barBeats) % barBeats === 0;
    if (click) clickAt(ctx, time, barStart, 0.35);
    if (backing && b >= 0) {
      const ev = timeline.find((e) => e.startBeat === b);
      const midis = ev ? chordMidis(ev.chord) : null;
      if (midis) strumAt(ctx, midis, time, 'down', 0.14, Math.min(2.5, (ev?.beats ?? 1) * (60 / bpm)));
    }
  }

  function finishTempo(): void {
    const final = timeline.map((_, i) => (mic.current ? verdict(tallies.current[i] ?? EMPTY_TALLY, limits.hitRatio) : 'silent'));
    if (!mic.current) {
      stopAll();
      setPhase('done');
      setLive(null);
      setVerdicts([]);
      return;
    }
    finish(final);
  }

  function stopEarly(): void {
    if (mode === 'espera') {
      finish(verdicts.slice(0, waitIndex));
      return;
    }
    // Judge the chord in progress too, if it was already heard.
    const partial = tallies.current.map((t, i) => (i < judged.current || t.frames > 0 ? verdict(t, limits.hitRatio) : null)).filter((v): v is ChordVerdict => v !== null);
    finish(partial);
  }

  function skip(): void {
    const next = waitIndex + 1;
    closeEvent(waitIndex);
    if (next >= timeline.length) {
      finish([...verdicts.slice(0, waitIndex), 'miss']);
      return;
    }
    setWaitIndex(next);
  }

  const currentIndex = mode === 'tempo' ? eventAt(timeline, beat) : waitIndex;
  const current = timeline[currentIndex] ?? null;
  const upcoming = timeline[currentIndex >= 0 ? currentIndex + 1 : 0] ?? null;
  const currentChord = current ? matchChord(current.chord)?.chord : null;
  const beatInChord = current ? beat - current.startBeat : -1;
  const result = score(verdicts.filter(Boolean));

  return (
    <Page title={`Tocar junto: ${song.title}`} back={back} subtitle={`${song.artist} · versão ${VERSION_LABEL[version].toLowerCase()} · ${barBeats} tempos por compasso`}>
      {phase === 'setup' && (
        <section className="card">
          <p>A app mostra o acorde que deves tocar, marca o tempo e, se ligares o microfone, verifica se o acorde soou certo. O som é analisado só neste dispositivo: nada é gravado nem enviado.</p>
          <fieldset className="version-switch">
            <legend>Modo</legend>
            <div className="choice-group">
              <label className="choice">
                <input type="radio" name="modo-tocar" checked={mode === 'tempo'} onChange={() => setMode('tempo')} />
                <span>
                  <strong>Seguir o tempo</strong>: os acordes avançam ao ritmo do metrónomo, como na música.
                </span>
              </label>
              <label className="choice">
                <input type="radio" name="modo-tocar" checked={mode === 'espera'} onChange={() => setMode('espera')} />
                <span>
                  <strong>Esperar por mim</strong>: só avança quando o microfone reconhece o acorde. Bom para aprender as mudanças.
                </span>
              </label>
            </div>
          </fieldset>
          {mode === 'tempo' && (
            <>
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
              <p className="hint center">{meta?.tempo ? `Andamento original: cerca de ${meta.tempo} BPM. Começa devagar.` : 'Andamento original desconhecido: ajusta ao teu ritmo.'}</p>
              {barsFromLines && (
                <label className="field">
                  <span>Repetir a progressão</span>
                  <select value={repeats} onChange={(e) => setRepeats(Number(e.target.value))}>
                    {[1, 2, 4, 8].map((n) => (
                      <option key={n} value={n}>
                        {n === 1 ? '1 vez' : `${n} vezes`}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {!barsFromLines && (
                <label className="field">
                  <span>Tempos por acorde</span>
                  <select value={beatsPerChord} onChange={(e) => setBeatsPerChord(Number(e.target.value))}>
                    {[2, 4, 8].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="chip">
                <input type="checkbox" checked={click} onChange={(e) => setClick(e.target.checked)} />
                Clique do metrónomo
              </label>
              <label className="chip">
                <input type="checkbox" checked={useMic} onChange={(e) => setUseMic(e.target.checked)} />
                Avaliar com o microfone
              </label>
              <label className="chip">
                <input type="checkbox" checked={backing && !useMic} disabled={useMic} onChange={(e) => setBacking(e.target.checked)} />
                Acompanhamento (a app toca o acorde)
                {useMic ? ': desliga o microfone para usar' : ''}
              </label>
            </>
          )}
          {(useMic || needsMic) && (
            <>
              <label className="field">
                <span>Sensibilidade do microfone</span>
                <select
                  value={sensitivity}
                  onChange={(e) =>
                    void saveSettings({
                      micSensitivity: e.target.value as MicSensitivity,
                    })
                  }
                >
                  {(Object.keys(SENSITIVITY_LABEL) as MicSensitivity[]).map((k) => (
                    <option key={k} value={k}>
                      {SENSITIVITY_LABEL[k]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="chip">
                <input type="checkbox" checked={diagnostics} onChange={(e) => setDiagnostics(e.target.checked)} />
                Mostrar diagnóstico (o que o microfone ouve)
              </label>
            </>
          )}
          <p className="hint">
            {timeline.length} acordes · {mode === 'tempo' ? `cerca de ${Math.round((total * 60) / bpm / 6) / 10} min` : 'ao teu ritmo'}. A gravação original não é reproduzida (direitos de autor); se
            quiseres, põe a música a tocar noutro aparelho.
          </p>
          {micError && (
            <p className="notice notice--error" role="alert">
              {micError}
            </p>
          )}
          <button type="button" className="btn btn--primary btn--large" onClick={() => void start()} disabled={timeline.length === 0}>
            Começar
          </button>
          {timeline.length === 0 && <p className="notice notice--info">Esta música não tem acordes para tocar.</p>}
        </section>
      )}

      {phase === 'running' && (
        <section className="card play-along" aria-live="off">
          {micError && <p className="notice notice--info">{micError} A tocar sem avaliação.</p>}
          {mode === 'tempo' && beat < 0 ? (
            <p className="play-along__count" role="status">
              Prepara-te… {-beat}
            </p>
          ) : (
            <p className="step-indicator">
              Acorde {Math.max(0, currentIndex) + 1} de {timeline.length}
              {current?.section ? ` · ${current.section}` : ''}
            </p>
          )}
          <div className={`play-along__now${live?.match ? ' play-along__now--ok' : ''}`}>
            <p className="play-along__chord" aria-live="polite">
              {current?.chord ?? timeline[0]?.chord ?? ''}
            </p>
            {currentChord && <ChordDiagram chord={currentChord} size="sm" />}
          </div>
          {mode === 'tempo' && current && (
            <div className="beats beats--small" aria-hidden="true">
              {Array.from({ length: current.beats }, (_, i) => (
                <span key={i} className={`beat ${i === beatInChord ? 'beat--on' : ''}`}>
                  {i + 1}
                </span>
              ))}
            </div>
          )}
          {current?.lyric && <p className="play-along__lyric">{current.lyric}</p>}
          <p className="muted">A seguir: {upcoming ? <strong>{upcoming.chord}</strong> : 'fim'}</p>
          {micOn && (
            <div className="play-along__feedback">
              <div className="level" aria-hidden="true">
                <span>Som captado</span>
                <div className="level__bar">
                  <div
                    className="level__fill"
                    style={{
                      width: `${Math.round((live?.level ?? 0) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <p className={live?.match ? 'status-ok' : 'muted'}>{live ? (live.match ? '✓ Acorde reconhecido' : live.heard ? `Parece ${live.heard}` : 'Toca o acorde') : 'À escuta…'}</p>
              {diagnostics && (
                <dl className="diagnostics" aria-label="Diagnóstico do microfone">
                  <div>
                    <dt>Nível (RMS)</dt>
                    <dd>
                      {(live?.rms ?? 0).toFixed(4)} <span className="muted">· silêncio abaixo de {limits.voicedRms}</span>
                    </dd>
                  </div>
                  <div>
                    <dt>Semelhança com {current?.chord ?? '—'}</dt>
                    <dd>
                      {Math.round((live?.similarity ?? 0) * 100)}% <span className="muted">· mínimo {Math.round(limits.minSimilarity * 100)}%</span>
                    </dd>
                  </div>
                  <div>
                    <dt>Soa mais a</dt>
                    <dd>{live?.heard ?? '—'}</dd>
                  </div>
                  {mode === 'tempo' && tally && (
                    <div>
                      <dt>Este acorde</dt>
                      <dd>
                        {tally.matched} reconhecidos / {tally.voiced} com som / {tally.frames} leituras <span className="muted">· certo a partir de {Math.round(limits.hitRatio * 100)}%</span>
                      </dd>
                    </div>
                  )}
                </dl>
              )}
              <p className="muted">
                Certos: {verdicts.filter((v) => v === 'hit').length} · Sequência:{' '}
                {(() => {
                  let s = 0;
                  for (let i = verdicts.length - 1; i >= 0 && verdicts[i] === 'hit'; i--) s++;
                  return s;
                })()}
              </p>
            </div>
          )}
          <div className="button-row button-row--center">
            {mode === 'espera' && (
              <button type="button" className="btn btn--secondary" onClick={skip}>
                Saltar acorde
              </button>
            )}
            <button type="button" className="btn btn--secondary" onClick={stopEarly}>
              Parar
            </button>
          </div>
        </section>
      )}

      {phase === 'done' && (
        <section className="card summary" aria-live="polite">
          {verdicts.length > 0 ? (
            <>
              <h2>
                Pontuação: {result.percent}% ({result.hits} de {verdicts.filter(Boolean).length} acordes)
              </h2>
              <p>
                Melhor sequência: {result.bestStreak} · Não reconhecidos: {result.misses} · Sem som: {result.silent}
              </p>
              <p>
                {result.percent >= 85
                  ? 'Muito bem! Sobe 5 BPM e repete.'
                  : result.percent >= 60
                    ? 'Bom caminho. Repete ao mesmo andamento até passares dos 85%.'
                    : 'Baixa o andamento ou usa o modo «Esperar por mim» para treinar as mudanças.'}
              </p>
              <ul className="tag-list" aria-label="Resultado por acorde">
                {timeline.slice(0, verdicts.length).map((e, i) => (
                  <li key={e.index} className={verdicts[i] === 'hit' ? 'is-known' : undefined}>
                    {e.chord}: {VERDICT_TEXT[verdicts[i] ?? 'silent']}
                  </li>
                ))}
              </ul>
              <p className="hint">
                Se a avaliação te parecer injusta, muda a «Sensibilidade do microfone» ou liga o diagnóstico e diz-nos o que vês. O reconhecimento distingue bem acordes maiores, menores e de
                fundamental diferente; extensões (7, 7M, sus, 9) não são verificadas ao pormenor. Ruído e outros instrumentos baixam a pontuação.
              </p>
            </>
          ) : evaluated ? (
            <>
              <h2>Sem resultado</h2>
              <p>Paraste antes de a app conseguir avaliar o primeiro acorde. Tenta outra vez e deixa tocar pelo menos um acorde inteiro.</p>
            </>
          ) : (
            <>
              <h2>Chegaste ao fim</h2>
              <p>Liga «Avaliar com o microfone» para receberes pontuação.</p>
            </>
          )}
          <div className="button-row">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                setPhase('setup');
                setVerdicts([]);
                setBeat(-barBeats);
              }}
            >
              Tocar outra vez
            </button>
            <a className="btn btn--secondary" href={back.href}>
              Voltar à música
            </a>
          </div>
        </section>
      )}
    </Page>
  );
}
