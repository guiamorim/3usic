import { useStore } from '../../app/store';
import { ProgressBar } from '../../components/Page';
import { useEffect, useRef } from 'react';
import { overallProgress } from '../../domain/progression';
import { dueSkills } from '../../domain/srs';
import { exerciseBySkill } from '../../domain/exercises';
import { practiceStats } from '../../domain/stats';
import { nextBlock, type BlockKind } from '../../domain/plan';
import { LESSONS, MODULES } from '../../content/curriculum';
import { INSTRUMENT_LABEL } from '../../content/labels';
import { href } from '../../app/router';
import { setPlanStep } from '../../app/planFlow';
import { LOG_ON_CHECK, useTodayPlan } from '../../app/useTodayPlan';

const BLOCK_ICON: Record<BlockKind, string> = {
  aquecimento: '🔥',
  revisao: '🔁',
  tecnica: '✋',
  novo: '📘',
  aplicacao: '🎵',
};

const SHORTCUTS = [
  { href: '#/afinador', icon: '🎚️', label: 'Afinador', tone: 'a' },
  { href: '#/metronomo', icon: '⏱️', label: 'Metrónomo', tone: 'b' },
  { href: '#/batidas', icon: '🥁', label: 'Batidas', tone: 'c' },
  { href: '#/musicas', icon: '🎸', label: 'Músicas', tone: 'd' },
  { href: '#/acordes', icon: '🖐️', label: 'Acordes', tone: 'e' },
  { href: '#/progresso', icon: '📈', label: 'Progresso', tone: 'f' },
] as const;

function greeting(): string {
  const h = new Date().getHours();
  return h < 6 ? 'Boa noite' : h < 13 ? 'Bom dia' : h < 20 ? 'Boa tarde' : 'Boa noite';
}

