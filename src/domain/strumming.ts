// Pure helpers for the strumming trainer and the play-along clock.
import type { StrumPattern } from '../content/strums';

/** Count syllables shown under each slot: «1 e 2 e», «1 e a 2 e a», «1 e & a». */
export function countLabels(p: Pick<StrumPattern, 'beats' | 'subdivision'>): string[] {
  const sub = p.subdivision === 2 ? ['e'] : p.subdivision === 3 ? ['e', 'a'] : ['e', '&', 'a'];
  return Array.from({ length: p.beats }, (_, b) => [String(b + 1), ...sub]).flat();
}

export interface SlotState {
  /** Audio-clock time of the next slot to schedule. */
  nextTime: number;
  /** Index of that slot since start (monotonic). */
  slot: number;
}

/**
 * Slots whose start falls before `now + lookahead`, plus the state to continue from.
 * If the clock fell far behind (tab in background), it skips ahead instead of firing a burst.
 */
export function collectSlots(state: SlotState, now: number, lookahead: number, slotDuration: number): { slots: { slot: number; time: number }[]; state: SlotState } {
  let { nextTime, slot } = state;
  if (nextTime < now - 0.2) {
    const skip = Math.ceil((now - nextTime) / slotDuration);
    nextTime += skip * slotDuration;
    slot += skip;
  }
  const slots: { slot: number; time: number }[] = [];
  while (nextTime < now + lookahead) {
    slots.push({ slot, time: nextTime });
    nextTime += slotDuration;
    slot++;
  }
  return { slots, state: { nextTime, slot } };
}

export function slotDuration(bpm: number, subdivision: number): number {
  return 60 / bpm / subdivision;
}
