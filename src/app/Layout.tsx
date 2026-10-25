import type { ReactNode } from 'react';
import { IconBook, IconGrid, IconHome, IconTarget, IconTools } from '../components/Icons';

const NAV = [
  { href: '#/', match: '', label: 'Início', Icon: IconHome },
  { href: '#/aprender', match: 'aprender', label: 'Aprender', Icon: IconBook },
  { href: '#/praticar', match: 'praticar', label: 'Praticar', Icon: IconTarget },
  { href: '#/acordes', match: 'acordes', label: 'Acordes', Icon: IconGrid },
  { href: '#/ferramentas', match: 'ferramentas', label: 'Ferramentas', Icon: IconTools },
] as const;

const TOOL_ROUTES = new Set(['ferramentas', 'afinador', 'metronomo', 'progresso', 'definicoes', 'dados', 'privacidade']);

export function Layout({ section, children, banner, hideNav }: { section: string; children: ReactNode; banner?: ReactNode; hideNav?: boolean }) {
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
