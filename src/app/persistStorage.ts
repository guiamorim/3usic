import { useEffect } from 'react';

/**
 * Asks the browser once per load to protect our storage from automatic eviction, as soon as
 * the user has a profile (i.e. there is progress worth keeping). Browsers decide silently
 * (Chrome by engagement, Safari/Firefox by their own rules); a refusal changes nothing.
 */
export function usePersistentStorage(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    const s = typeof navigator !== 'undefined' ? navigator.storage : undefined;
    if (!s?.persist || !s.persisted) return;
    s.persisted()
      .then((already) => (already ? true : s.persist()))
      .catch(() => undefined);
  }, [enabled]);
}
