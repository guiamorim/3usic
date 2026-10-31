import { useEffect, useState } from 'react';

interface WakeLockSentinelLike {
  released: boolean;
  release(): Promise<void>;
  addEventListener(type: 'release', cb: () => void): void;
}

type WakeLockApi = { request(type: 'screen'): Promise<WakeLockSentinelLike> };

function api(): WakeLockApi | null {
  if (typeof navigator === 'undefined') return null;
  return (navigator as Navigator & { wakeLock?: WakeLockApi }).wakeLock ?? null;
}

export function isWakeLockSupported(): boolean {
  return api() !== null;
}

export type WakeLockState = 'off' | 'on' | 'unsupported' | 'failed';

/**
 * Keeps the screen from dimming/locking while `enabled`. The lock is lost whenever the page is
 * hidden, and the system may also drop it (low power mode, a call) or refuse it until the user
 * has touched the page (Safari, when the app opens with the option already on). So it is
 * requested again on visibility, after a release, and on the next user interaction.
 */
export function useWakeLock(enabled: boolean): WakeLockState {
  const [state, setState] = useState<WakeLockState>(() => (api() ? 'off' : 'unsupported'));

  useEffect(() => {
    const wl = api();
    if (!enabled || !wl) return;
    let sentinel: WakeLockSentinelLike | null = null;
    let cancelled = false;
    let pending = false;
    const held = () => sentinel !== null && !sentinel.released;
    const acquire = async () => {
      if (cancelled || pending || document.visibilityState !== 'visible' || held()) return;
      pending = true;
      try {
        const s = await wl.request('screen');
        if (cancelled) {
          void s.release();
          return;
        }
        sentinel = s;
        setState('on');
        s.addEventListener('release', () => {
          if (cancelled) return;
          setState('off');
          // Dropped while still visible (system decision): try again right away.
          if (document.visibilityState === 'visible') setTimeout(() => void acquire(), 500);
        });
      } catch {
        // Typically NotAllowedError: no user activation yet, or battery saver. Retried on the next touch.
        if (!cancelled) setState('failed');
      } finally {
        pending = false;
      }
    };
    const retry = () => {
      if (!held()) void acquire();
    };
    void acquire();
    document.addEventListener('visibilitychange', retry);
    // A touch, click or key press counts as user activation for browsers that require one.
    const events = ['pointerdown', 'click', 'keydown'] as const;
    for (const e of events) document.addEventListener(e, retry, { capture: true, passive: true });
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', retry);
      for (const e of events) document.removeEventListener(e, retry, { capture: true });
      if (held()) void sentinel?.release();
      setState('off');
    };
  }, [enabled]);

  return enabled ? state : api() ? 'off' : 'unsupported';
}
