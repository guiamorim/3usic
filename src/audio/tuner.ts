import { nearestString, type StringMatch } from '../domain/guitar';
import { frequencyToNote, type NoteReading } from '../domain/notes';
import { acquireMicSession, audioContextCtor, releaseMicSession } from './context';
import { detectPitch, PitchFollower, rms } from './pitch';

export type TunerError = 'unsupported' | 'insecure' | 'denied' | 'no-mic' | 'busy' | 'unknown';

export interface TunerReading {
  frequency: number;
  note: NoteReading;
  string: StringMatch;
  clarity: number;
}

export type TunerHint = 'silence' | 'noisy' | 'no-input' | null;

export type TunerStatus =
  | { state: 'idle' }
  | { state: 'starting' }
  | {
      state: 'listening';
      /** Input level 0..1 (RMS scaled), to show that the microphone hears something. */
      level: number;
      reading: TunerReading | null;
      /** True when `reading` is the last good one, kept briefly after the note faded. */
      held: boolean;
      hint: TunerHint;
    }
  | { state: 'error'; error: TunerError };

export function tunerSupport(): TunerError | null {
  if (typeof window === 'undefined') return 'unsupported';
  if (!window.isSecureContext) return 'insecure';
  if (!navigator.mediaDevices?.getUserMedia || !audioContextCtor()) return 'unsupported';
  return null;
}

function mapError(err: unknown): TunerError {
  const name = err instanceof DOMException || err instanceof Error ? err.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'no-mic';
  if (name === 'NotReadableError' || name === 'AbortError') return 'busy';
  return 'unknown';
}

const MIN_SILENCE_RMS = 0.0015;
const NOISY_AFTER_MS = 1500;
const HOLD_MS = 1200;
const NO_INPUT_AFTER_MS = 2500;
const ANALYSIS_INTERVAL_MS = 30;

/**
 * Microphone tuner. Audio is analysed in memory frame by frame and never stored or sent anywhere.
 * The microphone is released on stop() — callers must stop when the tuner is not visible.
 */
export class Tuner {
  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private raf = 0;
  private stopped = true;
  private readonly follower = new PitchFollower(5, 0.3, 60);
  private unpitchedSince: number | null = null;
  private last: { reading: TunerReading; at: number } | null = null;
  private noiseFloor = MIN_SILENCE_RMS;
  private session = false;

  constructor(
    private readonly onStatus: (s: TunerStatus) => void,
    private a4 = 440,
  ) {}

  setA4(a4: number): void {
    this.a4 = a4;
  }

  /** Call directly from the click handler: iOS only lets audio start inside the user gesture. */
  async start(): Promise<void> {
    const unsupported = tunerSupport();
    if (unsupported) {
      this.onStatus({ state: 'error', error: unsupported });
      return;
    }
    this.stopped = false;
    this.onStatus({ state: 'starting' });
    acquireMicSession();
    this.session = true;
    // Create and resume the context before the first await, while the gesture is still active.
    const Ctor = audioContextCtor() as typeof AudioContext;
    const ctx = new Ctor();
    this.ctx = ctx;
    const resumed = ctx.resume().catch(() => undefined);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        video: false,
      });
      if (this.stopped) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      this.stream = stream;
      await resumed;
      if (ctx.state !== 'running') await ctx.resume();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      source.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      this.follower.reset();
      this.last = null;
      this.noiseFloor = MIN_SILENCE_RMS;
      const startedAt = performance.now();
      let heardAnything = false;
      let lastRun = 0;

      const tick = () => {
        if (this.stopped) return;
        this.raf = requestAnimationFrame(tick);
        const now = performance.now();
        if (now - lastRun < ANALYSIS_INTERVAL_MS) return;
        lastRun = now;
        // Safari can suspend the context (call, Siri, route change): try to recover.
        if (ctx.state !== 'running') void ctx.resume().catch(() => undefined);
        analyser.getFloatTimeDomainData(buf);
        const level = rms(buf);
        if (level > 0) heardAnything = true;
        const shown = Math.min(1, Math.sqrt(level / 0.2));
        if (!heardAnything && now - startedAt > NO_INPUT_AFTER_MS) {
          this.onStatus({ state: 'listening', level: 0, reading: null, held: false, hint: 'no-input' });
          return;
        }
        // Slowly track the background level so quiet phone microphones still count as "playing".
        this.noiseFloor = Math.max(MIN_SILENCE_RMS, Math.min(this.noiseFloor * 1.002, level * 0.2 + this.noiseFloor * 0.8));
        const silent = level < this.noiseFloor * 2;
        const pitch = silent ? null : detectPitch(buf, { sampleRate: ctx.sampleRate, minFrequency: 60, maxFrequency: 1000 });
        if (pitch && pitch.clarity > 0.65) {
          this.unpitchedSince = null;
          const freq = this.follower.push(pitch.frequency);
          const reading = { frequency: freq, note: frequencyToNote(freq, this.a4), string: nearestString(freq, this.a4), clarity: pitch.clarity };
          this.last = { reading, at: now };
          this.onStatus({ state: 'listening', level: shown, hint: null, reading, held: false });
          return;
        }
        if (silent) {
          this.unpitchedSince = null;
          this.follower.reset();
        } else {
          this.unpitchedSince ??= now;
        }
        const noisy = this.unpitchedSince !== null && now - this.unpitchedSince > NOISY_AFTER_MS;
        const held = this.last && now - this.last.at < HOLD_MS ? this.last.reading : null;
        this.onStatus({ state: 'listening', level: shown, reading: held, held: held !== null, hint: noisy ? 'noisy' : silent ? 'silence' : null });
      };
      this.raf = requestAnimationFrame(tick);
    } catch (err) {
      this.release();
      this.onStatus({ state: 'error', error: mapError(err) });
    }
  }

  private release(): void {
    cancelAnimationFrame(this.raf);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (this.ctx && this.ctx.state !== 'closed') void this.ctx.close();
    this.ctx = null;
    if (this.session) releaseMicSession();
    this.session = false;
  }

  stop(): void {
    this.stopped = true;
    this.release();
    this.onStatus({ state: 'idle' });
  }

  get active(): boolean {
    return !this.stopped;
  }
}
