import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/** Controlled updates: a new version waits until the user chooses to reload. */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();

  // The "offline ready" note is informative only: hide it after a few seconds.
  useEffect(() => {
    if (!offlineReady) return;
    const id = setTimeout(() => setOfflineReady(false), 6000);
    return () => clearTimeout(id);
  }, [offlineReady, setOfflineReady]);

  if (!needRefresh && !offlineReady) return null;
  return (
    <div className="toast" role="status">
      {needRefresh ? (
        <>
          <span>Há uma nova versão disponível. O teu progresso mantém-se.</span>
          <button type="button" className="btn btn--small btn--primary" onClick={() => void updateServiceWorker(true)}>
            Atualizar
          </button>
          <button type="button" className="btn btn--small btn--ghost" onClick={() => setNeedRefresh(false)}>
            Mais tarde
          </button>
        </>
      ) : (
        <>
          <span>A aplicação está pronta para funcionar offline.</span>
          <button type="button" className="btn btn--small btn--ghost" onClick={() => setOfflineReady(false)}>
            OK
          </button>
        </>
      )}
    </div>
  );
}
