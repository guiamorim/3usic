import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../app/store';
import { Page } from '../../components/Page';
import { Tuner, tunerSupport, type TunerError, type TunerStatus } from '../../audio/tuner';
import { tuningState, type TuningState } from '../../audio/pitch';
import { playReference } from '../../audio/synth';
import { isAudioSupported } from '../../audio/context';
import { STANDARD_TUNING } from '../../domain/guitar';
import { SOLFEGE } from '../../domain/notes';

const ERROR_TEXT: Record<TunerError, string> = {
  unsupported: 'Este navegador não permite usar o microfone para afinar. Usa os sons de referência abaixo para afinar de ouvido.',
  insecure: 'O microfone só funciona em ligações seguras (HTTPS) ou em localhost. Abre a aplicação através de um endereço seguro.',
  denied:
    'O acesso ao microfone foi recusado. Para afinar com o microfone, autoriza-o nas definições do navegador para este site e tenta de novo. Entretanto podes afinar de ouvido com os sons de referência.',
  'no-mic': 'Não foi encontrado nenhum microfone. Liga um microfone ou usa os sons de referência.',
  busy: 'O microfone está a ser usado por outra aplicação. Fecha-a e tenta de novo.',
  unknown: 'Não foi possível iniciar o microfone. Tenta de novo ou usa os sons de referência.',
};

const STATE_TEXT: Record<TuningState, string> = {
  flat: 'Baixo — aperta a corda (sobe a afinação)',
  'in-tune': 'Afinado',
  sharp: 'Alto — alivia a corda (desce a afinação)',
};

const HISTORY = 90;

type Mode = 'string' | 'chromatic';

/** Last ~3 s of deviation in cents, drawn as a line so the player sees the pitch move. */
function PitchHistory({ points }: { points: readonly (number | null)[] }) {
  const w = 300;
  const h = 60;
  const y = (c: number) => h / 2 - (Math.max(-50, Math.min(50, c)) / 50) * (h / 2 - 2);
  const paths: string[] = [];
  let current = '';
  points.forEach((c, i) => {
    const x = (i / (HISTORY - 1)) * w;
    if (c === null) {
      if (current) paths.push(current);
      current = '';
      return;
    }
    current += `${current ? 'L' : 'M'}${x.toFixed(1)},${y(c).toFixed(1)}`;
  });
  if (current) paths.push(current);
  return (
    <svg className="pitch-history" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <rect className="pitch-history__zone" x="0" y={y(5)} width={w} height={y(-5) - y(5)} />
      <line className="pitch-history__mid" x1="0" x2={w} y1={h / 2} y2={h / 2} />
      {paths.map((d, i) => (
        <path key={i} className="pitch-history__line" d={d} />
      ))}
    </svg>
  );
}

const fmtHz = (f: number) => f.toFixed(1).replace('.', ',');

