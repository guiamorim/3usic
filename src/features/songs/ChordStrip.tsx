import { useState } from 'react';
import { ChordDiagram } from '../../components/ChordDiagram';
import { matchChord } from '../../domain/chordSymbols';

/**
 * Small diagrams of the song's chords that stay pinned at the top while the sheet scrolls.
 * Can be unpinned (it takes vertical space on small screens).
 */
export function ChordStrip({ symbols }: { symbols: readonly string[] }) {
  const [pinned, setPinned] = useState(true);
  if (symbols.length === 0) return null;
  return (
    <div className={pinned ? 'chord-strip chord-strip--pinned' : 'chord-strip'}>
      <ul className="chord-strip__list" aria-label="Acordes desta cifra" tabIndex={0}>
        {symbols.map((sym) => {
          const chord = matchChord(sym)?.chord;
          return (
            <li key={sym}>
              <span className="chord-strip__name">{sym}</span>
              {chord ? <ChordDiagram chord={chord} size="sm" showFingers={false} /> : <span className="hint">sem diagrama</span>}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className="btn btn--ghost btn--small chord-strip__toggle"
        aria-pressed={pinned}
        aria-label="Fixar os acordes no topo ao percorrer a cifra"
        title={pinned ? 'Soltar acordes' : 'Fixar acordes no topo'}
        onClick={() => setPinned((p) => !p)}
      >
        <span aria-hidden="true">{pinned ? '📌' : '📍'}</span>
      </button>
    </div>
  );
}
