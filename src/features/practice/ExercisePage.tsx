import { useMemo, useState } from 'react';
import { useStore } from '../../app/store';
import { Page } from '../../components/Page';
import { exerciseById, generateReview, seededRng, SKILL_LABEL } from '../../domain/exercises';
import { dueSkills, mastery, MASTERY_LABEL, PASS_SCORE } from '../../domain/srs';
import { localDay } from '../../domain/dates';
import { QuizRunner, type QuizItem, type SkillResult } from './QuizRunner';
import { ChordChangesPage } from './ChordChangesPage';
import { exerciseBySkill } from '../../domain/exercises';

function Summary({ results, onRetry }: { results: SkillResult[]; onRetry(): void }) {
  const { data } = useStore();
  const correct = results.reduce((s, r) => s + r.correct, 0);
  const total = results.reduce((s, r) => s + r.total, 0);
  const score = total ? correct / total : 0;
  return (
    <section className="card summary" aria-live="polite">
      <h2>
        Resultado: {correct} de {total} ({Math.round(score * 100)}%)
      </h2>
      <p>
        {score >= PASS_SCORE
          ? 'Muito bem. Esta competência volta para revisão daqui a uns dias: o domínio confirma-se quando os bons resultados se repetem em dias diferentes.'
          : score >= 0.6
            ? 'Estás no caminho certo. Revê as explicações e repete amanhã.'
            : 'Ainda está difícil — é normal. Revê a lição correspondente e tenta de novo com calma. Voltas a ver este exercício amanhã.'}
      </p>
      <ul>
        {results.map((r) => {
          const skill = data.skills.find((s) => s.skillId === r.skillId);
          return (
            <li key={r.skillId}>
              {SKILL_LABEL[r.skillId] ?? r.skillId}: {r.correct}/{r.total} · nível {MASTERY_LABEL[mastery(skill)].toLowerCase()}
              {skill && ` · próxima revisão ${skill.dueDay.split('-').reverse().join('/')}`}
            </li>
          );
        })}
      </ul>
      <div className="button-row">
        <button type="button" className="btn btn--secondary" onClick={onRetry}>
          Repetir
        </button>
        <a className="btn btn--primary" href="#/praticar">
          Voltar aos exercícios
        </a>
      </div>
    </section>
  );
}

function QuizSession({ title, subtitle, makeItems }: { title: string; subtitle: string; makeItems(seed: number): QuizItem[] }) {
  const { recordExercise } = useStore();
  const [seed, setSeed] = useState(() => Date.now() % 2147483647);
  const items = useMemo(() => makeItems(seed), [makeItems, seed]);
  const [results, setResults] = useState<SkillResult[] | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);

  async function finish(res: SkillResult[], durationSec: number) {
    const total = res.reduce((s, r) => s + r.total, 0) || 1;
    let ok = true;
    for (const r of res) {
      ok = (await recordExercise({ ...r, durationSec: (durationSec * r.total) / total, label: SKILL_LABEL[r.skillId] ?? title })) && ok;
    }
    setSaveFailed(!ok);
    setResults(res);
  }

  return (
    <Page title={title} subtitle={subtitle} back={{ href: '#/praticar', label: 'Praticar' }}>
      {results ? (
        <>
          {saveFailed && <p className="notice notice--error">O resultado não foi guardado.</p>}
          <Summary
            results={results}
            onRetry={() => {
              setResults(null);
              setSeed((s) => s + 1);
            }}
          />
        </>
      ) : items.length === 0 ? (
        <p>Não há perguntas disponíveis.</p>
      ) : (
        <QuizRunner key={seed} items={items} onFinish={(r, d) => void finish(r, d)} />
      )}
    </Page>
  );
}

export function ExercisePage({ exerciseId }: { exerciseId: string }) {
  const { data } = useStore();
  const def = exerciseById(exerciseId);
  const dueIds = useMemo(
    () =>
      dueSkills(data.skills, localDay())
        .map((s) => exerciseBySkill(s.skillId)?.id)
        .filter((x): x is string => !!x),
    // Fix the review set when the page opens; results recorded during the session must not reshuffle it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const makeQuiz = useMemo(
    () => (seed: number) => (def?.generate ? def.generate(seededRng(seed), def.questionCount).map((question) => ({ question, skillId: def.skillId })) : []),
    [def],
  );
  const makeReview = useMemo(() => (seed: number) => generateReview(seededRng(seed), dueIds, Math.min(12, Math.max(6, dueIds.length * 3))), [dueIds]);

  if (exerciseId === 'revisao') {
    if (dueIds.length === 0) {
      return (
        <Page title="Revisão" back={{ href: '#/praticar', label: 'Praticar' }}>
          <p>Não tens revisões pendentes hoje. Escolhe um exercício novo ou volta amanhã.</p>
        </Page>
      );
    }
    return <QuizSession title="Revisão" subtitle="Perguntas intercaladas das competências que estão na altura de rever." makeItems={makeReview} />;
  }
  if (!def) {
    return (
      <Page title="Exercício não encontrado" back={{ href: '#/praticar', label: 'Praticar' }}>
        <p>Este exercício não existe.</p>
      </Page>
    );
  }
  if (def.kind === 'chord-changes') return <ChordChangesPage />;
  return <QuizSession title={def.title} subtitle={def.description} makeItems={makeQuiz} />;
}
