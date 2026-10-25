import { useState } from 'react';
import { useStore } from '../../app/store';
import { hashQuery, href, navigate } from '../../app/router';
import { lessonById } from '../../content/curriculum';
import { nextLessonAfter, recommendedLesson } from '../../domain/progression';

/**
 * Shown at the end of an exercise so the learner can move on without going back to «Aprender».
 * When the exercise was opened from a lesson (`?licao=`), offers to complete it and open the next one.
 */
export function LessonContinue({ passed }: { passed: boolean }) {
  const { data, completedLessons, completeLesson } = useStore();
  const [error, setError] = useState(false);
  const from = lessonById(hashQuery().get('licao') ?? '');
  const experience = data.profile?.experience ?? 'none';

  if (!from) {
    const rec = recommendedLesson(completedLessons, experience);
    return rec ? (
      <a className="btn btn--secondary" href={href('aprender', rec.id)}>
        Próxima lição: {rec.title}
      </a>
    ) : null;
  }

  const done = completedLessons.has(from.id);
  const next = nextLessonAfter(from.id);

  async function completeAndGo() {
    if (!from) return;
    const ok = await completeLesson(from.id, 0, from.title);
    if (!ok) {
      setError(true);
      return;
    }
    const after = new Set(completedLessons).add(from.id);
    const target = recommendedLesson(after, experience) ?? next;
    navigate(target ? href('aprender', target.id) : '#/aprender');
  }

  return (
    <>
      {!done && passed && (
        <button type="button" className="btn btn--primary" onClick={() => void completeAndGo()}>
          Concluir «{from.title}» e passar à próxima
        </button>
      )}
      {(done || !passed) && next && (
        <a className={done ? 'btn btn--primary' : 'btn btn--secondary'} href={href('aprender', next.id)}>
          {done ? 'Próxima lição' : 'Avançar mesmo assim'}: {next.title}
        </a>
      )}
      <a className="btn btn--ghost" href={href('aprender', from.id)}>
        Voltar à lição
      </a>
      {error && (
        <p className="notice notice--error" role="alert">
          Não foi possível guardar a conclusão da lição.
        </p>
      )}
    </>
  );
}
