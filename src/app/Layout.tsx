import type { ReactNode } from 'react';
import type { WakeLockState } from './wakeLock';
import { IconBook, IconGrid, IconHome, IconMusic, IconStrum, IconTarget, IconTools } from '../components/Icons';

const NAV = [
  { href: '#/', match: '', label: 'Início', Icon: IconHome },
  { href: '#/aprender', match: 'aprender', label: 'Aprender', Icon: IconBook },
  { href: '#/praticar', match: 'praticar', label: 'Praticar', Icon: IconTarget },
  { href: '#/musicas', match: 'musicas', label: 'Músicas', Icon: IconMusic },
  { href: '#/batidas', match: 'batidas', label: 'Batidas', Icon: IconStrum },
  { href: '#/acordes', match: 'acordes', label: 'Acordes', Icon: IconGrid },
  { href: '#/ferramentas', match: 'ferramentas', label: 'Mais', Icon: IconTools },
] as const;

const TOOL_ROUTES = new Set(['ferramentas', 'afinador', 'metronomo', 'progresso', 'definicoes', 'dados', 'privacidade']);

const AWAKE_HINT: Record<WakeLockState, string> = {
  on: 'Ecrã sempre ligado: ativo',
  off: 'Ecrã sempre ligado: desligado',
  unsupported: 'Este navegador não permite manter o ecrã ligado',
  failed: 'Não foi possível manter o ecrã ligado (bateria fraca ou modo de poupança?)',
};

export function Layout({
  section,
  children,
  banner,
  hideNav,
  awake,
}: {
  section: string;
  children: ReactNode;
  banner?: ReactNode;
  hideNav?: boolean;
  awake?: { enabled: boolean; state: WakeLockState; toggle(): void };
}) {
  const active = TOOL_ROUTES.has(section) ? 'ferramentas' : section;
  return (
    <div className={hideNav ? "app app--no-nav" : "app"}>
      <a className="skip-link" href="#conteudo" onClick={(e) => {
        e.preventDefault();
        document.getElementById('conteudo')?.focus();
      }}>
        Saltar para o conteúdo
      </a>
      <header className="app-header">
        <a href="#/" className="brand" aria-label="Braço — início">
          <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
            <rect width="32" height="32" rx="8" className="brand__bg" />
            <path d="M9 8v16M14 8v16M19 8v16M24 8v16M7 12h19M7 17h19" className="brand__lines" />
          </svg>
          <span>Braço</span>
        </a>
        {awake && !hideNav && (
          <button
            type="button"
            className={`awake-toggle${awake.enabled ? ' awake-toggle--on' : ''}`}
            aria-pressed={awake.enabled}
            onClick={awake.toggle}
            disabled={awake.state === 'unsupported'}
            title={AWAKE_HINT[awake.enabled ? awake.state : awake.state === 'unsupported' ? 'unsupported' : 'off']}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>Ecrã ligado</span>
            <span className="visually-hidden">{awake.enabled ? ' (ativo)' : ''}</span>
          </button>
        )}
      </header>
      {banner}
      <main id="conteudo" tabIndex={-1} className="app-main">
        {children}
      </main>
      {!hideNav && (
      <nav className="app-nav" aria-label="Navegação principal">
        <ul>
          {NAV.map(({ href, match, label, Icon }) => (
            <li key={href}>
              <a href={href} aria-current={active === match ? 'page' : undefined}>
                <Icon />
                <span>{label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      )}
    </div>
  );
}
