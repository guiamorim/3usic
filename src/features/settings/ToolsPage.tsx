import type { ComponentType } from 'react';
import { Page } from '../../components/Page';
import { IconChart, IconGrid, IconMetronome, IconShield, IconStrum, IconTuner, IconUser } from '../../components/Icons';

const LINKS: {
  href: string;
  title: string;
  text: string;
  Icon: ComponentType;
  tone: string;
}[] = [
  {
    href: '#/afinador',
    title: 'Afinador',
    text: 'Afina com o microfone ou de ouvido.',
    Icon: IconTuner,
    tone: 'a',
  },
  {
    href: '#/metronomo',
    title: 'Metrónomo',
    text: 'Andamento, compasso e acentuação.',
    Icon: IconMetronome,
    tone: 'b',
  },
  {
    href: '#/acordes',
    title: 'Acordes',
    text: 'Biblioteca com diagramas e som.',
    Icon: IconGrid,
    tone: 'e',
  },
  {
    href: '#/batidas',
    title: 'Batidas',
    text: 'Padrões de mão direita para treinar.',
    Icon: IconStrum,
    tone: 'c',
  },
  {
    href: '#/progresso',
    title: 'Progresso',
    text: 'Lições, tempo de prática e competências.',
    Icon: IconChart,
    tone: 'f',
  },
  {
    href: '#/definicoes',
    title: 'Perfil e preferências',
    text: 'Instrumento, objetivos e tempo de estudo.',
    Icon: IconUser,
    tone: 'd',
  },
  {
    href: '#/dados',
    title: 'Dados e privacidade',
    text: 'Cópia de segurança, importar ou apagar.',
    Icon: IconShield,
    tone: 'd',
  },
];

export function ToolsPage() {
  return (
    <Page title="Mais" subtitle="Ferramentas, biblioteca e definições.">
      <ul className="link-list">
        {LINKS.map(({ href, title, text, Icon, tone }) => (
          <li key={href}>
            <a className="card link-card link-card--icon" href={href}>
              <span className={`link-card__icon tile--${tone}`} aria-hidden="true">
                <Icon />
              </span>
              <span className="link-card__text">
                <strong>{title}</strong>
                <span className="muted">{text}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="hint">Chords Dominator · versão {__APP_VERSION__} · funciona offline depois do primeiro carregamento.</p>
    </Page>
  );
}
