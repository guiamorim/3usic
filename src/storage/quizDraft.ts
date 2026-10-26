// A quiz left halfway (app closed, phone call, another tab) resumes where it stopped.
// Questions are generated from a seed, so the seed plus the answers given is enough.
// Kept in localStorage: transient, per-device convenience; dropped at the end of the day.
import * as z from 'zod/mini';

const PREFIX = 'braco.quiz.';

const DraftSchema = z.strictObject({
  seed: z.int(),
  day: z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/)),
  answers: z.array(z.boolean()).check(z.maxLength(100)),
  elapsedSec: z.number().check(z.minimum(0)),
});

export type QuizDraft = z.infer<typeof DraftSchema>;

export function loadDraft(key: string, today: string): QuizDraft | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = DraftSchema.safeParse(JSON.parse(raw));
    if (!parsed.success || parsed.data.day !== today || parsed.data.answers.length === 0) {
      localStorage.removeItem(PREFIX + key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export function saveDraft(key: string, draft: QuizDraft): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(draft));
  } catch {
    // Storage blocked or full: resuming is a convenience, the quiz still works.
  }
}

export function clearDraft(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // Nothing to clear.
  }
}
