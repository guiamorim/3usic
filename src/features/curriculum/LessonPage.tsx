import { useState } from 'react';
import { useStore } from '../../app/store';
import { href } from '../../app/router';
import { Page } from '../../components/Page';
import { DemoView } from '../../components/Demo';
import { lessonById, MODULES } from '../../content/curriculum';
import { exerciseById } from '../../domain/exercises';
import { missingPrerequisites, nextLessonAfter, recommendedLesson } from '../../domain/progression';
import { STATUS_LABEL } from './CurriculumPage';
import { lessonStatus } from '../../domain/progression';

const now = () => Date.now();

export function LessonPage({ lessonId }: { lessonId: string }) {
  const lesson = lessonById(lessonId);
  const { data, completedLessons, completeLesson, uncompleteLesson } = useStore();
  const experience = data.profile?.experience ?? 'none';
  const instrument = data.profile?.instrument ?? 'acoustic';
  // The page is keyed by lessonId in the router, so this state resets for each lesson.
  const [confirmed, setConfirmed] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [openedAt] = useState(now);

  if (!lesson) {
    return (
      <Page title="Lição não encontrada" back={{ href: '#/aprender', label: 'Aprender' }}>
        <p>Esta lição não existe. Volta à lista de lições.</p>
      </Page>
    );
  }

  const module = MODULES.find((m) => m.id === lesson.moduleId);
  const done = completedLessons.has(lesson.id);
  const missing = missingPrerequisites(lesson, completedLessons, experience);
  const exercise = lesson.practice.exerciseId ? exerciseById(lesson.practice.exerciseId) : undefined;
  const next = nextLessonAfter(lesson.id);
  const instrumentNote = lesson.instrumentNotes?.[instrument];

  async function markDone() {
    if (!lesson) return;
    const seconds = Math.min(3600, (now() - openedAt) / 1000);
    const ok = await completeLesson(lesson.id, seconds, lesson.title);
    setFeedback(ok ? 'Lição marcada como concluída. Lembra-te: concluir não é o mesmo que dominar — as revisões vão confirmar.' : 'Não foi possível guardar.');
  }

  const recommendedNext = done ? recommendedLesson(completedLessons, experience) : null;

  return (
    <Page
      title={lesson.title}
      back={{ href: '#/aprender', label: 'Aprender' }}
      subtitle={`Módulo ${module?.number} · ${lesson.minutes} min · ${STATUS_LABEL[lessonStatus(lesson, completedLessons, experience)]}`}
    >
      {missing.length > 0 && (
        <div className="notice notice--info" role="note">
          <strong>Antes desta lição, recomendamos:</strong>
          <ul>
            {missing.map((m) => (
              <li key={m.id}>
                <a href={href('aprender', m.id)}>{m.title}</a>
              </li>
            ))}
          </ul>
          Podes continuar mesmo assim.
        </div>
      )}

      <section className="lesson-section">
        <h2>Objetivo</h2>
        <p>{lesson.objective}</p>
      </section>

      <section className="lesson-section">
        <h2>Explicação</h2>
        {lesson.explanation.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        {instrumentNote && (
          <p className="notice notice--tip">
            <strong>No teu instrumento:</strong> {instrumentNote}
          </p>
        )}
      </section>

      <section className="lesson-section">
        <h2>Demonstração</h2>
        <DemoView demo={lesson.demo} />
      </section>

      <section className="lesson-section">
        <h2>Prática</h2>
        <ol className="steps">
          {lesson.practice.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
        <div className="button-row">
          {exercise && (
            <a className="btn btn--secondary" href={href('praticar', exercise.id)}>
              Exercício: {exercise.title}
            </a>
          )}
          {(lesson.practice.tool === 'metronome' || lesson.practice.bpm) && (
            <a className="btn btn--secondary" href={`#/metronomo?bpm=${lesson.practice.bpm ?? 60}`}>
              Metrónomo{lesson.practice.bpm ? ` (${lesson.practice.bpm} BPM)` : ''}
            </a>
          )}
          {lesson.practice.tool === 'tuner' && (
            <a className="btn btn--secondary" href="#/afinador">
              Abrir afinador
            </a>
          )}
        </div>
      </section>

      <section className="lesson-section">
        <h2>Erros comuns</h2>
        <ul>
          {lesson.mistakes.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </section>

      <section className="lesson-section card">
        <h2>Critério de conclusão</h2>
        {done ? (
          <>
            <p>✓ Concluíste esta lição.</p>
            <div className="button-row">
              {recommendedNext && (
                <a className="btn btn--primary" href={href('aprender', recommendedNext.id)}>
                  Próxima recomendada: {recommendedNext.title}
                </a>
              )}
              <button type="button" className="btn btn--ghost" onClick={() => void uncompleteLesson(lesson.id)}>
                Marcar como não concluída
              </button>
            </div>
          </>
        ) : (
          <>
            <label className="choice">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
              <span>{lesson.completion}</span>
            </label>
            <button type="button" className="btn btn--primary" disabled={!confirmed} onClick={() => void markDone()}>
              Concluir lição
            </button>
          </>
        )}
        {feedback && (
          <p role="status" className="hint">
            {feedback}
          </p>
        )}
        {!done && next && (
          <p className="muted">
            A seguir no currículo: <a href={href('aprender', next.id)}>{next.title}</a>
          </p>
        )}
      </section>
    </Page>
  );
}
