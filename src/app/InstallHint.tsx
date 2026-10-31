import { useState } from 'react';
import { shouldShowInstallHint, type InstallPlatform } from '../domain/install';

const KEY = 'braco.installHintDismissed';

function detect(): InstallPlatform | null {
  let dismissed = false;
  try {
    dismissed = localStorage.getItem(KEY) === '1';
  } catch {
    // Storage blocked: show the hint; dismissing then lasts only for this page load.
  }
  const nav = navigator as Navigator & { standalone?: boolean };
  const standalone = (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) || nav.standalone === true;
  return shouldShowInstallHint({ userAgent: navigator.userAgent, maxTouchPoints: navigator.maxTouchPoints, standalone }, dismissed);
}

/** Recommends opening the app from the home-screen icon (the supported way to use it on phones). */
export function InstallHint() {
  const [platform, setPlatform] = useState(detect);
  if (!platform) return null;
  const dismiss = () => {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      // Ignore: hidden for this page load only.
    }
    setPlatform(null);
  };
  return (
    <section className="card card--accent" aria-labelledby="install-title">
      <h2 id="install-title">Instala a app no ecrã principal</h2>
      {platform === 'ios' ? (
        <ol className="steps">
          <li>No Safari, toca em Partilhar (o quadrado com a seta para cima).</li>
          <li>Escolhe «Adicionar ao ecrã principal» e confirma.</li>
          <li>Abre sempre a app pelo novo ícone.</li>
        </ol>
      ) : (
        <p>No menu do navegador (⋮), escolhe «Instalar app» ou «Adicionar ao ecrã principal» e abre-a sempre pelo novo ícone.</p>
      )}
      <p className="hint">
        Assim a app abre em ecrã inteiro, funciona sem rede e consegue manter o ecrã ligado.
        {platform === 'ios' && ' No iPhone, o progresso guardado no Safari não passa para a app instalada: se já praticaste aqui, exporta em «Dados» e importa depois na app.'}
      </p>
      <div className="button-row">
        <button type="button" className="btn btn--ghost" onClick={dismiss}>
          Já instalei / não mostrar
        </button>
      </div>
    </section>
  );
}
