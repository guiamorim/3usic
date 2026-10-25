import { acquireMicSession, audioContextCtor, releaseMicSession } from './context';
import { tunerSupport, type TunerError } from './tuner';

function mapError(err: unknown): TunerError {
  const name = err instanceof DOMException || err instanceof Error ? err.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'no-mic';
  if (name === 'NotReadableError' || name === 'AbortError') return 'busy';
  return 'unknown';
}

/**
 * Microphone frames for analysis in memory. Nothing is recorded, stored or sent.
 * Always call stop() when the page or the feature is left.
 */
export class MicInput {
  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private session = false;

  constructor(private readonly fftSize = 8192) {}

  get sampleRate(): number {
    return this.ctx?.sampleRate ?? 48000;
  }

  get active(): boolean {
    return this.analyser !== null;
  }

  /** Call directly from a click handler. Resolves to an error code, or null when listening. */
  async start(): Promise<TunerError | null> {
    const unsupported = tunerSupport();
    if (unsupported) return unsupported;
    acquireMicSession();
    this.session = true;
    const Ctor = audioContextCtor() as typeof AudioContext;
    const ctx = new Ctor();
    this.ctx = ctx;
    const resumed = ctx.resume().catch(() => undefined);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        video: false,
      });
      if (!this.ctx) {
        stream.getTracks().forEach((t) => t.stop());
        return null;
      }
      this.stream = stream;
      await resumed;
      if (ctx.state !== 'running') await ctx.resume();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = this.fftSize;
      ctx.createMediaStreamSource(stream).connect(analyser);
      this.analyser = analyser;
      return null;
    } catch (err) {
      this.stop();
      return mapError(err);
    }
  }

  /** Fills `buf` (length fftSize) with the latest samples; false when not listening. */
  read(buf: Float32Array<ArrayBuffer>): boolean {
    if (!this.analyser || !this.ctx) return false;
    if (this.ctx.state !== 'running') void this.ctx.resume().catch(() => undefined);
    this.analyser.getFloatTimeDomainData(buf);
    return true;
  }

  stop(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.analyser = null;
    if (this.ctx && this.ctx.state !== 'closed') void this.ctx.close();
    this.ctx = null;
    if (this.session) releaseMicSession();
    this.session = false;
  }
}
