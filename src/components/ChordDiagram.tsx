import type { Chord } from '../content/chords';

const FINGER_NAME = ['', 'indicador', 'médio', 'anelar', 'mindinho'];

export function describeChord(chord: Chord): string {
  const parts = chord.frets.map((fret, i) => {
    const string = 6 - i;
    if (fret < 0) return `${string}.ª corda não se toca`;
    if (fret === 0) return `${string}.ª corda solta`;
    const finger = chord.fingers[i] ?? 0;
    return `${string}.ª corda casa ${fret}${finger ? ` com o ${FINGER_NAME[finger]}` : ''}`;
  });
  const barre = chord.barre ? `. Pestana na casa ${chord.barre.fret}, da ${chord.barre.fromString}.ª à ${chord.barre.toString}.ª corda` : '';
  return `Diagrama de ${chord.symbol}: ${parts.join('; ')}${barre}.`;
}

interface Props {
  chord: Chord;
  size?: 'sm' | 'md' | 'lg';
  showFingers?: boolean;
}

export function ChordDiagram({ chord, size = 'md', showFingers = true }: Props) {
  const pressed = chord.frets.filter((f) => f > 0);
  const maxFret = pressed.length ? Math.max(...pressed) : 0;
  const baseFret = maxFret <= 4 ? 1 : Math.min(...pressed);
  const rows = 5;
  const w = 120;
  const h = 150;
  const left = 22;
  const top = 30;
  const gridW = 80;
  const gridH = 110;
  const sx = gridW / 5;
  const fy = gridH / rows;
  const xOf = (i: number) => left + i * sx;
  const yOf = (fret: number) => top + (fret - baseFret + 0.5) * fy;

  return (
    <svg className={`chord-diagram chord-diagram--${size}`} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={describeChord(chord)}>
      <title>{describeChord(chord)}</title>
      {/* Nut or position marker */}
      {baseFret === 1 ? (
        <rect x={left - 1} y={top - 4} width={gridW + 2} height={4} className="cd-nut" />
      ) : (
        <text x={left - 6} y={top + fy * 0.65} className="cd-pos" textAnchor="end">
          {baseFret}
        </text>
      )}
      {Array.from({ length: rows + 1 }, (_, r) => (
        <line key={`f${r}`} x1={left} x2={left + gridW} y1={top + r * fy} y2={top + r * fy} className="cd-fret" />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <line key={`s${i}`} x1={xOf(i)} x2={xOf(i)} y1={top} y2={top + gridH} className="cd-string" strokeWidth={1 + (5 - i) * 0.25} />
      ))}
      {chord.frets.map((fret, i) =>
        fret <= 0 ? (
          <text key={`m${i}`} x={xOf(i)} y={top - 9} className={fret < 0 ? 'cd-mute' : 'cd-open'} textAnchor="middle">
            {fret < 0 ? '×' : '○'}
          </text>
        ) : null,
      )}
      {chord.barre && (
        <rect
          x={xOf(6 - chord.barre.fromString) - 7}
          y={yOf(chord.barre.fret) - 7}
          width={xOf(6 - chord.barre.toString) - xOf(6 - chord.barre.fromString) + 14}
          height={14}
          rx={7}
          className="cd-barre"
        />
      )}
      {chord.frets.map((fret, i) => {
        if (fret <= 0) return null;
        const finger = chord.fingers[i] ?? 0;
        const onBarre = chord.barre && fret === chord.barre.fret && finger === 1 && 6 - i <= chord.barre.fromString && 6 - i >= chord.barre.toString;
        return (
          <g key={`d${i}`}>
            {!onBarre && <circle cx={xOf(i)} cy={yOf(fret)} r={7} className="cd-dot" />}
            {showFingers && finger > 0 && (!onBarre || 6 - i === chord.barre?.toString) && (
              <text x={xOf(i)} y={yOf(fret) + 3.5} className="cd-finger" textAnchor="middle">
                {finger}
              </text>
            )}
          </g>
        );
      })}
      {['E', 'A', 'D', 'G', 'B', 'E'].map((name, i) => (
        <text key={`s${i}`} x={xOf(i)} y={h - 4} className="cd-strings" textAnchor="middle">
          {name}
        </text>
      ))}
    </svg>
  );
}
