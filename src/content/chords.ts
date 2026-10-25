import type { ChordFrets } from '../domain/guitar';
import type { ChordQuality } from '../domain/theory';
import { SOLFEGE, type PitchClass } from '../domain/notes';

export type ChordCategory = 'aberto' | 'setima' | 'suspenso' | 'power' | 'pestana';

export const CATEGORY_LABEL: Record<ChordCategory, string> = {
  aberto: 'Acordes abertos',
  setima: 'Acordes com sétima',
  suspenso: 'Acordes suspensos',
  power: 'Power chords',
  pestana: 'Acordes com pestana',
};

export interface Barre {
  fret: number;
  /** Lowest-pitched string covered (6..1). */
  fromString: number;
  /** Highest-pitched string covered (6..1). */
  toString: number;
}

export interface Chord {
  id: string;
  symbol: string;
  root: PitchClass;
  quality: ChordQuality;
  category: ChordCategory;
  /** From string 6 (low E) to string 1 (high E). -1 muted, 0 open. */
  frets: ChordFrets;
  /** Same order as frets. 0 = no finger, 1 indicador, 2 médio, 3 anelar, 4 mindinho. */
  fingers: readonly [number, number, number, number, number, number];
  barre?: Barre;
  /** Overrides the solfège root name (e.g. Si♭ instead of Lá♯). */
  displayRoot?: string;
  difficulty: 1 | 2 | 3;
  tip: string;
  /** Chord ids worth practising transitions with. */
  transitions: readonly string[];
}

const QUALITY_NAME: Record<ChordQuality, string> = {
  major: 'maior',
  minor: 'menor',
  '7': 'com sétima',
  maj7: 'com sétima maior',
  m7: 'menor com sétima',
  sus2: 'suspenso 2',
  sus4: 'suspenso 4',
  '5': 'quinta (power chord)',
};

export function chordFullName(c: Chord): string {
  return `${c.displayRoot ?? SOLFEGE[c.root]} ${QUALITY_NAME[c.quality]}`;
}

