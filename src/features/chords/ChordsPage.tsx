import { useState } from 'react';
import { href } from '../../app/router';
import { Page } from '../../components/Page';
import { ChordDiagram } from '../../components/ChordDiagram';
import { CATEGORY_LABEL, CHORDS, chordFullName, searchChords, type ChordCategory } from '../../content/chords';

const DIFFICULTY = ['', 'Fácil', 'Média', 'Difícil'];

export function ChordsPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ChordCategory | 'todas'>('todas');
  const list = searchChords(query, category === 'todas' ? CHORDS : CHORDS.filter((c) => c.category === category));
  return (
    <Page title="Acordes" subtitle={`${CHORDS.length} acordes com diagrama, dedilhação e exercícios de transição.`}>
      <div className="filters" role="search">
        <label className="field">
          <span>Pesquisar</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ex.: Am, ré menor, pestana" />
        </label>
        <label className="field">
          <span>Categoria</span>
          <select value={category} onChange={(e) => setCategory(e.target.value as ChordCategory | 'todas')}>
            <option value="todas">Todas</option>
            {(Object.keys(CATEGORY_LABEL) as ChordCategory[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="muted" role="status">
        {list.length} {list.length === 1 ? 'acorde' : 'acordes'}
      </p>
      <ul className="chord-grid">
        {list.map((c) => (
          <li key={c.id}>
            <a className="chord-card" href={href('acordes', c.id)}>
              <ChordDiagram chord={c} size="sm" showFingers={false} />
              <span className="chord-card__symbol">{c.symbol}</span>
              <span className="chord-card__name">{chordFullName(c)}</span>
              <span className={`difficulty difficulty--${c.difficulty}`}>{DIFFICULTY[c.difficulty]}</span>
            </a>
          </li>
        ))}
      </ul>
    </Page>
  );
}
