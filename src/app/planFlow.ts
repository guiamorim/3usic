import { useSyncExternalStore } from 'react';

// The plan step the user opened from «Início». Kept per tab (sessionStorage) so it survives
// navigating inside the activity (lesson → exercise) and reloads, but not a new session.
const KEY = 'braco.planStep';
const listeners = new Set<() => void>();

function read(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return memory;
  }
}

let memory: string | null = null;

export function setPlanStep(id: string | null): void {
  memory = id;
  try {
    if (id) sessionStorage.setItem(KEY, id);
    else sessionStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the in-memory value is enough for this page load.
  }
  listeners.forEach((l) => l());
}

export function usePlanStep(): string | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => null,
  );
}
