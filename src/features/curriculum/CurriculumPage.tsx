import { useStore } from '../../app/store';
import { href } from '../../app/router';
import { Page } from '../../components/Page';
import { MODULES, lessonsOfModule } from '../../content/curriculum';
import { lessonStatus, moduleProgress, type LessonStatus } from '../../domain/progression';

export const STATUS_LABEL: Record<LessonStatus, string> = {
  concluida: 'Concluída',
  recomendada: 'Recomendada',
  disponivel: 'Disponível',
  'falta-base': 'Mais à frente',
  opcional: 'Opcional para o teu nível',
};

/** Small progress ring: lessons done in a module. */
function MiniRing({ done, total }: { done: number; total: number }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  const frac = total ? done / total : 0;
  return (
    <svg className={`mini-ring${done === total ? ' mini-ring--full' : ''}`} viewBox="0 0 40 40" width="44" height="44" role="img" aria-label={`${done} de ${total} lições concluídas`}>
      <circle className="mini-ring__track" cx="20" cy="20" r={r} />
      <circle className="mini-ring__value" cx="20" cy="20" r={r} strokeDasharray={`${c * frac} ${c}`} transform="rotate(-90 20 20)" />
      <text x="20" y="24" textAnchor="middle" className="mini-ring__text">
        {done}/{total}
      </text>
    </svg>
  );
}

export function CurriculumPage() {
  const { data, completedLessons } = useStore();
  const experience = data.profile?.experience ?? 'none';
  return (
    <Page
      title="Aprender"
      subtitle="Nove módulos, do primeiro contacto com o instrumento à primeira pestana. Todas as lições estão abertas; a ordem recomendada aparece destacada. No dia a dia, basta seguir o plano em «Início», que já inclui a lição certa."
    >
      <ol className="module-list">
        {MODULES.map((m) => {
          const p = moduleProgress(m.id, completedLessons);
          return (
            <li key={m.id} className="card module">
              <div className="card__head">
                <h2>
                  <span className="module__num">{m.number}</span> {m.title}
                </h2>
                <MiniRing done={p.done} total={p.total} />
              </div>
              <p className="muted">{m.summary}</p>
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
