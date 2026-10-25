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
  denied: 'O acesso ao microfone foi recusado. Para afinar com o microfone, autoriza-o nas definições do navegador para este site e tenta de novo. Entretanto podes afinar de ouvido com os sons de referência.',
  'no-mic': 'Não foi encontrado nenhum microfone. Liga um microfone ou usa os sons de referência.',
  busy: 'O microfone está a ser usado por outra aplicação. Fecha-a e tenta de novo.',
  unknown: 'Não foi possível iniciar o microfone. Tenta de novo ou usa os sons de referência.',
};

const STATE_TEXT: Record<TuningState, string> = {
  flat: 'Baixo — aperta a corda (sobe a afinação)',
  'in-tune': 'Afinado',
  sharp: 'Alto — alivia a corda (desce a afinação)',
};

export function TunerPage() {
  const { data } = useStore();
  const a4 = data.profile?.a4 ?? 440;
  const [status, setStatus] = useState<TunerStatus>({ state: 'idle' });
  const [announcement, setAnnouncement] = useState('');
  const tunerRef = useRef<Tuner | null>(null);
  const lastAnnounced = useRef('');
  const support = tunerSupport();

  useEffect(() => {
    const tuner = new Tuner(setStatus, a4);
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
  const tState = reading ? tuningState(reading.string.cents) : null;
  const cents = reading ? Math.max(-50, Math.min(50, reading.string.cents)) : 0;

  // Throttled screen-reader announcement: only when string or state changes.
  useEffect(() => {
    if (!reading || !tState) return;
    const key = `${reading.string.string.number}-${tState}`;
    if (key === lastAnnounced.current) return;
    lastAnnounced.current = key;
    setAnnouncement(`${reading.string.string.number}.ª corda: ${STATE_TEXT[tState]}`);
  }, [reading, tState]);

  const listening = status.state === 'listening' || status.state === 'starting';

  return (
    <Page title="Afinador" back={{ href: '#/ferramentas', label: 'Ferramentas' }} subtitle="Afinação padrão (Mi Lá Ré Sol Si Mi). O som do microfone é analisado só neste dispositivo: nada é gravado nem enviado.">
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
            <div className={`tuner__display tuner__display--${tState ?? 'none'}`}>
              <p className="tuner__note" aria-hidden="true">
                {reading ? reading.string.string.pitchClass : '–'}
              </p>
              <p className="tuner__string">{reading ? `${reading.string.string.number}.ª corda · ${reading.string.string.label}` : 'À escuta…'}</p>
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
                  : reading && tState
                    ? `${STATE_TEXT[tState]} (${reading.string.cents > 0 ? '+' : ''}${Math.round(reading.string.cents)} cents)`
                    : status.state === 'listening' && status.hint === 'noisy'
                      ? 'Não consigo identificar uma nota. Há ruído ou várias cordas a soar: toca uma corda de cada vez, perto do microfone, e abafa as outras.'
                      : 'Toca uma corda solta e deixa-a soar.'}
              </p>
              {reading && (
                <p className="muted">
                  Nota detetada: {reading.note.pitchClass.replace('#', '♯')}
                  {reading.note.octave} ({SOLFEGE[reading.note.pitchClass]}) · {reading.frequency.toFixed(1).replace('.', ',')} Hz
                </p>
              )}
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
        <p className="hint">Referência: Lá = {a4} Hz (alterável em Ferramentas → Perfil e preferências).</p>
      </section>

      <details className="card">
        <summary>Limitações do afinador</summary>
        <ul>
          <li>Funciona melhor com uma corda de cada vez, em ambiente silencioso e perto do microfone.</li>
          <li>Microfones de telemóvel e portáteis variam muito; o rigor esperado é de alguns cents, não o de um afinador profissional.</li>
          <li>Afinações alternativas (Drop D, meio-tom abaixo) ainda não são suportadas.</li>
          <li>O microfone é desligado quando sais desta página ou mudas de separador.</li>
        </ul>
      </details>
    </Page>
  );
}
