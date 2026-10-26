import { acquireMicSession, releaseMicSession } from './context';
import { tunerSupport, type TunerError } from './tuner';
import { OnsetDetector } from '../domain/rhythm';

/**
 * Listens for strum attacks on the SAME AudioContext that plays the click, so onsets and
 * scheduled strokes share one clock. Audio is analysed in memory and discarded.
 */
export class RhythmInput {
  private stream: MediaStream | null = null;
  private nodes: AudioNode[] = [];
  private session = false;
  readonly onsets: number[] = [];

  /** Call right after the output context was started from the click handler. */
  async start(ctx: AudioContext): Promise<TunerError | null> {
    const unsupported = tunerSupport();
    if (unsupported) return unsupported;
    acquireMicSession();
    this.session = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false,
      });
      this.stream = stream;
      const source = ctx.createMediaStreamSource(stream);
      // Strums carry their attack below ~1 kHz; the metronome click sits higher.
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 900;
      // ScriptProcessor is deprecated but, unlike AudioWorklet, needs no extra module file and
      // runs on every browser we target (including older iOS).
      const proc = ctx.createScriptProcessor(1024, 1, 1);
      const mute = ctx.createGain();
      mute.gain.value = 0;
      const detector = new OnsetDetector({
        sampleRate: ctx.sampleRate,
        floor: 0.008,
      });
      proc.onaudioprocess = (e) => {
        const block = e.inputBuffer.getChannelData(0);
        const start = ctx.currentTime - block.length / ctx.sampleRate;
        this.onsets.push(...detector.push(block, start));
      };
      source.connect(lowpass).connect(proc).connect(mute).connect(ctx.destination);
      this.nodes = [source, lowpass, proc, mute];
      return null;
    } catch (err) {
      this.stop();
      const name = err instanceof DOMException || err instanceof Error ? err.name : '';
      if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied';
      if (name === 'NotFoundError') return 'no-mic';
      if (name === 'NotReadableError') return 'busy';
      return 'unknown';
    }
  }

  stop(): void {
    for (const n of this.nodes) {
      if (n instanceof ScriptProcessorNode) n.onaudioprocess = null;
      n.disconnect();
    }
    this.nodes = [];
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (this.session) releaseMicSession();
    this.session = false;
  }
}
