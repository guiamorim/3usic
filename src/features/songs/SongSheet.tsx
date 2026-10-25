import type { ParsedSong, SongLine } from '../../domain/chordpro';

// Renders a parsed sheet as plain React text nodes (never as HTML), chords above the lyrics.
function Line({ line }: { line: SongLine }) {
  switch (line.kind) {
    case 'empty':
      return <div className="sheet-gap" aria-hidden="true" />;
    case 'comment':
      return <p className="sheet-comment">{line.text}</p>;
    case 'tab':
      return <pre className="sheet-tab">{line.text}</pre>;
    case 'lyrics': {
      const hasChords = line.segments.some((s) => s.chord);
      const hasText = line.segments.some((s) => s.text.trim());
      if (!hasChords) return <p className="sheet-line">{line.segments.map((s) => s.text).join('')}</p>;
      if (!hasText) {
        return (
          <p className="sheet-line sheet-line--chords">
            {line.segments.map((s, i) => (
              <span key={i} className="sheet-chord">
                {s.chord}
              </span>
            ))}
          </p>
        );
      }
      return (
        <p className="sheet-line">
          {line.segments.map((s, i) => (
            <span key={i} className="sheet-seg">
              <span className={s.chord ? 'sheet-chord' : 'sheet-chord sheet-chord--empty'}>{s.chord ?? '\u00a0'}</span>
              <span className="sheet-text">{s.text || ' '}</span>
            </span>
          ))}
        </p>
      );
    }
  }
}

const SECTION_CLASS = { verse: 'sheet-section', chorus: 'sheet-section sheet-section--chorus', bridge: 'sheet-section sheet-section--bridge', tab: 'sheet-section', other: 'sheet-section' } as const;

export function SongSheet({ song }: { song: ParsedSong }) {
  if (song.sections.length === 0) return <p className="muted">Sem conteúdo para mostrar.</p>;
  return (
    <div className="sheet">
      {song.sections.map((section, i) => (
        <section key={i} className={SECTION_CLASS[section.type]} aria-label={section.label ?? undefined}>
          {section.label && <h3 className="sheet-label">{section.label}</h3>}
          {section.lines.map((line, j) => (
            <Line key={j} line={line} />
          ))}
        </section>
      ))}
    </div>
  );
}
