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

let shared: AudioContext | null = null;

export async function getOutputContext(): Promise<AudioContext> {
  const Ctor = audioContextCtor();
  if (!Ctor) throw new Error('Web Audio API não suportada neste navegador.');
  if (!shared || shared.state === 'closed') shared = new Ctor({ latencyHint: 'interactive' });
  if (shared.state === 'suspended') await shared.resume();
  return shared;
}
