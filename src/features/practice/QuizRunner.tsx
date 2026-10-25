import { useEffect, useRef, useState } from 'react';
import type { Question } from '../../domain/exercises';
import { chordById } from '../../content/chords';
import { ChordDiagram } from '../../components/ChordDiagram';
import { Fretboard } from '../../components/Fretboard';
import { NoteFigure } from '../../components/NoteFigure';
import { playInterval } from '../../audio/synth';
import { isAudioSupported } from '../../audio/context';

export interface QuizItem {
  question: Question;
  skillId: string;
}

export interface SkillResult {
  skillId: string;
  correct: number;
  total: number;
}

function Visual({ q }: { q: Question }) {
  const [revealed, setRevealed] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const v = q.visual;
  switch (v.kind) {
    case 'fretboard': {
      const maxFret = Math.max(5, Math.min(12, v.fret + 1));
      return (
        <Fretboard
          strings={[1, 2, 3, 4, 5, 6]}
          maxFret={maxFret}
          highlight={{ string: v.string, fret: v.fret }}
          label={`Posição assinalada: ${v.string}.ª corda, ${v.fret === 0 ? 'solta' : `casa ${v.fret}`}.`}
        />
      );
    }
    case 'chord': {
      const c = chordById(v.chordId);
      // Hide the chord name from the accessible label: describeChord lists strings/frets only.
      return c ? <ChordDiagram chord={{ ...c, symbol: '?' }} size="lg" /> : null;
    }
    case 'rhythm':
      return (
        <div className="rhythm-figures">
          {v.values.map((val, i) => (
            <NoteFigure key={i} value={val} />
          ))}
        </div>
      );
    case 'interval':
      return (
        <div className="interval-box">
          {isAudioSupported() && (
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => {
                playInterval(v.midi[0], v.midi[1]).catch(() => setAudioError(true));
              }}
            >
              ▶ Ouvir intervalo
            </button>
          )}
          <button type="button" className="btn btn--ghost" onClick={() => setRevealed((r) => !r)} aria-expanded={revealed}>
            {revealed ? 'Esconder notas' : 'Mostrar as notas (alternativa visual)'}
          </button>
          {revealed && (
            <p>
              Notas: <strong>{v.noteNames[0]}</strong> → <strong>{v.noteNames[1]}</strong>
              {v.midi[1] - v.midi[0] === 12 ? ' (uma oitava acima)' : ''}
            </p>
          )}
          {(audioError || !isAudioSupported()) && <p className="hint">Som indisponível neste dispositivo: usa a alternativa visual.</p>}
        </div>
      );
    default:
      return null;
  }
}

interface Props {
  items: QuizItem[];
  onFinish(results: SkillResult[], durationSec: number): void;
}

export function QuizRunner({ items, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const startedAt = useRef(0);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const item = items[index];
  if (!item) return null;
  const q = item.question;
  const answered = chosen !== null;

  function choose(option: string) {
    if (answered) return;
    setChosen(option);
    setAnswers((a) => [...a, option === q.answer]);
    requestAnimationFrame(() => feedbackRef.current?.focus());
  }

  function next() {
    if (index + 1 >= items.length) {
      const all = [...answers];
      const bySkill = new Map<string, SkillResult>();
      items.forEach((it, i) => {
        const r = bySkill.get(it.skillId) ?? { skillId: it.skillId, correct: 0, total: 0 };
        r.total++;
        if (all[i]) r.correct++;
        bySkill.set(it.skillId, r);
      });
      onFinish([...bySkill.values()], (Date.now() - startedAt.current) / 1000);
      return;
    }
    setIndex(index + 1);
    setChosen(null);
    requestAnimationFrame(() => promptRef.current?.focus());
  }

  const correct = chosen === q.answer;
  return (
    <div className="quiz">
      <p className="step-indicator">
        Pergunta {index + 1} de {items.length}
      </p>
      <h2 ref={promptRef} tabIndex={-1} className="quiz__prompt">
        {q.prompt}
      </h2>
      <div className="quiz__visual">
        <Visual key={q.id} q={q} />
      </div>
      <div className="quiz__options" role="group" aria-label="Opções de resposta">
        {q.options.map((o) => {
          const state = !answered ? '' : o === q.answer ? 'option--correct' : o === chosen ? 'option--wrong' : 'option--dim';
          return (
            <button key={o} type="button" className={`option ${state}`} onClick={() => choose(o)} aria-disabled={answered} aria-pressed={chosen === o}>
              {o}
              {answered && o === q.answer && <span className="visually-hidden"> (resposta certa)</span>}
            </button>
          );
        })}
      </div>
      {answered && (
        <div ref={feedbackRef} tabIndex={-1} className={`feedback ${correct ? 'feedback--ok' : 'feedback--ko'}`} role="status">
          <p>
            <strong>{correct ? 'Certo!' : `Não é bem. A resposta é ${q.answer}.`}</strong>
          </p>
          <p>{q.explanation}</p>
          <button type="button" className="btn btn--primary" onClick={next}>
            {index + 1 >= items.length ? 'Ver resultado' : 'Seguinte'}
          </button>
        </div>
      )}
    </div>
  );
}