export function TunerPage() {
  const { data } = useStore();
  const a4 = data.profile?.a4 ?? 440;
  const [mode, setMode] = useState<Mode>('string');
  const [status, setStatus] = useState<TunerStatus>({ state: 'idle' });
  const [history, setHistory] = useState<(number | null)[]>(() => Array<number | null>(HISTORY).fill(null));
  const [announcement, setAnnouncement] = useState('');
  const tunerRef = useRef<Tuner | null>(null);
  const lastAnnounced = useRef('');
  const support = tunerSupport();

  const modeRef = useRef(mode);
  function changeMode(m: Mode) {
    modeRef.current = m;
    setMode(m);
    setHistory(Array<number | null>(HISTORY).fill(null));
  }

  useEffect(() => {
    const tuner = new Tuner((s) => {
      setStatus(s);
      if (s.state !== 'listening') return;
      const r = s.reading && !s.held ? s.reading : null;
      const c = r ? (modeRef.current === 'string' ? r.string.cents : r.note.cents) : null;
      setHistory((h) => [...h.slice(1), c]);
    }, a4);
    tunerRef.current = tuner;
    const onHide = () => {
      if (document.hidden && tuner.active) tuner.stop();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      tuner.stop();
    };
  }, [a4]);

  const reading = status.state === 'listening' ? status.reading : null;
  const held = status.state === 'listening' && status.held;
  const rawCents = reading ? (mode === 'string' ? reading.string.cents : reading.note.cents) : 0;
  const tState = reading ? tuningState(rawCents) : null;
  const cents = Math.max(-50, Math.min(50, rawCents));
  const level = status.state === 'listening' ? status.level : 0;
  const target = reading ? (mode === 'string' ? reading.string.frequency : reading.note.targetFrequency) : null;

  // Throttled screen-reader announcement: only when string or state changes.
  useEffect(() => {
    if (!reading || !tState) return;
    const key = mode === 'string' ? `${reading.string.string.number}-${tState}` : `${reading.note.pitchClass}${reading.note.octave}-${tState}`;
    if (key === lastAnnounced.current) return;
    lastAnnounced.current = key;
    setAnnouncement(mode === 'string' ? `${reading.string.string.number}.ª corda: ${STATE_TEXT[tState]}` : `${reading.note.pitchClass}: ${STATE_TEXT[tState]}`);
  }, [reading, tState, mode]);

  const listening = status.state === 'listening' || status.state === 'starting';

  return (
    <Page
      title="Afinador"
      back={{ href: '#/ferramentas', label: 'Mais' }}
      subtitle="Afinação padrão (Mi Lá Ré Sol Si Mi). O som do microfone é analisado só neste dispositivo: nada é gravado nem enviado."
    >
      {status.state === 'error' && (
        <p className="notice notice--error" role="alert">
          {ERROR_TEXT[status.error]}
        </p>
      )}
      {support && status.state !== 'error' && <p className="notice notice--info">{ERROR_TEXT[support]}</p>}

      <div className="tuner card">
        {!listening ? (
          <>
            <p>Para afinar com o microfone, carrega no botão. O navegador vai pedir autorização; podes recusar e afinar de ouvido.</p>
            <button type="button" className="btn btn--primary btn--large" onClick={() => void tunerRef.current?.start()} disabled={!!support}>
              Ativar microfone
            </button>
          </>
        ) : (
          <>
            <fieldset className="version-switch">
              <legend>Modo</legend>
              <div className="choice-group choice-group--inline">
                {(
                  [
                    ['string', 'Cordas (afinação padrão)'],
                    ['chromatic', 'Cromático (qualquer nota)'],
                  ] as const
                ).map(([m, label]) => (
                  <label key={m} className="chip">
                    <input type="radio" name="modo-afinador" checked={mode === m} onChange={() => changeMode(m)} />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className={`tuner__display tuner__display--${tState ?? 'none'}${held ? ' tuner__display--held' : ''}`}>
              <p className="tuner__note" aria-hidden="true">
                {reading ? (mode === 'string' ? reading.string.string.pitchClass : reading.note.pitchClass.replace('#', '♯')) : '–'}
              </p>
              <p className="tuner__string">
                {reading
                  ? mode === 'string'
                    ? `${reading.string.string.number}.ª corda · ${reading.string.string.label}`
                    : `${reading.note.pitchClass.replace('#', '♯')}${reading.note.octave} · ${SOLFEGE[reading.note.pitchClass]}`
                  : 'À escuta…'}
              </p>
              <p className="tuner__freq">
                <span>{reading ? `${fmtHz(reading.frequency)} Hz` : '— Hz'}</span>
                {target !== null && <span className="muted"> · alvo {fmtHz(target)} Hz</span>}
              </p>
              <div className="meter" aria-hidden="true">
                <div className="meter__zone" />
                <div className="meter__needle" style={{ left: `${50 + cents}%` }} />
                <span className="meter__label meter__label--left">−50</span>
                <span className="meter__label meter__label--mid">0</span>
                <span className="meter__label meter__label--right">+50</span>
              </div>
              <p className="tuner__state">
                {status.state === 'starting'
                  ? 'A iniciar o microfone…'
                  : reading && mode === 'string' && Math.abs(rawCents) > 100
                    ? `Ouço ${reading.note.pitchClass.replace('#', '♯')}${reading.note.octave}, longe de qualquer corda solta. Se a corda está muito desafinada, usa o modo cromático.`
                    : reading && tState
                      ? `${STATE_TEXT[tState]} (${rawCents > 0 ? '+' : ''}${Math.round(rawCents)} cents)`
                      : status.state === 'listening' && status.hint === 'no-input'
                        ? 'O microfone está ligado mas não chega som. Desliga e volta a ligar o microfone; se continuar, fecha outras apps que usem o microfone (chamadas, gravador) e recarrega a página.'
                        : status.state === 'listening' && status.hint === 'noisy'
                          ? 'Não consigo identificar uma nota. Há ruído ou várias cordas a soar: toca uma corda de cada vez, perto do microfone, e abafa as outras.'
                          : 'Toca uma corda solta e deixa-a soar.'}
              </p>
              <PitchHistory points={history} />
              <div className="level" aria-hidden="true">
                <span>Som captado</span>
                <div className="level__bar">
                  <div className="level__fill" style={{ width: `${Math.round(level * 100)}%` }} />
                </div>
              </div>
            </div>
            <p className="visually-hidden" aria-live="polite">
              {announcement}
            </p>
            <button type="button" className="btn btn--secondary" onClick={() => tunerRef.current?.stop()}>
              Desligar microfone
            </button>
          </>
        )}
      </div>

      <section className="card">
        <h2>Afinar de ouvido</h2>
        <p>Toca o som de referência e a corda ao mesmo tempo. Ajusta até deixares de ouvir «ondulação» entre os dois sons.</p>
        {isAudioSupported() ? (
          <div className="reference-grid">
            {STANDARD_TUNING.map((s) => (
              <button key={s.number} type="button" className="btn btn--secondary" onClick={() => void playReference(s.openMidi, a4).catch(() => undefined)}>
                {s.number}.ª · {s.pitchClass} ({SOLFEGE[s.pitchClass]})
              </button>
            ))}
          </div>
        ) : (
          <p className="notice notice--info">Este navegador não suporta a geração de som.</p>
        )}
        <p className="hint">Referência: Lá = {a4} Hz (alterável em Mais → Perfil e preferências).</p>
      </section>

      <details className="card">
        <summary>Limitações do afinador</summary>
        <ul>
          <li>Funciona melhor com uma corda de cada vez, em ambiente silencioso e perto do microfone.</li>
          <li>Microfones de telemóvel e portáteis variam muito; o rigor esperado é de alguns cents, não o de um afinador profissional.</li>
          <li>Para afinações alternativas (Drop D, meio-tom abaixo) usa o modo cromático e afina cada corda para a nota pretendida.</li>
          <li>No iPhone, se o som não for captado, desliga e volta a ligar o microfone. Confirma também em Definições → Safari → Microfone.</li>
          <li>O microfone é desligado quando sais desta página ou mudas de separador.</li>
        </ul>
      </details>
    </Page>
  );
}
