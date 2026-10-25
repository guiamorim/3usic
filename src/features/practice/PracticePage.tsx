import { useStore } from '../../app/store';
import { href } from '../../app/router';
import { Page } from '../../components/Page';
import { EXERCISES } from '../../domain/exercises';
import { dueSkills, mastery, MASTERY_LABEL } from '../../domain/srs';
import { localDay } from '../../domain/dates';

export function PracticePage() {
  const { data } = useStore();
  const due = dueSkills(data.skills, localDay());
  return (
    <Page title="Praticar" subtitle="Exercícios curtos com feedback imediato. O nível de domínio só sobe com bons resultados em dias diferentes.">
      <section className="card">
        <h2>Revisão espaçada</h2>
        {due.length > 0 ? (
          <>
            <p>
              {due.length} competência(s) para rever hoje. Rever na altura certa ajuda a fixar a longo prazo.
            </p>
            <a className="btn btn--primary" href="#/praticar/revisao">
              Começar revisão
            </a>
          </>
        ) : (
          <p className="muted">Sem revisões pendentes hoje.</p>
        )}
      </section>
      <ul className="exercise-grid">
        {EXERCISES.map((e) => {
          const skill = data.skills.find((s) => s.skillId === e.skillId);
          const m = mastery(skill);
          const best = e.kind === 'chord-changes' ? Math.max(0, ...data.chordChanges.map((c) => c.changes)) : null;
          return (
            <li key={e.id} className="card exercise-card">
              <h2>{e.title}</h2>
              <p>{e.description}</p>
              <p className="muted">
                {e.kind === 'quiz' ? (
                  <>
                    Nível: <span className={`mastery mastery--${m}`}>{MASTERY_LABEL[m]}</span>
                    {skill && ` · último resultado ${Math.round(skill.lastScore * 100)}%`}
                  </>
                ) : best ? (
                  `Melhor resultado: ${best} mudanças/min`
                ) : (
                  'Ainda sem registos'
                )}
              </p>
              <a className="btn btn--secondary" href={href('praticar', e.id)}>
                {e.kind === 'quiz' ? `Começar (${e.questionCount} perguntas)` : 'Começar'}
              </a>
            </li>
          );
        })}
      </ul>
    </Page>
  );
}
