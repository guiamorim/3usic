// Lesson progression. Prerequisites are recommendations, not locks: every lesson stays open,
// but the app recommends the next lesson whose prerequisites are complete.
import { LESSONS, MODULES, type Lesson } from '../content/curriculum';
import type { Experience } from '../storage/schema';

/** Where the recommended path starts for each experience level. Earlier lessons become optional. */
export const START_MODULE: Record<Experience, string> = {
  none: 'm1',
  some: 'm3',
  intermediate: 'm6',
};

function moduleIndex(moduleId: string): number {
  return MODULES.findIndex((m) => m.id === moduleId);
}

/** Lessons below the user's starting module count as known for prerequisite purposes. */
export function isOptionalForLevel(lesson: Lesson, experience: Experience): boolean {
  return moduleIndex(lesson.moduleId) < moduleIndex(START_MODULE[experience]);
}

export function prerequisitesMet(lesson: Lesson, completed: ReadonlySet<string>, experience: Experience): boolean {
  return lesson.prerequisites.every((id) => {
    if (completed.has(id)) return true;
    const pre = LESSONS.find((l) => l.id === id);
    return pre ? isOptionalForLevel(pre, experience) : true;
  });
}

export function recommendedLesson(completed: ReadonlySet<string>, experience: Experience): Lesson | null {
  const candidates = LESSONS.filter((l) => !completed.has(l.id) && !isOptionalForLevel(l, experience));
  return candidates.find((l) => prerequisitesMet(l, completed, experience)) ?? candidates[0] ?? null;
}

export type LessonStatus = 'concluida' | 'recomendada' | 'disponivel' | 'falta-base' | 'opcional';

export function lessonStatus(lesson: Lesson, completed: ReadonlySet<string>, experience: Experience): LessonStatus {
  if (completed.has(lesson.id)) return 'concluida';
  if (recommendedLesson(completed, experience)?.id === lesson.id) return 'recomendada';
  if (isOptionalForLevel(lesson, experience)) return 'opcional';
  return prerequisitesMet(lesson, completed, experience) ? 'disponivel' : 'falta-base';
}

export function missingPrerequisites(lesson: Lesson, completed: ReadonlySet<string>, experience: Experience): Lesson[] {
  return lesson.prerequisites
    .map((id) => LESSONS.find((l) => l.id === id))
    .filter((l): l is Lesson => !!l && !completed.has(l.id) && !isOptionalForLevel(l, experience));
}

export function nextLessonAfter(lessonId: string): Lesson | null {
  const idx = LESSONS.findIndex((l) => l.id === lessonId);
  return idx >= 0 ? (LESSONS[idx + 1] ?? null) : null;
}

export function moduleProgress(moduleId: string, completed: ReadonlySet<string>): { done: number; total: number } {
  const lessons = LESSONS.filter((l) => l.moduleId === moduleId);
  return { done: lessons.filter((l) => completed.has(l.id)).length, total: lessons.length };
}

export function overallProgress(completed: ReadonlySet<string>): number {
  const known = LESSONS.filter((l) => completed.has(l.id)).length;
  return LESSONS.length ? known / LESSONS.length : 0;
}
