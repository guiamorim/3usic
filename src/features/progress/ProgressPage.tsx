import { useStore } from '../../app/store';
import { Page, ProgressBar } from '../../components/Page';
import { LESSONS, MODULES, lessonsOfModule } from '../../content/curriculum';
import { EXERCISES } from '../../domain/exercises';
import { localDay } from '../../domain/dates';
import { moduleProgress, overallProgress } from '../../domain/progression';
import { mastery, MASTERY_LABEL } from '../../domain/srs';
import { practiceStats } from '../../domain/stats';
import { milestones, practiceDays, streak } from '../../domain/achievements';

const WEEKDAY = new Intl.DateTimeFormat('pt-PT', { weekday: 'short' });
const DATE = new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'short' });

export function ProgressPage() {
  const { data, completedLessons } = useStore();
  const today = localDay();
  const stats = practiceStats(data.practice, today);
  const maxDay = Math.max(1, ...stats.last7.map((d) => d.minutes));
  const marks = milestones(data, lessonsOfModule);
  const run = streak(practiceDays(data.practice), today);
  const recent = [...data.attempts].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10);

  return (
    <Page title="Progresso" back={{ href: '#/ferramentas', label: 'Mais' }}>
      <section className="card" aria-labelledby="marks-title">
        <h2 id="marks-title">Marcos</h2>
        <p>
          {marks.filter((m) => m.day).length} de {marks.length} alcançados · sequência atual: {run.days} {run.days === 1 ? 'dia' : 'dias'}
        </p>
        <ul className="milestones">
          {marks.map((m) => (
            <li key={m.id} className={`milestone${m.day ? ' milestone--done' : ''}`}>
              <strong>{m.title}</strong>
              <span>{m.description}</span>
              <span className="milestone__date">{m.day ? `Alcançado em ${DATE.format(new Date(`${m.day}T12:00:00`))}` : 'Por alcançar'}</span>
            </li>
          ))}
        </ul>
        <p className="hint">A sequência conta os dias com pelo menos 1 minuto de prática. Faltar um dia não a interrompe; faltar dois seguidos, sim.</p>
      </section>

      <section className="card">
        <h2>Lições</h2>
        <p>
          {completedLessons.size} de {LESSONS.length} concluídas
        </p>
        <ProgressBar value={overallProgress(completedLessons)} label="Lições concluídas" />
        <ul className="module-progress">
          {MODULES.map((m) => {
            const p = moduleProgress(m.id, completedLessons);
            return (
              <li key={m.id}>
                <span>
                  {m.number}. {m.title}
                </span>
                <span className="muted">
                  {p.done}/{p.total}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card">
        <h2>Tempo de prática</h2>
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
            <dt>Total</dt>
            <dd>{stats.totalMinutes} min</dd>
          </div>
        </dl>
        <table className="bars">
          <caption>Minutos por dia, últimos 7 dias</caption>
          <tbody>
            {stats.last7.map((d) => {
              const date = new Date(`${d.day}T12:00:00`);
              return (
                <tr key={d.day}>
                  <th scope="row">{WEEKDAY.format(date)}</th>
                  <td>{d.minutes > 0 && <div className="bars__bar" style={{ width: `${(d.minutes / maxDay) * 100}%` }} />}</td>
                  <td className="bars__value">{d.minutes} min</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="hint">O tempo é registado automaticamente nos exercícios, nas lições concluídas, no metrónomo (sessões com mais de 30 s) e nos blocos do plano marcados como feitos.</p>
      </section>

      <section className="card">
        <h2>Competências</h2>
        <p className="hint">«Dominado» exige bons resultados (≥ 80%) em pelo menos quatro dias diferentes, com intervalos crescentes. Um único resultado alto não chega.</p>
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Competência</th>
              <th scope="col">Nível</th>
              <th scope="col">Próxima revisão</th>
            </tr>
          </thead>
          <tbody>
            {EXERCISES.filter((e) => e.kind === 'quiz').map((e) => {
              const s = data.skills.find((x) => x.skillId === e.skillId);
              const m = mastery(s);
              return (
                <tr key={e.id}>
                  <td>{e.title}</td>
                  <td>
                    <span className={`mastery mastery--${m}`}>{MASTERY_LABEL[m]}</span>
                  </td>
                  <td>{s ? s.dueDay.split('-').reverse().join('/') : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2>Resultados recentes</h2>
        {recent.length === 0 ? (
          <p className="muted">Ainda não fizeste exercícios.</p>
        ) : (
          <ul>
            {recent.map((a) => (
              <li key={a.id}>
                {new Date(a.at).toLocaleDateString('pt-PT')} · {EXERCISES.find((e) => e.skillId === a.skillId)?.title ?? a.skillId}: {a.correct}/{a.total}
              </li>
            ))}
          </ul>
        )}
      </section>
    </Page>
  );
}
