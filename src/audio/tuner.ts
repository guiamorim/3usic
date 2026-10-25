import { nearestString, type StringMatch } from '../domain/guitar';
import { frequencyToNote, type NoteReading } from '../domain/notes';
import { audioContextCtor } from './context';
import { detectPitch, PitchSmoother, rms } from './pitch';

export type TunerError = 'unsupported' | 'insecure' | 'denied' | 'no-mic' | 'busy' | 'unknown';

export interface TunerReading {
  frequency: number;
  note: NoteReading;
  string: StringMatch;
  clarity: number;
}

export type TunerStatus =
  | { state: 'idle' }
  | { state: 'starting' }
  | { state: 'listening'; level: number; reading: TunerReading | null; hint: 'silence' | 'noisy' | null }
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

const SILENCE_RMS = 0.008;
const NOISY_AFTER_MS = 1500;

/**
 * Microphone tuner. Audio is analysed in memory frame by frame and never stored or sent anywhere.
 * The microphone is released on stop() — callers must stop when the tuner is not visible.
 */
export class Tuner {
  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private raf = 0;
  private stopped = true;
  private readonly smoother = new PitchSmoother(5);
  private unpitchedSince: number | null = null;

  constructor(
    private readonly onStatus: (s: TunerStatus) => void,
    private a4 = 440,
  ) {}

  setA4(a4: number): void {
    this.a4 = a4;
  }

  async start(): Promise<void> {
    const unsupported = tunerSupport();
    if (unsupported) {
      this.onStatus({ state: 'error', error: unsupported });
      return;
    }
    this.stopped = false;
    this.onStatus({ state: 'starting' });
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
      const Ctor = audioContextCtor() as typeof AudioContext;
      const ctx = new Ctor();
      this.ctx = ctx;
      if (ctx.state === 'suspended') await ctx.resume();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      source.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      this.smoother.reset();

      const tick = () => {
        if (this.stopped) return;
        analyser.getFloatTimeDomainData(buf);
        const level = rms(buf);
        const now = performance.now();
        if (level < SILENCE_RMS) {
          this.unpitchedSince = null;
          this.smoother.reset();
          this.onStatus({ state: 'listening', level, reading: null, hint: 'silence' });
        } else {
          const pitch = detectPitch(buf, { sampleRate: ctx.sampleRate, minFrequency: 60, maxFrequency: 1000 });
          if (pitch && pitch.clarity > 0.8) {
            this.unpitchedSince = null;
            const freq = this.smoother.push(pitch.frequency);
            this.onStatus({
              state: 'listening',
              level,
              hint: null,
              reading: { frequency: freq, note: frequencyToNote(freq, this.a4), string: nearestString(freq, this.a4), clarity: pitch.clarity },
            });
          } else {
            this.unpitchedSince ??= now;
            const noisy = now - this.unpitchedSince > NOISY_AFTER_MS;
            this.onStatus({ state: 'listening', level, reading: null, hint: noisy ? 'noisy' : null });
          }
        }
        this.raf = requestAnimationFrame(tick);
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
