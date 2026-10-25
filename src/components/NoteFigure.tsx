import { NOTE_VALUES, type NoteValue } from '../domain/theory';

/** Drawn note-value symbols (music fonts are not reliably available on all devices). */
export function NoteFigure({ value }: { value: NoteValue }) {
  const hollow = value === 'semibreve' || value === 'minima';
  const stem = value !== 'semibreve';
  const flags = value === 'colcheia' ? 1 : value === 'semicolcheia' ? 2 : 0;
  return (
    <svg className="note-figure" viewBox="0 0 30 60" width="30" height="60" role="img" aria-label={NOTE_VALUES[value].label}>
      <ellipse cx="12" cy="48" rx="8" ry="5.5" transform="rotate(-20 12 48)" className={hollow ? 'nf-hollow' : 'nf-filled'} />
      {stem && <line x1="19" y1="46" x2="19" y2="8" className="nf-stem" />}
      {Array.from({ length: flags }, (_, i) => (
        <path key={i} d={`M19 ${8 + i * 9} q 10 6 6 18`} className="nf-flag" />
      ))}
    </svg>
  );
}