export const CHORDS: readonly Chord[] = [
  // Open major / minor
  { id: 'E', symbol: 'E', root: 'E', quality: 'major', category: 'aberto', frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], difficulty: 1, tip: 'Todas as seis cordas soam. Arqueia os dedos para não abafar a 3.ª corda.', transitions: ['A', 'Am', 'E7'] },
  { id: 'Em', symbol: 'Em', root: 'E', quality: 'minor', category: 'aberto', frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], difficulty: 1, tip: 'Um dos acordes mais fáceis: dois dedos e todas as cordas soltas.', transitions: ['G', 'C', 'Am', 'D'] },
  { id: 'A', symbol: 'A', root: 'A', quality: 'major', category: 'aberto', frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], difficulty: 1, tip: 'Três dedos lado a lado na 2.ª casa. Não toques a 6.ª corda.', transitions: ['D', 'E', 'Am'] },
  { id: 'Am', symbol: 'Am', root: 'A', quality: 'minor', category: 'aberto', frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], difficulty: 1, tip: 'Mesma forma do E, uma corda abaixo. Começa na 5.ª corda.', transitions: ['C', 'E', 'Dm', 'G'] },
  { id: 'D', symbol: 'D', root: 'D', quality: 'major', category: 'aberto', frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], difficulty: 1, tip: 'Toca apenas as quatro cordas mais agudas, começando na 4.ª (Ré).', transitions: ['A', 'G', 'Em'] },
  { id: 'Dm', symbol: 'Dm', root: 'D', quality: 'minor', category: 'aberto', frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], difficulty: 2, tip: 'O indicador na 1.ª casa da 1.ª corda precisa da ponta do dedo para não abafar.', transitions: ['Am', 'C', 'G'] },
  { id: 'C', symbol: 'C', root: 'C', quality: 'major', category: 'aberto', frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], difficulty: 2, tip: 'Os dedos ficam em diagonal. Deixa a 3.ª e a 1.ª corda soarem soltas.', transitions: ['G', 'Am', 'F', 'Em'] },
  { id: 'G', symbol: 'G', root: 'G', quality: 'major', category: 'aberto', frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3], difficulty: 2, tip: 'Ocupa as duas extremidades do braço. Mantém o polegar atrás do braço para alcançar.', transitions: ['C', 'D', 'Em'] },
  // Seventh chords
  { id: 'E7', symbol: 'E7', root: 'E', quality: '7', category: 'setima', frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], difficulty: 1, tip: 'É o E sem o dedo 3. A sétima (Ré) vem da 4.ª corda solta.', transitions: ['A', 'Am'] },
  { id: 'A7', symbol: 'A7', root: 'A', quality: '7', category: 'setima', frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0], difficulty: 1, tip: 'Deixa a 3.ª corda (Sol) solta: é ela que dá a sétima.', transitions: ['D', 'E7'] },
  { id: 'D7', symbol: 'D7', root: 'D', quality: '7', category: 'setima', frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3], difficulty: 2, tip: 'Forma de triângulo invertido em relação ao D.', transitions: ['G', 'C'] },
  { id: 'G7', symbol: 'G7', root: 'G', quality: '7', category: 'setima', frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], difficulty: 2, tip: 'Pede resolução para C. Experimenta tocar G7 → C.', transitions: ['C'] },
  { id: 'C7', symbol: 'C7', root: 'C', quality: '7', category: 'setima', frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], difficulty: 2, tip: 'É o C com o mindinho a acrescentar Si♭ na 3.ª corda.', transitions: ['F', 'Fmaj7'] },
  { id: 'B7', symbol: 'B7', root: 'B', quality: '7', category: 'setima', frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4], difficulty: 3, tip: 'Usa os quatro dedos. Muito comum em músicas em Mi (E – A – B7).', transitions: ['E', 'Em'] },
  { id: 'Cmaj7', symbol: 'Cmaj7', root: 'C', quality: 'maj7', category: 'setima', frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0], difficulty: 1, tip: 'É o C sem o indicador: som suave, típico de bossa e pop.', transitions: ['Fmaj7', 'Am7'] },
  { id: 'Fmaj7', symbol: 'Fmaj7', root: 'F', quality: 'maj7', category: 'setima', frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0], difficulty: 1, tip: 'Boa alternativa ao F com pestana para principiantes.', transitions: ['Cmaj7', 'C', 'Am'] },
  { id: 'Amaj7', symbol: 'Amaj7', root: 'A', quality: 'maj7', category: 'setima', frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0], difficulty: 2, tip: 'Desce o dedo da 3.ª corda do A uma casa.', transitions: ['A', 'Dmaj7'] },
  { id: 'Dmaj7', symbol: 'Dmaj7', root: 'D', quality: 'maj7', category: 'setima', frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 2, 3], difficulty: 2, tip: 'Três dedos na 2.ª casa, nas três cordas mais agudas.', transitions: ['Amaj7', 'D'] },
  { id: 'Am7', symbol: 'Am7', root: 'A', quality: 'm7', category: 'setima', frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0], difficulty: 1, tip: 'É o Am sem o dedo da 3.ª corda.', transitions: ['Dm7', 'Cmaj7', 'Em7'] },
  { id: 'Em7', symbol: 'Em7', root: 'E', quality: 'm7', category: 'setima', frets: [0, 2, 2, 0, 3, 0], fingers: [0, 1, 2, 0, 3, 0], difficulty: 1, tip: 'O Ré na 2.ª corda (3.ª casa) dá a sétima.', transitions: ['Am7', 'G'] },
  { id: 'Dm7', symbol: 'Dm7', root: 'D', quality: 'm7', category: 'setima', frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1], barre: { fret: 1, fromString: 2, toString: 1 }, difficulty: 2, tip: 'O indicador faz uma pequena pestana nas duas cordas mais agudas.', transitions: ['G7', 'Am7'] },
  { id: 'Bm7', symbol: 'Bm7', root: 'B', quality: 'm7', category: 'setima', frets: [-1, 2, 0, 2, 0, 2], fingers: [0, 1, 0, 2, 0, 3], difficulty: 2, tip: 'Alternativa sem pestana ao Bm: três dedos na 2.ª casa, cordas 4 e 2 soltas.', transitions: ['G', 'D', 'Em', 'A'] },
  // Suspended
  { id: 'Dsus2', symbol: 'Dsus2', root: 'D', quality: 'sus2', category: 'suspenso', frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 3, 0], difficulty: 1, tip: 'Levanta o dedo da 1.ª corda do D. Som aberto, sem terceira.', transitions: ['D', 'Dsus4'] },
  { id: 'Dsus4', symbol: 'Dsus4', root: 'D', quality: 'sus4', category: 'suspenso', frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 4], difficulty: 2, tip: 'Alterna D → Dsus4 → D para criar movimento num só acorde.', transitions: ['D', 'Dsus2'] },
  { id: 'Asus2', symbol: 'Asus2', root: 'A', quality: 'sus2', category: 'suspenso', frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0], difficulty: 1, tip: 'O A com a 2.ª corda solta.', transitions: ['A', 'Asus4'] },
  { id: 'Asus4', symbol: 'Asus4', root: 'A', quality: 'sus4', category: 'suspenso', frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0], difficulty: 2, tip: 'Alterna com A para ouvir a tensão a resolver.', transitions: ['A', 'Asus2'] },
  { id: 'Esus4', symbol: 'Esus4', root: 'E', quality: 'sus4', category: 'suspenso', frets: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 4, 0, 0], difficulty: 2, tip: 'Acrescenta o mindinho à forma do E.', transitions: ['E'] },
  // Power chords
  { id: 'E5', symbol: 'E5', root: 'E', quality: '5', category: 'power', frets: [0, 2, 2, -1, -1, -1], fingers: [0, 1, 2, 0, 0, 0], difficulty: 1, tip: 'Só três cordas graves. Abafa as restantes com a palma da mão direita.', transitions: ['A5', 'G5'] },
  { id: 'A5', symbol: 'A5', root: 'A', quality: '5', category: 'power', frets: [-1, 0, 2, 2, -1, -1], fingers: [0, 0, 1, 2, 0, 0], difficulty: 1, tip: 'Mesma forma do E5, uma corda acima.', transitions: ['E5', 'D5'] },
  { id: 'D5', symbol: 'D5', root: 'D', quality: '5', category: 'power', frets: [-1, -1, 0, 2, 3, -1], fingers: [0, 0, 0, 1, 2, 0], difficulty: 1, tip: 'Toca apenas a 4.ª, 3.ª e 2.ª cordas.', transitions: ['A5', 'G5'] },
  { id: 'G5', symbol: 'G5', root: 'G', quality: '5', category: 'power', frets: [3, 5, 5, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0], difficulty: 2, tip: 'Forma móvel: a nota da 6.ª corda dá o nome ao acorde.', transitions: ['C5', 'E5'] },
  { id: 'C5', symbol: 'C5', root: 'C', quality: '5', category: 'power', frets: [-1, 3, 5, 5, -1, -1], fingers: [0, 1, 3, 4, 0, 0], difficulty: 2, tip: 'Forma móvel com fundamental na 5.ª corda.', transitions: ['G5', 'D5'] },
  { id: 'F5', symbol: 'F5', root: 'F', quality: '5', category: 'power', frets: [1, 3, 3, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0], difficulty: 2, tip: 'Forma móvel com fundamental na 6.ª corda: indicador na fundamental, anelar e mindinho duas casas acima.', transitions: ['G5', 'C5'] },
  { id: 'F#5', symbol: 'F#5', root: 'F#', quality: '5', category: 'power', frets: [2, 4, 4, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0], difficulty: 2, tip: 'A forma do F5 uma casa acima.', transitions: ['D5', 'E5'] },
  { id: 'Ab5', symbol: 'Ab5', root: 'G#', quality: '5', category: 'power', frets: [4, 6, 6, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0], displayRoot: 'Lá♭', difficulty: 2, tip: 'Forma móvel na 6.ª corda, 4.ª casa.', transitions: ['F5', 'Db5'] },
  { id: 'Bb5', symbol: 'Bb5', root: 'A#', quality: '5', category: 'power', frets: [-1, 1, 3, 3, -1, -1], fingers: [0, 1, 3, 4, 0, 0], displayRoot: 'Si♭', difficulty: 2, tip: 'Forma móvel com fundamental na 5.ª corda. Não toques a 6.ª corda.', transitions: ['F5', 'C5'] },
  { id: 'B5', symbol: 'B5', root: 'B', quality: '5', category: 'power', frets: [-1, 2, 4, 4, -1, -1], fingers: [0, 1, 3, 4, 0, 0], difficulty: 2, tip: 'Forma móvel na 5.ª corda, 2.ª casa.', transitions: ['A5', 'E5'] },
  { id: 'Db5', symbol: 'C#5', root: 'C#', quality: '5', category: 'power', frets: [-1, 4, 6, 6, -1, -1], fingers: [0, 1, 3, 4, 0, 0], difficulty: 2, tip: 'Forma móvel na 5.ª corda, 4.ª casa (Dó♯ = Ré♭).', transitions: ['A5', 'Ab5'] },
  { id: 'Eb5', symbol: 'Eb5', root: 'D#', quality: '5', category: 'power', frets: [-1, 6, 8, 8, -1, -1], fingers: [0, 1, 3, 4, 0, 0], displayRoot: 'Mi♭', difficulty: 2, tip: 'Forma móvel na 5.ª corda, 6.ª casa.', transitions: ['Bb5', 'C5'] },
  // Barre chords
  { id: 'F-simples', symbol: 'F', root: 'F', quality: 'major', category: 'pestana', frets: [-1, -1, 3, 2, 1, 1], fingers: [0, 0, 3, 2, 1, 1], barre: { fret: 1, fromString: 2, toString: 1 }, difficulty: 2, tip: 'Versão de quatro cordas: um bom passo antes da pestana completa.', transitions: ['C', 'G', 'Am'] },
  { id: 'F', symbol: 'F', root: 'F', quality: 'major', category: 'pestana', frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barre: { fret: 1, fromString: 6, toString: 1 }, difficulty: 3, tip: 'Rola ligeiramente o indicador para usar o lado ósseo. É normal levar semanas a soar limpo.', transitions: ['C', 'Bb', 'Dm'] },
  { id: 'Fm', symbol: 'Fm', root: 'F', quality: 'minor', category: 'pestana', frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], barre: { fret: 1, fromString: 6, toString: 1 }, difficulty: 3, tip: 'A forma do Em deslocada com pestana.', transitions: ['C', 'Bb'] },
  { id: 'F#m', symbol: 'F#m', root: 'F#', quality: 'minor', category: 'pestana', frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], barre: { fret: 2, fromString: 6, toString: 1 }, difficulty: 3, tip: 'Muito usado em Lá maior (A – D – E – F#m).', transitions: ['A', 'D', 'Bm'] },
  { id: 'Bb', symbol: 'Bb', root: 'A#', quality: 'major', category: 'pestana', frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], barre: { fret: 1, fromString: 5, toString: 1 }, displayRoot: 'Si♭', difficulty: 3, tip: 'Forma do A com pestana na 1.ª casa. A 1.ª corda é difícil: pode ficar abafada no início.', transitions: ['F', 'C'] },
  { id: 'Bm', symbol: 'Bm', root: 'B', quality: 'minor', category: 'pestana', frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], barre: { fret: 2, fromString: 5, toString: 1 }, difficulty: 3, tip: 'Forma do Am com pestana na 2.ª casa. Não toques a 6.ª corda.', transitions: ['G', 'D', 'Em', 'A'] },
  { id: 'Cm', symbol: 'Cm', root: 'C', quality: 'minor', category: 'pestana', frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], barre: { fret: 3, fromString: 5, toString: 1 }, difficulty: 3, tip: 'A forma do Bm deslocada uma casa acima.', transitions: ['Fm', 'G'] },
  { id: 'B', symbol: 'B', root: 'B', quality: 'major', category: 'pestana', frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], barre: { fret: 2, fromString: 5, toString: 1 }, difficulty: 3, tip: 'Forma do A com pestana na 2.ª casa. Aparece muito em Mi maior (E – B – A).', transitions: ['E', 'A', 'F#m'] },
  { id: 'C#', symbol: 'C#', root: 'C#', quality: 'major', category: 'pestana', frets: [-1, 4, 6, 6, 6, 4], fingers: [0, 1, 2, 3, 4, 1], barre: { fret: 4, fromString: 5, toString: 1 }, displayRoot: 'Dó♯', difficulty: 3, tip: 'Forma do A com pestana na 4.ª casa (Dó♯ = Ré♭).', transitions: ['F#', 'G#m', 'B'] },
  { id: 'F#', symbol: 'F#', root: 'F#', quality: 'major', category: 'pestana', frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], barre: { fret: 2, fromString: 6, toString: 1 }, difficulty: 3, tip: 'A forma do F deslocada uma casa acima.', transitions: ['B', 'Bm', 'D'] },
  { id: 'Gm', symbol: 'Gm', root: 'G', quality: 'minor', category: 'pestana', frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], barre: { fret: 3, fromString: 6, toString: 1 }, difficulty: 3, tip: 'Forma do Em com pestana na 3.ª casa.', transitions: ['F', 'Dm', 'C'] },
  { id: 'C#m', symbol: 'C#m', root: 'C#', quality: 'minor', category: 'pestana', frets: [-1, 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1], barre: { fret: 4, fromString: 5, toString: 1 }, difficulty: 3, tip: 'Forma do Am com pestana na 4.ª casa. Comum em Mi e Lá maior.', transitions: ['A', 'E', 'B'] },
  { id: 'G#m', symbol: 'G#m', root: 'G#', quality: 'minor', category: 'pestana', frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], barre: { fret: 4, fromString: 6, toString: 1 }, difficulty: 3, tip: 'Forma do Em com pestana na 4.ª casa.', transitions: ['E', 'B', 'C#m'] },
  { id: 'Eb', symbol: 'Eb', root: 'D#', quality: 'major', category: 'pestana', frets: [-1, 6, 8, 8, 8, 6], fingers: [0, 1, 2, 3, 4, 1], barre: { fret: 6, fromString: 5, toString: 1 }, displayRoot: 'Mi♭', difficulty: 3, tip: 'Forma do A com pestana na 6.ª casa.', transitions: ['Bb', 'Cm', 'Ab'] },
  { id: 'Ab', symbol: 'Ab', root: 'G#', quality: 'major', category: 'pestana', frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], barre: { fret: 4, fromString: 6, toString: 1 }, displayRoot: 'Lá♭', difficulty: 3, tip: 'Forma do F com pestana na 4.ª casa.', transitions: ['Eb', 'Bb', 'Fm'] },
  { id: 'F#m7', symbol: 'F#m7', root: 'F#', quality: 'm7', category: 'pestana', frets: [2, 4, 2, 2, 2, 2], fingers: [1, 3, 1, 1, 1, 1], barre: { fret: 2, fromString: 6, toString: 1 }, difficulty: 3, tip: 'Forma do Em7 com pestana: só o anelar fica fora da pestana.', transitions: ['A', 'D', 'Bm7'] },
];

export function chordById(id: string): Chord | undefined {
  return CHORDS.find((c) => c.id === id);
}

export function relatedChords(c: Chord): Chord[] {
  return CHORDS.filter((o) => o.id !== c.id && (o.root === c.root || c.transitions.includes(o.id))).slice(0, 6);
}

/** Normalise text for accent/case-insensitive search. */
function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function searchChords(query: string, list: readonly Chord[] = CHORDS): Chord[] {
  const q = fold(query.trim());
  if (!q) return [...list];
  return list.filter((c) => {
    const haystack = fold(`${c.symbol} ${chordFullName(c)} ${CATEGORY_LABEL[c.category]} ${c.quality}`);
    // Exact symbol match first-class: "a" should find A, Am, A7...
    return c.symbol.toLowerCase().startsWith(q) || haystack.includes(q);
  });
}
