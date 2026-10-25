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
 * Keeps the screen from dimming/locking while `enabled`. The browser drops the lock whenever the
 * page is hidden, so it is requested again when the page becomes visible.
 */
export function useWakeLock(enabled: boolean): WakeLockState {
  const [state, setState] = useState<WakeLockState>(() => (api() ? 'off' : 'unsupported'));

  useEffect(() => {
    const wl = api();
    if (!enabled || !wl) return;
    let sentinel: WakeLockSentinelLike | null = null;
    let cancelled = false;
    const acquire = async () => {
      if (cancelled || document.visibilityState !== 'visible' || (sentinel && !sentinel.released)) return;
      try {
        sentinel = await wl.request('screen');
        if (cancelled) {
          void sentinel.release();
          return;
        }
        setState('on');
        sentinel.addEventListener('release', () => {
          if (!cancelled) setState('off');
        });
      } catch {
        if (!cancelled) setState('failed');
      }
    };
    void acquire();
    const onVisible = () => void acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      if (sentinel && !sentinel.released) void sentinel.release();
      setState('off');
    };
  }, [enabled]);

  return enabled ? state : api() ? 'off' : 'unsupported';
}
