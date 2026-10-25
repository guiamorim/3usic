import type { Demo } from '../content/curriculum';
import { chordById } from '../content/chords';
import { STANDARD_TUNING } from '../domain/guitar';
import { midiToFrequency } from '../domain/notes';
import { ChordDiagram } from './ChordDiagram';
import { Fretboard } from './Fretboard';
import { href } from '../app/router';

export function DemoView({ demo }: { demo: Demo }) {
  switch (demo.kind) {
    case 'chords':
      return (
        <figure className="demo">
          <div className="chord-row">
            {demo.chordIds.map((id) => {
              const c = chordById(id);
              return c ? (
                <a key={id} className="chord-tile" href={href('acordes', c.id)}>
                  <ChordDiagram chord={c} size="sm" />
                  <span className="chord-tile__name">{c.symbol}</span>
                </a>
              ) : null;
            })}
          </div>
          <figcaption>{demo.caption}</figcaption>
        </figure>
      );
    case 'tab':
      return (
        <figure className="demo">
          <pre className="tab" aria-hidden="true">
            {demo.lines.join('\n')}
          </pre>
          <p className="visually-hidden">{demo.description}</p>
          <figcaption>
            {demo.caption}
            <details className="tab-text">
              <summary>Descrição em texto</summary>
              <p>{demo.description}</p>
            </details>
          </figcaption>
        </figure>
      );
    case 'strum':
      return (
        <figure className="demo">
          <table className="strum">
            <caption className="visually-hidden">Padrão de rasgueado: ↓ para baixo, ↑ para cima, · movimento no ar</caption>
            <tbody>
              <tr>
                {demo.strokes.map((s, i) => (
                  <td key={i} className={s === '·' ? 'strum__ghost' : 'strum__stroke'} aria-label={s === '↓' ? 'para baixo' : s === '↑' ? 'para cima' : 'no ar'}>
                    {s}
                  </td>
                ))}
              </tr>
              <tr>
                {demo.counts.map((c, i) => (
                  <td key={i} className="strum__count">
                    {c}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <figcaption>{demo.caption}</figcaption>
        </figure>
      );
    case 'tuning':
      return (
        <figure className="demo">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Corda</th>
                <th scope="col">Nota</th>
                <th scope="col">Frequência</th>
              </tr>
            </thead>
            <tbody>
              {STANDARD_TUNING.map((s) => (
                <tr key={s.number}>
                  <td>{s.number}.ª</td>
                  <td>{s.label}</td>
                  <td>{midiToFrequency(s.openMidi).toFixed(2).replace('.', ',')} Hz</td>
                </tr>
              ))}
            </tbody>
          </table>
          <figcaption>{demo.caption}</figcaption>
        </figure>
      );
    case 'fretboard':
      return (
        <figure className="demo">
          <Fretboard strings={demo.strings} maxFret={demo.maxFret} label={`${demo.caption} Cordas ${demo.strings.join(', ')} até à casa ${demo.maxFret}.`} />
          <figcaption>{demo.caption}</figcaption>
        </figure>
      );
  }
}
