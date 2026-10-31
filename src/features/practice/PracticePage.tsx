import type { ComponentType } from 'react';
import { useStore } from '../../app/store';
import { href } from '../../app/router';
import { Page } from '../../components/Page';
import { IconBook, IconGrid, IconHand, IconMusic, IconRepeat } from '../../components/Icons';
import { EXERCISES } from '../../domain/exercises';
import { dueSkills, mastery, MASTERY_LABEL, type Mastery } from '../../domain/srs';
import { localDay } from '../../domain/dates';
import { suggestPractice } from '../../domain/practiceSuggest';

const GROUPS: { title: string; Icon: ComponentType; ids: string[] }[] = [
  { title: 'Braço e notas', Icon: IconHand, ids: ['cordas', 'notas-1a-posicao', 'notas-graves'] },
  { title: 'Acordes', Icon: IconGrid, ids: ['acordes-abertos', 'acordes-setima', 'mudancas'] },
  { title: 'Ouvido, ritmo e teoria', Icon: IconMusic, ids: ['intervalos', 'ritmo', 'teoria-triades', 'teoria-tonalidades'] },
];
const STEP: Record<Mastery, number> = { novo: 0, 'a-aprender': 1, 'a-consolidar': 2, dominado: 3 };

function MasteryMeter({ level }: { level: Mastery }) {
  return (
    <span className="mastery-meter" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= STEP[level] ? 'mastery-meter__seg mastery-meter__seg--on' : 'mastery-meter__seg'} />
      ))}
    </span>
  );
}

export function PracticePage() {
  const { data } = useStore();
  const today = localDay();
  const due = dueSkills(data.skills, today);
  const suggestion = suggestPractice(EXERCISES, data.skills, today);
  const suggested = suggestion?.kind === 'exercise' ? EXERCISES.find((e) => e.id === suggestion.id) : null;
  const grouped = new Set(GROUPS.flatMap((g) => g.ids));
  const groups = [...GROUPS, { title: 'Outros', Icon: IconBook, ids: EXERCISES.filter((e) => !grouped.has(e.id)).map((e) => e.id) }].filter((g) => g.ids.length > 0);

  return (
    <Page title="Praticar" subtitle="Exercícios curtos com feedback imediato. O nível só sobe com bons resultados em dias diferentes.">
      <section className="card card--today" aria-labelledby="today-practice">
        <h2 id="today-practice">
          <span className="h-icon" aria-hidden="true">
            <IconRepeat />
          </span>
          Treino de hoje
        </h2>
        {suggestion?.kind === 'review' ? (
          <>
            <p>{due.length === 1 ? '1 competência para rever hoje.' : `${due.length} competências para rever hoje.`} Rever na altura certa ajuda a fixar a longo prazo.</p>
            <a className="btn btn--primary btn--large" href="#/praticar/revisao">
              Começar revisão
            </a>
          </>
        ) : suggested ? (
          <>
            <p>
              Sem revisões pendentes. Sugestão: <strong>{suggested.title}</strong>.
            </p>
            <a className="btn btn--primary btn--large" href={href('praticar', suggested.id)}>
              Começar: {suggested.title}
            </a>
          </>
        ) : (
          <p className="muted">Sem revisões pendentes e todos os exercícios dominados. Experimenta as mudanças de acordes ou uma música.</p>
        )}
      </section>

      {groups.map((g) => (
        <section key={g.title} className="exercise-group" aria-labelledby={`g-${g.title}`}>
          <h2 id={`g-${g.title}`} className="exercise-group__title">
            <span className="h-icon" aria-hidden="true">
              <g.Icon />
            </span>
            {g.title}
          </h2>
          <ul className="exercise-list">
            {g.ids.map((id) => {
              const e = EXERCISES.find((x) => x.id === id);
              if (!e) return null;
              const skill = data.skills.find((s) => s.skillId === e.skillId);
              const m = mastery(skill);
              const best = e.kind === 'chord-changes' ? Math.max(0, ...data.chordChanges.map((c) => c.changes)) : null;
              return (
                <li key={e.id}>
                  <a className="exercise-row" href={href('praticar', e.id)}>
                    <span className="exercise-row__body">
                      <strong>{e.title}</strong>
                      <span className="exercise-row__desc">{e.description}</span>
                    </span>
                    <span className="exercise-row__meta">
                      {e.kind === 'quiz' ? (
                        <>
                          <MasteryMeter level={m} />
                          <span className={`mastery mastery--${m}`}>{MASTERY_LABEL[m]}</span>
                          {skill && <span className="muted"> · {Math.round(skill.lastScore * 100)}%</span>}
                          <span className="muted"> · {e.questionCount} perguntas</span>
                        </>
                      ) : best ? (
                        `Melhor: ${best} mudanças/min`
                      ) : (
                        'Ainda sem registos'
                      )}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </Page>
  );
}
