import { collectSlots, slotDuration, type SlotState } from '../domain/strumming';
import { getOutputContext } from './context';

const LOOKAHEAD_S = 0.12;
const TIMER_MS = 25;

/**
 * Audio-clock sequencer: calls `onSchedule` slightly ahead of time for each slot (to place sounds
 * on the audio timeline) and `onVisual` when the slot actually sounds (for the on-screen cursor).
 */
export class SlotClock {
  private ctx: AudioContext | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private raf = 0;
  private state: SlotState = { nextTime: 0, slot: 0 };
  private queue: { slot: number; time: number }[] = [];
  private startedAt = 0;

  constructor(
    private bpm: number,
    private readonly subdivision: number,
    private readonly onSchedule: (slot: number, time: number, ctx: AudioContext) => void,
    private readonly onVisual: (slot: number, ctx: AudioContext) => void,
  ) {}

  get running(): boolean {
    return this.timer !== null;
  }

  setBpm(bpm: number): void {
    this.bpm = bpm;
  }

  /** Seconds since start on the audio clock. */
  elapsed(): number {
    return this.ctx && this.running ? this.ctx.currentTime - this.startedAt : 0;
  }

  /** Call from a click handler (iOS needs the gesture to start audio). */
  async start(startDelay = 0.15): Promise<void> {
    if (this.running) return;
    const ctx = await getOutputContext();
    this.ctx = ctx;
    this.startedAt = ctx.currentTime;
    this.state = { nextTime: ctx.currentTime + startDelay, slot: 0 };
    this.queue = [];
    this.timer = setInterval(() => this.schedule(), TIMER_MS);
    this.schedule();
    const draw = () => {
      const c = this.ctx;
      if (!c) return;
      let last: { slot: number; time: number } | undefined;
      while (this.queue.length && (this.queue[0]?.time ?? Infinity) <= c.currentTime) last = this.queue.shift();
      if (last) this.onVisual(last.slot, c);
      this.raf = requestAnimationFrame(draw);
    };
    this.raf = requestAnimationFrame(draw);
  }

  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const { slots, state } = collectSlots(this.state, ctx.currentTime, LOOKAHEAD_S, slotDuration(this.bpm, this.subdivision));
    this.state = state;
    for (const s of slots) {
      this.onSchedule(s.slot, s.time, ctx);
      this.queue.push(s);
    }
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    cancelAnimationFrame(this.raf);
    this.queue = [];
  }
}
