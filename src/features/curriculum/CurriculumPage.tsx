import { useStore } from '../../app/store';
import { href } from '../../app/router';
import { Page, ProgressBar } from '../../components/Page';
import { MODULES, lessonsOfModule } from '../../content/curriculum';
import { lessonStatus, moduleProgress, type LessonStatus } from '../../domain/progression';

export const STATUS_LABEL: Record<LessonStatus, string> = {
  concluida: 'Concluída',
  recomendada: 'Recomendada',
  disponivel: 'Disponível',
  'falta-base': 'Rever bases primeiro',
  opcional: 'Opcional para o teu nível',
};

export function CurriculumPage() {
  const { data, completedLessons } = useStore();
  const experience = data.profile?.experience ?? 'none';
  return (
    <Page title="Aprender" subtitle="Nove módulos, do primeiro contacto com o instrumento à primeira pestana. Todas as lições estão abertas; a ordem recomendada aparece destacada. No dia a dia, basta seguir o plano em «Início», que já inclui a lição certa.">
      <ol className="module-list">
        {MODULES.map((m) => {
          const p = moduleProgress(m.id, completedLessons);
          return (
            <li key={m.id} className="card module">
              <div className="card__head">
                <h2>
                  <span className="module__num">{m.number}</span> {m.title}
                </h2>
                <span className="badge">
                  {p.done}/{p.total}
                </span>
              </div>
              <p className="muted">{m.summary}</p>
              <ProgressBar value={p.done / p.total} label={`Progresso do módulo ${m.number}`} />
              <ul className="lesson-list">
                {lessonsOfModule(m.id).map((l) => {
                  const status = lessonStatus(l, completedLessons, experience);
                  return (
                    <li key={l.id}>
                      <a href={href('aprender', l.id)} className={`lesson-link lesson-link--${status}`}>
                        <span className="lesson-link__status" aria-hidden="true">
                          {status === 'concluida' ? '✓' : status === 'recomendada' ? '→' : '•'}
                        </span>
                        <span className="lesson-link__title">{l.title}</span>
                        <span className="lesson-link__meta">
                          {STATUS_LABEL[status]} · {l.minutes} min
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>
    </Page>
  );
}
