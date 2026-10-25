import { useState, type FormEvent } from 'react';
import { EXPERIENCE_LABEL, GENRE_LABEL, GOAL_LABEL, INSTRUMENT_LABEL, SESSION_OPTIONS } from '../../content/labels';
import type { Experience, Genre, Goal, Instrument, Profile } from '../../storage/schema';

export type ProfileDraft = Omit<Profile, 'createdAt' | 'updatedAt'>;

const DEFAULT_DRAFT: ProfileDraft = {
  instrument: 'acoustic',
  experience: 'none',
  goal: 'chords-songs',
  genres: [],
  sessionMinutes: 15,
  daysPerWeek: 4,
  a4: 440,
};

interface Props {
  initial?: ProfileDraft;
  mode: 'wizard' | 'edit';
  onSubmit(draft: ProfileDraft): Promise<boolean>;
}

function entries<K extends string, V>(r: Record<K, V>): [K, V][] {
  return Object.entries(r) as [K, V][];
}

export function ProfileForm({ initial, mode, onSubmit }: Props) {
  const [draft, setDraft] = useState<ProfileDraft>(initial ?? DEFAULT_DRAFT);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const set = <K extends keyof ProfileDraft>(k: K, v: ProfileDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const steps = [
    <fieldset key="instrument" className="choice-group">
      <legend>Que instrumento vais tocar?</legend>
      {entries(INSTRUMENT_LABEL).map(([value, label]) => (
        <label key={value} className="choice">
          <input type="radio" name="instrument" value={value} checked={draft.instrument === value} onChange={() => set('instrument', value as Instrument)} />
          <span>{label}</span>
        </label>
      ))}
    </fieldset>,
    <fieldset key="experience" className="choice-group">
      <legend>Qual é a tua experiência?</legend>
      {entries(EXPERIENCE_LABEL).map(([value, { title, hint }]) => (
        <label key={value} className="choice">
          <input type="radio" name="experience" value={value} checked={draft.experience === value} onChange={() => set('experience', value as Experience)} />
          <span>
            {title}
            <small>{hint}</small>
          </span>
        </label>
      ))}
    </fieldset>,
    <div key="goal" className="stack">
      <fieldset className="choice-group">
        <legend>Qual é o teu objetivo principal?</legend>
        {entries(GOAL_LABEL).map(([value, label]) => (
          <label key={value} className="choice">
            <input type="radio" name="goal" value={value} checked={draft.goal === value} onChange={() => set('goal', value as Goal)} />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
      <fieldset className="choice-group choice-group--inline">
        <legend>Géneros preferidos (opcional)</legend>
        {entries(GENRE_LABEL).map(([value, label]) => (
          <label key={value} className="chip">
            <input
              type="checkbox"
              checked={draft.genres.includes(value as Genre)}
              onChange={(e) => set('genres', e.target.checked ? [...draft.genres, value as Genre] : draft.genres.filter((g) => g !== value))}
            />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
    </div>,
    <div key="time" className="stack">
      <fieldset className="choice-group choice-group--inline">
        <legend>Quanto tempo tens por sessão?</legend>
        {SESSION_OPTIONS.map((m) => (
          <label key={m} className="chip">
            <input type="radio" name="session" checked={draft.sessionMinutes === m} onChange={() => set('sessionMinutes', m)} />
            <span>{m} min</span>
          </label>
        ))}
      </fieldset>
      <fieldset className="choice-group choice-group--inline">
        <legend>Quantos dias por semana queres praticar?</legend>
        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
          <label key={d} className="chip">
            <input type="radio" name="days" checked={draft.daysPerWeek === d} onChange={() => set('daysPerWeek', d)} />
            <span>{d}</span>
          </label>
        ))}
      </fieldset>
      <p className="hint">Sessões curtas e frequentes resultam melhor do que sessões longas e raras. Faltar a um dia não te penaliza.</p>
    </div>,
  ];

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (mode === 'wizard' && step < steps.length - 1) {
      setStep(step + 1);
      return;
    }
    setSaving(true);
    const ok = await onSubmit(draft);
    setSaving(false);
    setMessage(ok ? 'Preferências guardadas.' : 'Não foi possível guardar. Tenta de novo.');
  }

  return (
    <form onSubmit={submit} className="profile-form" noValidate>
      {mode === 'wizard' ? (
        <>
          <p className="step-indicator" aria-live="polite">
            Passo {step + 1} de {steps.length}
          </p>
          {steps[step]}
        </>
      ) : (
        <>
          {steps}
          <label className="field">
            <span>Referência de afinação (Lá = Hz)</span>
            <input type="number" min={415} max={466} value={draft.a4} onChange={(e) => set('a4', Math.min(466, Math.max(415, Number(e.target.value) || 440)))} />
          </label>
        </>
      )}
      <div className="button-row">
        {mode === 'wizard' && step > 0 && (
          <button type="button" className="btn btn--ghost" onClick={() => setStep(step - 1)}>
            Voltar
          </button>
        )}
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {mode === 'wizard' ? (step < steps.length - 1 ? 'Seguinte' : 'Começar a praticar') : 'Guardar alterações'}
        </button>
      </div>
      {message && mode === 'edit' && (
        <p role="status" className="hint">
          {message}
        </p>
      )}
    </form>
  );
}
