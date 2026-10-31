// Where the user came from, so «← voltar» returns to the exact screen and scroll position
// (lesson → exercise → back to the lesson, song → chord changes → back to the song…).
// Kept per tab in sessionStorage: survives reloads, not a new session.

export interface TrailEntry {
  hash: string;
  /** Page title without the app name, used as the back link label. */
  title: string;
  y: number;
}

const KEY = 'braco.trail';
const MAX = 30;
const APP_SUFFIX = / · .+$/;

let memory: TrailEntry[] = [];
let restoreY: { hash: string; y: number } | null = null;

function read(): TrailEntry[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return memory;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is TrailEntry =>
        typeof e === 'object' && e !== null && typeof (e as TrailEntry).hash === 'string' && typeof (e as TrailEntry).title === 'string' && typeof (e as TrailEntry).y === 'number',
    );
  } catch {
    return memory;
  }
}

function write(trail: TrailEntry[]): void {
  memory = trail;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(trail));
  } catch {
    // Storage blocked: the in-memory trail is enough for this page load.
  }
}

/** Normalises '', '#', '#/' to '#/'. */
export function normHash(hash: string): string {
  return !hash || hash === '#' ? '#/' : hash;
}

/**
 * Pure step: given the trail, the page being left (with its title and scroll) and the target,
 * returns the new trail and the scroll to restore (when going back to the previous entry).
 */
export function step(trail: readonly TrailEntry[], from: TrailEntry, to: string): { trail: TrailEntry[]; restore: number | null } {
  const top = trail[trail.length - 1];
  if (top && top.hash === to) return { trail: trail.slice(0, -1), restore: top.y };
  // Going to a screen already in the trail (e.g. a tab): cut back to it, no restore.
  const at = trail.findIndex((e) => e.hash === to);
  if (at >= 0) return { trail: trail.slice(0, at), restore: null };
  if (from.hash === to) return { trail: [...trail], restore: null };
  return { trail: [...trail, from].slice(-MAX), restore: null };
}

/** Call once at startup: records every hash navigation. */
export function startTrail(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('hashchange', (ev) => {
    const to = normHash(window.location.hash);
    // oldURL includes replaceState updates (e.g. a filter kept in the query), unlike a cached hash.
    const current = normHash(new URL(ev.oldURL).hash);
    // At this point the old page is still rendered: its title and scroll are still valid.
    const from = { hash: current, title: document.title.replace(APP_SUFFIX, ''), y: Math.round(window.scrollY) };
    const r = step(read(), from, to);
    write(r.trail);
    restoreY = r.restore !== null ? { hash: to, y: r.restore } : null;
  });
}

/** Scroll position to restore for this screen, or null to start at the top (reset on the next navigation). */
export function takeRestore(hash = normHash(window.location.hash)): number | null {
  return restoreY && restoreY.hash === hash ? restoreY.y : null;
}

/** Back target: the screen the user came from, when there is one. */
export function previousEntry(): TrailEntry | null {
  const t = read();
  return t[t.length - 1] ?? null;
}
