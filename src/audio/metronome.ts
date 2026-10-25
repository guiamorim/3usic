import { getOutputContext, outputNode } from './context';
import { collectBeats, type SchedulerState, type TimeSignature } from './metronomeScheduler';

export interface MetronomeConfig {
  bpm: number;
  signature: TimeSignature;
  accent: boolean;
  volume: number;
}

const LOOKAHEAD_S = 0.12;
const TIMER_MS = 25;

/**
 * Audio-clock metronome. Clicks are scheduled on the AudioContext timeline; the visual beat is
 * derived from the same timeline, so sound and light stay in sync even if rendering stutters.
 */
export class Metronome {
  private ctx: AudioContext | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private raf = 0;
  private state: SchedulerState = { nextBeatTime: 0, beatInBar: 0 };
  private queue: { time: number; beatInBar: number }[] = [];
  private startedAt = 0;

  constructor(
    private config: MetronomeConfig,
    private readonly onBeat: (beatInBar: number) => void,
  ) {}

  update(config: Partial<MetronomeConfig>): void {
    const sigChanged = config.signature && config.signature.label !== this.config.signature.label;
    this.config = { ...this.config, ...config };
    if (sigChanged) this.state = { ...this.state, beatInBar: 0 };
  }

  get running(): boolean {
    return this.timer !== null;
  }

  /** Seconds since start (audio clock), used to log practice time. */
  elapsed(): number {
    return this.ctx && this.running ? this.ctx.currentTime - this.startedAt : 0;
  }

  async start(): Promise<void> {
    if (this.running) return;
    const ctx = await getOutputContext();
    this.ctx = ctx;
    this.startedAt = ctx.currentTime;
    this.state = { nextBeatTime: ctx.currentTime + 0.06, beatInBar: 0 };
    this.queue = [];
    this.timer = setInterval(() => this.schedule(), TIMER_MS);
    this.schedule();
    const draw = () => {
      const now = this.ctx?.currentTime ?? 0;
      let last: { time: number; beatInBar: number } | undefined;
      while (this.queue.length && (this.queue[0] as { time: number }).time <= now) last = this.queue.shift();
      if (last) this.onBeat(last.beatInBar);
      this.raf = requestAnimationFrame(draw);
    };
    this.raf = requestAnimationFrame(draw);
  }

  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const { beats, state } = collectBeats(this.state, ctx.currentTime, LOOKAHEAD_S, this.config.bpm, this.config.signature, this.config.accent);
    this.state = state;
    for (const b of beats) {
      this.click(ctx, b.time, b.accent, b.beatInBar);
      this.queue.push({ time: b.time, beatInBar: b.beatInBar });
    }
  }

  private click(ctx: AudioContext, time: number, accent: boolean, beatInBar: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const secondary = this.config.signature.label === '6/8' && beatInBar === 3 && this.config.accent;
    // Square wave in the 1–2 kHz range: phone speakers reproduce it well and it cuts through a guitar.
    osc.type = 'square';
    osc.frequency.value = accent ? 1800 : secondary ? 1400 : 1200;
    const vol = Math.max(0.0002, 0.5 * this.config.volume * (accent ? 1 : 0.7));
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(vol, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.07);
    osc.connect(gain).connect(outputNode(ctx));
    osc.start(time);
    osc.stop(time + 0.08);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    cancelAnimationFrame(this.raf);
    this.queue = [];
  }
}