/** Circular progress for the hero: done / total plan steps. */
function Ring({ done, total }: { done: number; total: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const frac = total ? done / total : 0;
  return (
    <svg className="ring" viewBox="0 0 64 64" width="72" height="72" aria-hidden="true">
      <circle className="ring__track" cx="32" cy="32" r={r} />
      <circle className="ring__value" cx="32" cy="32" r={r} strokeDasharray={`${c * frac} ${c}`} transform="rotate(-90 32 32)" />
      <text x="32" y="37" textAnchor="middle" className="ring__text">
        {done}/{total}
      </text>
    </svg>
  );
}

export function DashboardPage() {
  const { data, completedLessons, togglePlanBlock } = useStore();
  const { plan, done, completion, recommended, target, today } = useTodayPlan();
  const h1 = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    document.title = 'Hoje · Braço';
    h1.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
    // Back on «Início»: guided mode ends.
    setPlanStep(null);
  }, []);
  const profile = data.profile;
  if (!profile) return null;
  const due = dueSkills(data.skills, today);
  const stats = practiceStats(data.practice, today);
  const module = recommended ? MODULES.find((m) => m.id === recommended.moduleId) : null;
  const next = nextBlock(plan, done);
  const allDone = plan.length > 0 && !next;
  const started = completion.done > 0;

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__text">
          <p className="hero__eyebrow">
            {greeting()} · {INSTRUMENT_LABEL[profile.instrument]}
          </p>
          <h1 id="hero-title" ref={h1} tabIndex={-1} className="hero__title">
            {allDone ? 'Plano de hoje concluído!' : 'Hoje'}
          </h1>
          <p className="hero__sub">
            {allDone
              ? `Fizeste ${stats.todayMinutes} min de prática. Amanhã há um plano novo.`
              : `${profile.sessionMinutes} min por sessão · ${stats.todayMinutes} min feitos hoje`}
          </p>
        </div>
        <Ring done={completion.done} total={completion.total} />
        {next && (
          <a className="btn btn--hero" href={next.route} onClick={() => setPlanStep(next.id)}>
            {started ? 'Continuar' : 'Começar'}: {next.title} →
          </a>
        )}
      </section>

      <details className="card how-to" open={completedLessons.size < 3 && !started}>
        <summary>
          <strong>Como funciona?</strong> <span className="muted">(3 passos)</span>
        </summary>
        <ol className="how-to__steps">
          <li>
            <span className="how-to__num">1</span>
            <span>
              Carrega em <strong>{started ? 'Continuar' : 'Começar'}</strong> (o botão acima). A app abre o primeiro passo do plano de hoje.
            </span>
          </li>
          <li>
            <span className="how-to__num">2</span>
            <span>
              Faz a atividade. Em baixo aparece uma barra <strong>«Plano de hoje»</strong>: quando acabares, carrega em <strong>«Feito · seguinte»</strong> e vais direto ao passo seguinte.
            </span>
          </li>
          <li>
            <span className="how-to__num">3</span>
            <span>No fim, voltas aqui com o plano concluído. Amanhã há um plano novo, adaptado ao que já fizeste.</span>
          </li>
        </ol>
        <p className="hint">Os separadores em baixo (Aprender, Praticar, Músicas, Batidas, Acordes) servem para explorar livremente quando quiseres.</p>
      </details>

      <section className="card" aria-labelledby="plan-title">
        <div className="card__head">
          <h2 id="plan-title">Plano de hoje</h2>
          <span className="badge">
            {completion.done}/{completion.total}
          </span>
        </div>
        <ol className="plan">
          {plan.map((b, i) => {
            const checked = done.has(b.id);
            return (
              <li key={b.id} className={`plan__item${checked ? ' plan__item--done' : ''}${next?.id === b.id ? ' plan__item--next' : ''}`}>
                <span className="plan__icon" aria-hidden="true">
                  {checked ? '✓' : BLOCK_ICON[b.id]}
                </span>
                <div className="plan__body">
                  <div className="plan__title">
                    <strong>
                      {i + 1}. {b.title}
                    </strong>{' '}
                    <span className="muted">· {b.minutes} min</span>
                  </div>
                  <p>{b.description}</p>
                  <div className="plan__actions">
                    <a className={next?.id === b.id ? 'btn btn--primary btn--small' : 'btn btn--secondary btn--small'} href={b.route} aria-label={`Abrir: ${b.title}`} onClick={() => setPlanStep(b.id)}>
                      Abrir
                    </a>
                    <label className="plan__check">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => void togglePlanBlock(b.id, e.target.checked, LOG_ON_CHECK.has(b.id) ? { minutes: b.minutes, label: b.title } : undefined)}
                      />
                      <span>Feito</span>
                      <span className="visually-hidden">Marcar «{b.title}» como feito</span>
                    </label>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="hint">O plano é refeito todos os dias. Se faltares, não acumulas trabalho em atraso.</p>
      </section>

      <nav className="tiles" aria-label="Atalhos">
        {SHORTCUTS.map((s) => (
          <a key={s.href} className={`tile tile--${s.tone}`} href={s.href}>
            <span className="tile__icon" aria-hidden="true">
              {s.icon}
            </span>
            <span className="tile__label">{s.label}</span>
          </a>
        ))}
      </nav>

      <section className="card card--accent" aria-labelledby="song-title">
        <div className="card__head">
          <h2 id="song-title">🎯 Música objetivo</h2>
          <a href="#/musicas">Ver músicas</a>
        </div>
        {target ? (
          <>
            <h3>{target.song.title}</h3>
            <p className="muted">{target.song.artist}</p>
            <ProgressBar value={target.songPlan.readiness} label="Acordes que já sabes" />
            <p>
              Já sabes {target.songPlan.chords.filter((c) => c.known).length} de {target.songPlan.chords.length} acordes. Hoje: {target.focus}
            </p>
            <div className="button-row">
              <a className="btn btn--primary" href={target.route}>
                Abrir plano da música
              </a>
              <a className="btn btn--secondary" href={`${target.route}/tocar`}>
                Tocar junto
              </a>
            </div>
          </>
        ) : (
          <>
            <p className="muted">Escolhe uma música que queiras tocar: o plano diário passa a incluí-la e mostra os acordes que te faltam.</p>
            <a className="btn btn--secondary" href="#/musicas">
              Escolher música
            </a>
          </>
        )}
      </section>

      {recommended ? (
        <section className="card" aria-labelledby="rec-title">
          <h2 id="rec-title">📘 Lição recomendada</h2>
          <p className="muted">
            Módulo {module?.number} · {module?.title}
          </p>
          <h3>{recommended.title}</h3>
          <p>{recommended.objective}</p>
          <a className="btn btn--primary" href={href('aprender', recommended.id)}>
            Começar lição ({recommended.minutes} min)
          </a>
        </section>
      ) : (
        <section className="card">
          <h2>Percurso inicial concluído</h2>
          <p>Concluíste todas as lições disponíveis. Continua com as revisões e os exercícios para consolidar.</p>
        </section>
      )}

      <section className="card" aria-labelledby="review-title">
        <h2 id="review-title">🔁 Para rever</h2>
        {due.length === 0 ? (
          <p className="muted">Nada pendente. As competências que praticares aparecem aqui quando for altura de as rever.</p>
        ) : (
          <>
            <ul className="tag-list">
              {due.map((s) => (
                <li key={s.skillId}>{exerciseBySkill(s.skillId)?.title ?? s.skillId}</li>
              ))}
            </ul>
            <a className="btn btn--primary" href="#/praticar/revisao">
              Fazer revisão
            </a>
          </>
        )}
      </section>

      <section className="card" aria-labelledby="progress-title">
        <div className="card__head">
          <h2 id="progress-title">📈 Progresso</h2>
          <a href="#/progresso">Ver detalhes</a>
        </div>
        <p>
          {completedLessons.size} de {LESSONS.length} lições concluídas
        </p>
        <ProgressBar value={overallProgress(completedLessons)} label="Lições concluídas" />
        <dl className="stats">
          <div>
            <dt>Hoje</dt>
            <dd>{stats.todayMinutes} min</dd>
          </div>
          <div>
            <dt>Esta semana</dt>
            <dd>{stats.weekMinutes} min</dd>
          </div>
          <div>
            <dt>Dias praticados</dt>
            <dd>
              {stats.daysPracticedThisWeek} de {profile.daysPerWeek}
            </dd>
          </div>
        </dl>
      </section>
    </>
  );
}
