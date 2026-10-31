import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../app/store';
import { Page } from '../../components/Page';
import { Metronome } from '../../audio/metronome';
import { bpmFromTaps, clampBpm, DEFAULT_SIGNATURE, MAX_BPM, MIN_BPM, TIME_SIGNATURES } from '../../audio/metronomeScheduler';
import { isAudioSupported } from '../../audio/context';

function bpmFromHash(): number | null {
  const q = window.location.hash.split('?')[1];
  if (!q) return null;
  const v = new URLSearchParams(q).get('bpm');
  return v ? clampBpm(Number(v)) : null;
}

export function MetronomePage() {
  const { settings, saveSettings, recordPractice } = useStore();
  const [bpm, setBpm] = useState(() => bpmFromHash() ?? settings.metronomeBpm);
  const [sigLabel, setSigLabel] = useState(settings.metronomeSignature);
  const [accent, setAccent] = useState(settings.metronomeAccent);
  const [volume, setVolume] = useState(settings.metronomeVolume);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const taps = useRef<number[]>([]);
  const signature = TIME_SIGNATURES.find((t) => t.label === sigLabel) ?? DEFAULT_SIGNATURE;
  const [instance] = useState(() => new Metronome({ bpm, signature, accent, volume }, setBeat));
  const metro = useRef<Metronome | null>(instance);

  useEffect(() => {
    metro.current?.update({ bpm, signature, accent, volume });
  }, [bpm, signature, accent, volume]);

  // Persist preferences (debounced) and stop + log practice time on leave.
  useEffect(() => {
    const id = setTimeout(
      () =>
        void saveSettings({
          metronomeBpm: bpm,
          metronomeSignature: sigLabel,
          metronomeAccent: accent,
          metronomeVolume: volume,
        }),
      600,
    );
    return () => clearTimeout(id);
    // saveSettings identity changes with every store update; we only react to the values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpm, sigLabel, accent, volume]);

  const recordRef = useRef(recordPractice);
  useEffect(() => {
    recordRef.current = recordPractice;
  }, [recordPractice]);

  useEffect(() => {
    const m = metro.current;
    return () => {
      if (m?.running) {
        void recordRef.current('metronome', m.elapsed(), 'Metrónomo');
        m.stop();
      }
    };
  }, []);

  async function toggle() {
    const m = metro.current;
    if (!m) return;
    if (m.running) {
      const elapsed = m.elapsed();
      m.stop();
      setRunning(false);
      setBeat(null);
      await recordPractice('metronome', elapsed, `Metrónomo ${bpm} BPM`);
      return;
    }
    try {
      setError(null);
      await m.start();
      setRunning(true);
    } catch {
      setError('Não foi possível iniciar o som. Verifica se o navegador permite áudio.');
    }
  }

  function restart() {
    const m = metro.current;
    if (!m?.running) return;
    m.stop();
    void m.start();
  }

  function tap() {
    const now = performance.now();
    taps.current = [...taps.current, now].slice(-8);
    const b = bpmFromTaps(taps.current);
    if (b) setBpm(b);
  }

  const change = (delta: number) => setBpm((b) => clampBpm(b + delta));

  return (
    <Page title="Metrónomo" back={{ href: '#/ferramentas', label: 'Mais' }} subtitle="Começa devagar. Sobe o andamento só quando tocas sem erros três vezes seguidas.">
      {!isAudioSupported() && <p className="notice notice--error">Este navegador não suporta a Web Audio API; o metrónomo não pode tocar som.</p>}
      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}
      <div className="metronome card">
        <div className="beats" aria-hidden="true">
          {Array.from({ length: signature.beats }, (_, i) => (
            <span key={i} className={`beat ${beat === i ? 'beat--on' : ''} ${i === 0 && accent ? 'beat--accent' : ''}`}>
              {i + 1}
            </span>
          ))}
        </div>
        <p className="visually-hidden" aria-live="polite">
          {running ? `Metrónomo a tocar, ${bpm} batidas por minuto, compasso ${signature.label}` : 'Metrónomo parado'}
        </p>
        <div className="bpm">
          <button type="button" className="btn btn--round" onClick={() => change(-5)} aria-label="Diminuir 5 BPM">
            −5
          </button>
          <button type="button" className="btn btn--round" onClick={() => change(-1)} aria-label="Diminuir 1 BPM">
            −1
          </button>
          <output className="bpm__value" htmlFor="bpm-range" aria-label="Andamento">
            {bpm}
            <small>BPM</small>
          </output>
          <button type="button" className="btn btn--round" onClick={() => change(1)} aria-label="Aumentar 1 BPM">
            +1
          </button>
          <button type="button" className="btn btn--round" onClick={() => change(5)} aria-label="Aumentar 5 BPM">
            +5
          </button>
        </div>
        <label className="field">
          <span className="visually-hidden">Andamento em BPM</span>
          <input id="bpm-range" type="range" min={MIN_BPM} max={MAX_BPM} value={bpm} onChange={(e) => setBpm(clampBpm(Number(e.target.value)))} />
        </label>
        <div className="button-row button-row--center">
          <button type="button" className="btn btn--primary btn--large" onClick={() => void toggle()} disabled={!isAudioSupported()}>
            {running ? 'Pausar' : 'Iniciar'}
          </button>
          {running && (
            <button type="button" className="btn btn--secondary" onClick={restart}>
              Reiniciar
            </button>
          )}
          <button type="button" className="btn btn--secondary" onClick={tap}>
            Bater o andamento
          </button>
        </div>
        <div className="metronome__options">
          <label className="field">
            <span>Compasso</span>
            <select value={sigLabel} onChange={(e) => setSigLabel(e.target.value)}>
              {TIME_SIGNATURES.map((t) => (
                <option key={t.label} value={t.label}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="choice">
            <input type="checkbox" checked={accent} onChange={(e) => setAccent(e.target.checked)} />
            <span>Acentuar o primeiro tempo</span>
          </label>
          <label className="field">
            <span>Volume</span>
            <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
          </label>
        </div>
      </div>
      <p className="hint">
        O som é agendado no relógio de áudio do dispositivo para manter a pulsação estável. Se mudares de separador ou bloqueares o ecrã, alguns navegadores podem pausar ou atrasar o metrónomo.
      </p>
    </Page>
  );
}
