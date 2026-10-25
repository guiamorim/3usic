// Single shared AudioContext for output (metronome, reference tones). Created lazily on a user
// gesture, as browsers require. The tuner uses its own context so it can be closed with the mic.

type AudioContextCtor = typeof AudioContext;

export function audioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

export function isAudioSupported(): boolean {
  return audioContextCtor() !== null;
}

type SessionType = 'auto' | 'playback' | 'play-and-record';

/**
 * iOS routes Web Audio through the "ambient" session by default, which the silent switch mutes.
 * Safari 17+ exposes navigator.audioSession to ask for "playback" (plays with the switch on) or
 * "play-and-record" (needed while the microphone is open). Other browsers ignore this.
 */
export function setAudioSession(type: SessionType): void {
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
  if (!session) return;
  try {
    session.type = type;
  } catch {
    // Unsupported value on this engine: keep the default.
  }
}

let micUsers = 0;

/** While the microphone is open, iOS needs «play-and-record»; output must not switch it back. */
export function acquireMicSession(): void {
  micUsers++;
  setAudioSession('play-and-record');
}

export function releaseMicSession(): void {
  micUsers = Math.max(0, micUsers - 1);
  if (micUsers === 0) setAudioSession('auto');
}

let silentAudio: HTMLAudioElement | null = null;

/**
 * Older iOS versions without navigator.audioSession: playing a (silent) media element during the
 * user gesture switches the page to the playback category, so Web Audio is heard with the switch on.
 */
function unlockMediaPlayback(): void {
  if (typeof Audio === 'undefined') return;
  try {
    silentAudio ??= new Audio(`${import.meta.env.BASE_URL}silence.wav`);
    silentAudio.loop = false;
    void silentAudio.play().catch(() => undefined);
  } catch {
    // Media playback unavailable (tests, old engines).
  }
}

let shared: AudioContext | null = null;

/** Must be called synchronously from a user gesture (click/tap), before any other await. */
export async function getOutputContext(): Promise<AudioContext> {
  const Ctor = audioContextCtor();
  if (!Ctor) throw new Error('Web Audio API não suportada neste navegador.');
  if (micUsers === 0) {
    setAudioSession('playback');
    unlockMediaPlayback();
  }
  if (!shared || shared.state === 'closed') shared = new Ctor({ latencyHint: 'interactive' });
  // 'interrupted' is a Safari-only state (call, Siri, other app took the audio).
  if (shared.state !== 'running') await shared.resume();
  return shared;
}

const masters = new WeakMap<BaseAudioContext, AudioNode>();

/**
 * Output bus: a limiter in front of the speakers, so individual sounds can be loud (phone
 * speakers are weak) without clipping when several notes overlap.
 */
export function outputNode(ctx: BaseAudioContext): AudioNode {
  let node = masters.get(ctx);
  if (!node) {
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.knee.value = 6;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.15;
    const gain = ctx.createGain();
    gain.gain.value = 1.4;
    limiter.connect(gain).connect(ctx.destination);
    node = limiter;
    masters.set(ctx, node);
  }
  return node;
}
