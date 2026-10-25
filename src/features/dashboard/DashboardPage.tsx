import { useMemo } from 'react';
import { useStore } from '../../app/store';
import { Page, ProgressBar } from '../../components/Page';
import { localDay } from '../../domain/dates';
import { buildDailyPlan, planCompletion, type BlockKind } from '../../domain/plan';
import { overallProgress, recommendedLesson } from '../../domain/progression';
import { dueSkills } from '../../domain/srs';
import { exerciseBySkill } from '../../domain/exercises';
import { practiceStats } from '../../domain/stats';
import { LESSONS, MODULES } from '../../content/curriculum';
import { INSTRUMENT_LABEL } from '../../content/labels';
import { href } from '../../app/router';
import { findSong, versionOf } from '../../domain/songLibrary';
import { buildSongPlan, knownChordIds, songFocus } from '../../domain/songPlan';

/** Blocks whose time isn't logged automatically by another activity. */
const LOG_ON_CHECK = new Set<BlockKind>(['aquecimento', 'aplicacao']);

export function DashboardPage() {
  const { data, completedLessons, togglePlanBlock, settings } = useStore();
  const profile = data.profile;
  const today = localDay();
  const recommended = profile ? recommendedLesson(completedLessons, profile.experience) : null;
  const target = useMemo(() => {
    const song = settings.targetSongId ? findSong(settings.targetSongId, data.songs) : undefined;
    if (!song) return null;
    const known = knownChordIds(completedLessons, settings.knownChords);
    const v = versionOf(song, settings.songVersion ?? 'simple');
    const songPlan = buildSongPlan({ sequence: v.sequence, known, tempo: v.sheet.meta.tempo });
    return { song, songPlan, focus: songFocus(songPlan), route: href('musicas', song.id) };
  }, [settings.targetSongId, settings.knownChords, settings.songVersion, data.songs, completedLessons]);
  const plan = useMemo(
    () =>
      profile
        ? buildDailyPlan({
            profile,
            today,
            completedLessons,
            recommended,
            skills: data.skills,
            targetSong: target ? { title: target.song.title, route: target.route, focus: target.focus } : undefined,
          })
        : [],
    [profile, today, completedLessons, recommended, data.skills, target],
  );
  if (!profile) return null;
  const planDay = data.planDays.find((p) => p.day === today);
  const done = new Set(planDay?.doneBlockIds ?? []);
  const completion = planCompletion(plan, planDay);
  const due = dueSkills(data.skills, today);
  const stats = practiceStats(data.practice, today);
  const module = recommended ? MODULES.find((m) => m.id === recommended.moduleId) : null;

  return (
    <Page title="Hoje" subtitle={`${INSTRUMENT_LABEL[profile.instrument]} · ${profile.sessionMinutes} min por sessão`}>
      <div className="quick-actions">
        <a className="btn btn--secondary" href="#/afinador">
          Afinador
        </a>
        <a className="btn btn--secondary" href="#/metronomo">
          Metrónomo
        </a>
      </div>

      <section className="card" aria-labelledby="plan-title">
        <div className="card__head">
          <h2 id="plan-title">Plano de hoje</h2>
          <span className="badge">
            {completion.done}/{completion.total}
          </span>
        </div>
        <ol className="plan">
          {plan.map((b) => {
            const checked = done.has(b.id);
            return (
              <li key={b.id} className={checked ? 'plan__item plan__item--done' : 'plan__item'}>
                <label className="plan__check">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => void togglePlanBlock(b.id, e.target.checked, LOG_ON_CHECK.has(b.id) ? { minutes: b.minutes, label: b.title } : undefined)}
                  />
                  <span className="visually-hidden">Marcar «{b.title}» como feito</span>
                </label>
                <div className="plan__body">
                  <div className="plan__title">
                    <strong>{b.title}</strong> <span className="muted">· {b.minutes} min</span>
                  </div>
                  <p>{b.description}</p>
                </div>
                <a className="btn btn--small" href={b.route} aria-label={`Abrir: ${b.title}`}>
                  Abrir
                </a>
              </li>
            );
          })}
        </ol>
        <p className="hint">O plano é refeito todos os dias. Se faltares, não acumulas trabalho em atraso.</p>
      </section>

      <section className="card" aria-labelledby="song-title">
        <div className="card__head">
          <h2 id="song-title">Música objetivo</h2>
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
            <a className="btn btn--primary" href={target.route}>
              Abrir plano da música
            </a>
          </>
        ) : (
          <p className="muted">Escolhe uma música que queiras tocar: o plano diário passa a incluí-la e mostra os acordes que te faltam.</p>
        )}
      </section>

      {recommended ? (
        <section className="card" aria-labelledby="rec-title">
          <h2 id="rec-title">Lição recomendada</h2>
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
        <h2 id="review-title">Para rever</h2>
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
          <h2 id="progress-title">Progresso</h2>
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
    </Page>
  );
}
