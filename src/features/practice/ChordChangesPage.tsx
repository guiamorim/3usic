import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../app/store';
import { Page } from '../../components/Page';
import { ChordDiagram } from '../../components/ChordDiagram';
import { chordById } from '../../content/chords';
import { LessonContinue } from '../curriculum/LessonContinue';

const PAIRS = ['A-D', 'D-G', 'G-C', 'C-Am', 'Am-E', 'Em-G', 'D-Em', 'C-Fmaj7', 'C-F-simples', 'E-A'] as const;
const DURATION = 60;

// Pairs are "X-Y"; the second id may itself contain a dash (e.g. "C-F-simples").
function splitPair(pair: string): [string, string] {
  const dash = pair.indexOf('-');
  return [pair.slice(0, dash), pair.slice(dash + 1)];
}

function isValidPair(pair: string | undefined): pair is string {
  if (!pair || pair.length > 40 || !pair.includes('-')) return false;
  const [a, b] = splitPair(pair);
  return a !== b && chordById(a) !== undefined && chordById(b) !== undefined;
}

function pairLabel(pair: string): string {
  const [a, b] = splitPair(pair);
  const name = (id: string) => (id === 'F-simples' ? 'F (simplificado)' : (chordById(id)?.symbol ?? id));
  return `${name(a)} ↔ ${name(b)}`;
}

/** `initialPair` comes from the URL (e.g. a song plan); unknown chords are ignored. */
export function ChordChangesPage({ initialPair }: { initialPair?: string }) {
  const { data, recordChordChanges } = useStore();
  const custom = isValidPair(initialPair) && !(PAIRS as readonly string[]).includes(initialPair) ? initialPair : null;
  const options: readonly string[] = custom ? [custom, ...PAIRS] : PAIRS;
  const [pair, setPair] = useState<string>(isValidPair(initialPair) ? initialPair : PAIRS[0]);
  const [phase, setPhase] = useState<'ready' | 'running' | 'count' | 'saved'>('ready');
  const [remaining, setRemaining] = useState(DURATION);
  const [count, setCount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const endsAt = useRef(0);

  useEffect(() => {
    if (phase !== 'running') return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((endsAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) setPhase('count');
    }, 200);
    return () => clearInterval(id);
  }, [phase]);

  const [a, b] = splitPair(pair);
  const chordA = chordById(a);
  const chordB = chordById(b);
  const history = data.chordChanges.filter((c) => c.pair === pair).slice(-5);
  const best = Math.max(0, ...data.chordChanges.filter((c) => c.pair === pair).map((c) => c.changes));

  async function save() {
    const n = Number(count);
    if (!Number.isInteger(n) || n < 0 || n > 300) {
      setError('Indica um número inteiro entre 0 e 300.');
      return;
    }
    setError(null);
    const ok = await recordChordChanges(pair, n);
    if (ok) setPhase('saved');
    else setError('Não foi possível guardar.');
  }

  return (
    <Page title="Mudanças num minuto" back={{ href: '#/praticar', label: 'Praticar' }} subtitle="Conta quantas vezes mudas entre os dois acordes, com som limpo, em 60 segundos. Cada mudança conta uma vez (A → D = 1).">
      <label className="field">
        <span>Par de acordes</span>
        <select value={pair} onChange={(e) => setPair(e.target.value)} disabled={phase === 'running'}>
          {options.map((p) => (
            <option key={p} value={p}>
              {pairLabel(p)}
            </option>
          ))}
        </select>
      </label>
      <div className="chord-row">
        {chordA && <ChordDiagram chord={chordA} />}
        {chordB && <ChordDiagram chord={chordB} />}
      </div>

      {phase === 'running' ? (
        <div className="timer" role="timer" aria-live="off">
          <p className="timer__value">{remaining}s</p>
          <p aria-live="polite" className="visually-hidden">
            {remaining === 30 ? 'Faltam 30 segundos' : remaining === 10 ? 'Faltam 10 segundos' : ''}
          </p>
          <button type="button" className="btn btn--ghost" onClick={() => setPhase('count')}>
            Terminar antes
          </button>
        </div>
      ) : phase === 'count' ? (
        <div className="card">
          <p role="status">Tempo! Quantas mudanças limpas fizeste?</p>
          <label className="field">
            <span>Número de mudanças</span>
            <input type="number" inputMode="numeric" min={0} max={300} value={count} onChange={(e) => setCount(e.target.value)} autoFocus />
          </label>
          {error && <p className="notice notice--error">{error}</p>}
          <button type="button" className="btn btn--primary" onClick={() => void save()}>
            Guardar resultado
          </button>
        </div>
      ) : (
        <div className="button-row">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              endsAt.current = Date.now() + DURATION * 1000;
              setRemaining(DURATION);
              setCount('');
              setPhase('running');
            }}
          >
            {phase === 'saved' ? 'Fazer outra vez' : 'Iniciar 60 segundos'}
          </button>
        </div>
      )}
      {phase === 'saved' && (
        <>
          <p role="status">Resultado guardado. Repete amanhã: o número sobe com prática espaçada.</p>
          <div className="button-row">
            <LessonContinue passed />
          </div>
        </>
      )}

      <section className="card">
        <h2>Histórico deste par</h2>
        {history.length === 0 ? (
          <p className="muted">Ainda sem resultados.</p>
        ) : (
          <>
            <p>Melhor: {best} mudanças/min</p>
            <ul>
              {history.map((h) => (
                <li key={h.id}>
                  {h.day.split('-').reverse().join('/')}: {h.changes}
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="hint">Referência aproximada: 30 ou mais mudanças por minuto costuma ser suficiente para tocar canções simples a andamento lento. É uma indicação prática, não uma regra.</p>
      </section>
    </Page>
  );
}
