import { Page } from '../../components/Page';

const LINKS = [
  { href: '#/afinador', title: 'Afinador', text: 'Afina com o microfone ou de ouvido.' },
  { href: '#/metronomo', title: 'Metrónomo', text: 'Andamento, compasso e acentuação.' },
  { href: '#/progresso', title: 'Progresso', text: 'Lições, tempo de prática e competências.' },
  { href: '#/definicoes', title: 'Perfil e preferências', text: 'Instrumento, objetivos e tempo de estudo.' },
  { href: '#/dados', title: 'Dados e privacidade', text: 'Exportar, importar ou apagar os teus dados.' },
];

export function ToolsPage() {
  return (
    <Page title="Ferramentas">
      <ul className="link-list">
        {LINKS.map((l) => (
          <li key={l.href}>
            <a className="card link-card" href={l.href}>
              <strong>{l.title}</strong>
              <span className="muted">{l.text}</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="hint">Braço · versão {__APP_VERSION__} · funciona offline depois do primeiro carregamento.</p>
    </Page>
  );
}
