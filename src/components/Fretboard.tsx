import { fretPitchClass } from '../domain/guitar';
import { SOLFEGE } from '../domain/notes';

interface Props {
  /** Strings to show (1..6). */
  strings: readonly number[];
  maxFret: number;
  /** Single highlighted position; if absent, natural notes are labelled. */
  highlight?: { string: number; fret: number };
  hideLabels?: boolean;
  label: string;
}

const MARKERS = new Set([3, 5, 7, 9, 12]);

/** Horizontal fretboard: string 1 on top, as in tablature. */
export function Fretboard({ strings, maxFret, highlight, hideLabels, label }: Props) {
  const ordered = [...strings].sort((a, b) => a - b);
  const fretW = maxFret > 6 ? 34 : 48;
  const openW = 34;
  const rowH = 26;
  const w = openW + fretW * maxFret + 10;
  const h = rowH * ordered.length + 24;
  const xOf = (fret: number) => (fret === 0 ? openW / 2 : openW + (fret - 0.5) * fretW);
  const yOf = (row: number) => 12 + row * rowH + rowH / 2;

  return (
    <div className="fretboard-scroll">
      <svg className="fretboard" viewBox={`0 0 ${w} ${h}`} style={{ maxWidth: `${w * 1.6}px` }} role="img" aria-label={label}>
        <title>{label}</title>
        <rect x={openW - 3} y={12} width={4} height={rowH * ordered.length} className="fb-nut" />
        {Array.from({ length: maxFret }, (_, f) => (
          <line key={f} x1={openW + (f + 1) * fretW} x2={openW + (f + 1) * fretW} y1={12} y2={12 + rowH * ordered.length} className="fb-fret" />
        ))}
        {ordered.map((s, row) => (
          <g key={s}>
            <line x1={openW} x2={openW + maxFret * fretW} y1={yOf(row)} y2={yOf(row)} className="fb-string" strokeWidth={0.8 + s * 0.3} />
            <text x={2} y={yOf(row) + 4} className="fb-stringnum">
              {s}
            </text>
          </g>
        ))}
        {Array.from({ length: maxFret }, (_, f) =>
          MARKERS.has(f + 1) ? (
            <text key={`n${f}`} x={xOf(f + 1)} y={h - 2} textAnchor="middle" className="fb-fretnum">
              {f + 1}
            </text>
          ) : null,
        )}
        {highlight ? (
          <circle cx={xOf(highlight.fret)} cy={yOf(ordered.indexOf(highlight.string))} r={10} className="fb-highlight" />
        ) : (
          !hideLabels &&
          ordered.flatMap((s, row) =>
            Array.from({ length: maxFret + 1 }, (_, fret) => {
              const pc = fretPitchClass(s, fret);
              if (pc.includes('#')) return null;
              return (
                <g key={`${s}-${fret}`}>
                  <circle cx={xOf(fret)} cy={yOf(row)} r={10} className="fb-note" />
                  <text x={xOf(fret)} y={yOf(row) + 3.5} textAnchor="middle" className="fb-notelabel">
                    {SOLFEGE[pc]}
                  </text>
                </g>
              );
            }),
          )
        )}
      </svg>
    </div>
  );
}
