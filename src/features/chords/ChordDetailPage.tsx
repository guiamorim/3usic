import { href } from '../../app/router';
import { Page } from '../../components/Page';
import { ChordDiagram } from '../../components/ChordDiagram';
import { CATEGORY_LABEL, chordById, chordFullName, relatedChords } from '../../content/chords';
import { soundingMidi } from '../../domain/guitar';
import { pitchClassFromMidi, SOLFEGE } from '../../domain/notes';
import { strum } from '../../audio/synth';
import { isAudioSupported } from '../../audio/context';

const FINGER = ['—', '1 · indicador', '2 · médio', '3 · anelar', '4 · mindinho'];
const DIFFICULTY = ['', 'Fácil', 'Média', 'Difícil'];

export function ChordDetailPage({ chordId }: { chordId: string }) {
  const chord = chordById(chordId);
  if (!chord) {
    return (
      <Page title="Acorde não encontrado" back={{ href: '#/acordes', label: 'Acordes' }}>
        <p>Este acorde não existe na biblioteca.</p>
      </Page>
    );
  }
  const notes = [...new Set(soundingMidi(chord.frets).map(pitchClassFromMidi))];
  return (
    <Page title={`${chord.symbol} — ${chordFullName(chord)}`} back={{ href: '#/acordes', label: 'Acordes' }} subtitle={`${CATEGORY_LABEL[chord.category]} · dificuldade ${DIFFICULTY[chord.difficulty]?.toLowerCase()}`}>
      <div className="chord-detail">
        <ChordDiagram chord={chord} size="lg" />
        <div>
          <p>{chord.tip}</p>
          <p>
            <strong>Notas:</strong> {notes.map((n) => `${n.replace('#', '♯')} (${SOLFEGE[n]})`).join(', ')}
          </p>
          {isAudioSupported() && (
            <button type="button" className="btn btn--secondary" onClick={() => void strum(soundingMidi(chord.frets)).catch(() => undefined)}>
              ▶ Ouvir acorde (som sintetizado)
            </button>
          )}
        </div>
      </div>
      <table className="data-table">
        <caption>Corda a corda</caption>
        <thead>
          <tr>
            <th scope="col">Corda</th>
            <th scope="col">Casa</th>
            <th scope="col">Dedo</th>
          </tr>
        </thead>
        <tbody>
          {chord.frets.map((fret, i) => (
            <tr key={i}>
              <td>{6 - i}.ª</td>
              <td>{fret < 0 ? 'Não tocar' : fret === 0 ? 'Solta' : fret}</td>
              <td>{FINGER[chord.fingers[i] ?? 0]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {chord.barre && (
        <p>
          Pestana: indicador na casa {chord.barre.fret}, da {chord.barre.fromString}.ª à {chord.barre.toString}.ª corda.
        </p>
      )}
      <section className="card">
        <h2>Exercícios de transição</h2>
        <ul>
          {chord.transitions.map((t) => {
            const other = chordById(t);
            return other ? (
              <li key={t}>
                <strong>
                  {chord.symbol} ↔ {other.symbol}
                </strong>
                : forma os dois acordes alternadamente sem tocar (10×), depois com quatro tempos cada a 60 BPM, depois com dois tempos.{' '}
                <a href={href('acordes', other.id)}>Ver {other.symbol}</a>
              </li>
            ) : null;
          })}
        </ul>
        <a className="btn btn--secondary" href="#/praticar/mudancas">
          Mudanças num minuto
        </a>
      </section>
      <section>
        <h2>Acordes relacionados</h2>
        <ul className="chord-row">
          {relatedChords(chord).map((r) => (
            <li key={r.id}>
              <a className="chord-tile" href={href('acordes', r.id)}>
                <ChordDiagram chord={r} size="sm" showFingers={false} />
                <span className="chord-tile__name">{r.symbol}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </Page>
  );
}
