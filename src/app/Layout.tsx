import type { ReactNode } from 'react';
import type { WakeLockState } from './wakeLock';
import { IconBook, IconHome, IconMore, IconMusic, IconTarget } from '../components/Icons';

const NAV = [
  { href: '#/', match: '', label: 'Início', Icon: IconHome },
  { href: '#/aprender', match: 'aprender', label: 'Aprender', Icon: IconBook },
  {
    href: '#/praticar',
    match: 'praticar',
    label: 'Praticar',
    Icon: IconTarget,
  },
  { href: '#/musicas', match: 'musicas', label: 'Músicas', Icon: IconMusic },
  {
    href: '#/ferramentas',
    match: 'ferramentas',
    label: 'Mais',
    Icon: IconMore,
  },
] as const;

// Five tabs fit a phone; the other sections highlight the tab they live under.
const PARENT_TAB: Record<string, string> = {
  batidas: 'praticar',
  acordes: 'ferramentas',
  afinador: 'ferramentas',
  metronomo: 'ferramentas',
  progresso: 'ferramentas',
  definicoes: 'ferramentas',
  dados: 'ferramentas',
  privacidade: 'ferramentas',
};

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
  const active = PARENT_TAB[section] ?? section;
  return (
    <div className={hideNav ? 'app app--no-nav' : 'app'}>
      <a
        className="skip-link"
        href="#conteudo"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('conteudo')?.focus();
        }}
      >
        Saltar para o conteúdo
      </a>
      <header className="app-header">
        <a href="#/" className="brand" aria-label="Chords Dominator — início">
          <svg viewBox="0 0 64 64" width="30" height="30" aria-hidden="true">
            <defs>
              <linearGradient id="brand-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#6b2a10" />
                <stop offset="1" stopColor="#e2611c" />
              </linearGradient>
            </defs>
            <rect width="64" height="64" rx="16" fill="url(#brand-grad)" />
            <path d="M32 10C45 10 52 15 52 22C52 34 40 47 32 54C24 47 12 34 12 22C12 15 19 10 32 10Z" fill="#fff3e8" />
            <g stroke="#6b2a10" strokeLinecap="round">
              <path d="M23 17v22M29 17v26M35 17v26M41 17v22" strokeWidth="2" />
              <path d="M20 17h24" strokeWidth="3.5" />
              <path d="M21 25h22M22 33h20" strokeWidth="1.5" />
            </g>
            <g fill="#e2611c">
              <circle cx="29" cy="29" r="3.6" />
              <circle cx="41" cy="21" r="3.6" />
            </g>
          </svg>
          <span>Chords Dominator</span>
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
      {awake?.enabled && awake.state === 'failed' && !hideNav && (
        <p className="banner banner--warn" role="status">
          O telemóvel não deixou manter o ecrã ligado. Toca em qualquer sítio para tentar de novo; se continuar, desliga o modo de poupança de energia.
        </p>
      )}
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
