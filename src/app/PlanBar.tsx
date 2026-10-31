import { useStore } from './store';
import { navigate, useRoute } from './router';
import { setPlanStep, usePlanStep } from './planFlow';
import { LOG_ON_CHECK, useTodayPlan } from './useTodayPlan';
import { nextBlock } from '../domain/plan';

/**
 * Guided mode: while doing a step opened from today's plan, a bar above the navigation says where
 * you are and takes you straight to the next step — no need to go back to «Início».
 */
export function PlanBar() {
  const step = usePlanStep();
  const { plan, done } = useTodayPlan();
  const { togglePlanBlock } = useStore();
  const segments = useRoute();
  const block = plan.find((b) => b.id === step);
  if (!block) return null;
  // Left the step to look at something else (a chord, a lesson): offer the way back.
  const here = `#/${segments.join('/')}`;
  const away = !(here === block.route.split('?')[0] || here.startsWith(`${block.route.split('?')[0]}/`));
  const index = plan.indexOf(block);
  const after = nextBlock(plan, new Set([...done, block.id]), block.id);

  async function finish() {
    if (!block) return;
    await togglePlanBlock(block.id, true, LOG_ON_CHECK.has(block.id) ? { minutes: block.minutes, label: block.title } : undefined);
    if (after) {
      setPlanStep(after.id);
      navigate(after.route);
    } else {
      setPlanStep(null);
      navigate('#/');
    }
  }

  return (
    <aside className="plan-bar" aria-label="Plano de hoje">
      <div className="plan-bar__info">
        <span className="plan-bar__step">
          Plano de hoje · passo {index + 1} de {plan.length}
        </span>
        <strong className="plan-bar__title">{block.title}</strong>
      </div>
      {away && (
        <a className="btn btn--secondary btn--small" href={block.route}>
          ← Voltar ao passo
        </a>
      )}
      <button type="button" className="btn btn--primary btn--small" onClick={() => void finish()}>
        {after ? 'Feito · seguinte →' : 'Feito · terminar'}
      </button>
      <button type="button" className="btn btn--ghost btn--small plan-bar__close" onClick={() => setPlanStep(null)} aria-label="Sair do modo guiado">
        ✕
      </button>
    </aside>
  );
}
