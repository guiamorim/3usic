// Strumming patterns (batidas). Common, generic patterns described in our own words.
// Strokes: D = para baixo, U = para cima, X = abafado (a mão bate nas cordas abafadas),
// B = baixo (só a nota grave, com o polegar), - = a mão passa sem tocar.
export type Stroke = 'D' | 'U' | 'X' | 'B' | '-';

export interface StrumPattern {
  id: string;
  name: string;
  style: string;
  /** Beats per bar. */
  beats: number;
  /** Slots per beat: 2 = colcheias, 3 = tercinas, 4 = semicolcheias. */
  subdivision: 2 | 3 | 4;
  /** One bar, beats × subdivision strokes. */
  strokes: readonly Stroke[];
  /** Slots played louder. */
  accents?: readonly number[];
  level: 1 | 2 | 3;
  bpm: { start: number; target: number };
  description: string;
  tips: readonly string[];
  /** Catalogue songs where the pattern (or a close variant) works. */
  songIds?: readonly string[];
}

const s = (pattern: string): Stroke[] => pattern.split('') as Stroke[];

export const STRUMS: readonly StrumPattern[] = [
  {
    id: 'semiminimas',
    name: 'Só para baixo, nos tempos',
    style: 'Base',
    beats: 4,
    subdivision: 2,
    strokes: s('D-D-D-D-'),
    accents: [0],
    level: 1,
    bpm: { start: 60, target: 90 },
    description: 'Um golpe para baixo em cada tempo. É o ponto de partida para qualquer música e para treinar mudanças de acorde.',
    tips: ['Conta em voz alta «1, 2, 3, 4».', 'A mão sobe no ar entre golpes, sem tocar: o movimento fica igual ao das batidas seguintes.'],
  },
  {
    id: 'colcheias',
    name: 'Colcheias (baixo e cima)',
    style: 'Base',
    beats: 4,
    subdivision: 2,
    strokes: s('DUDUDUDU'),
    accents: [0, 4],
    level: 1,
    bpm: { start: 60, target: 100 },
    description: 'Oito golpes por compasso: para baixo nos números, para cima nos «e». A mão nunca para.',
    tips: ['O golpe para cima toca só as 3 ou 4 cordas mais finas.', 'Pulso solto, como quem sacode água da mão.'],
  },
  {
    id: 'pop-folk',
    name: 'Pop / folk',
    style: 'Pop, rock acústico, MPB',
    beats: 4,
    subdivision: 2,
    strokes: s('D-DU-UDU'),
    accents: [0, 2],
    level: 1,
    bpm: { start: 60, target: 100 },
    description: 'A batida mais usada em canções acústicas. Mantém o movimento das colcheias e falha as cordas nos «-».',
    tips: ['Diz «baixo, baixo-cima, cima-baixo-cima».', 'Se te perderes, volta às colcheias e retira golpes um a um.'],
    songIds: ['knockin-on-heavens-door', 'wonderwall', 'tempo-perdido', 'pais-e-filhos'],
  },
  {
    id: 'pop-abafado',
    name: 'Pop com abafado',
    style: 'Pop, reggae-pop, funk acústico',
    beats: 4,
    subdivision: 2,
    strokes: s('DUXUDUXU'),
    accents: [2, 6],
    level: 2,
    bpm: { start: 60, target: 95 },
    description: 'Nos tempos 2 e 4 a mão bate nas cordas abafadas (som percussivo, como uma tarola).',
    tips: ['Para abafar, pousa a palma da mão direita nas cordas no mesmo movimento do golpe para baixo.', 'Começa só com «baixo, abafa» e junta os golpes para cima depois.'],
  },
  {
    id: 'rock-colcheias',
    name: 'Rock: colcheias para baixo',
    style: 'Rock, punk, power chords',
    beats: 4,
    subdivision: 2,
    strokes: s('DDDDDDDD'),
    accents: [0, 2, 4, 6],
    level: 2,
    bpm: { start: 70, target: 130 },
    description: 'Todas as colcheias para baixo, com acento nos tempos. Soa melhor com power chords e a palma a abafar ligeiramente junto à ponte.',
    tips: ['Golpes curtos, só nas 2 ou 3 cordas graves.', 'Cansa o antebraço: relaxa os ombros e para se doer.'],
    songIds: ['que-pais-e-este', 'chico-fininho'],
  },
  {
    id: 'galope',
    name: 'Galope',
    style: 'Hard rock, metal',
    beats: 4,
    subdivision: 4,
    strokes: s('D-DDD-DDD-DDD-DD'),
    level: 3,
    bpm: { start: 60, target: 120 },
    description: 'Uma colcheia e duas semicolcheias em cada tempo: «ta-taca». Usa-se com power chords abafados.',
    tips: ['Começa muito devagar e só com uma corda.', 'Podes fazer «baixo, baixo-cima» quando ficar rápido.'],
  },
  {
    id: 'valsa',
    name: 'Valsa (3/4)',
    style: 'Valsa, baladas, canções tradicionais',
    beats: 3,
    subdivision: 2,
    strokes: s('B-DUDU'),
    accents: [0],
    level: 1,
    bpm: { start: 70, target: 110 },
    description: 'Baixo no tempo 1 e acorde nos tempos 2 e 3: «um, dois, três».',
    tips: ['O baixo é a nota mais grave do acorde (a fundamental).', 'Versão mais fácil: «baixo, baixo, baixo» só com golpes para baixo.'],
    songIds: ['amazing-grace', 'greensleeves'],
  },
  {
    id: 'balada-68',
    name: 'Balada em 6/8',
    style: 'Baladas rock e soul',
    beats: 2,
    subdivision: 3,
    strokes: s('D-UDDU'),
    accents: [0, 3],
    level: 2,
    bpm: { start: 40, target: 65 },
    description: 'Dois tempos por compasso, cada um dividido em três: «1 e a 2 e a».',
    tips: ['Sente o balanço «UM-dois-três, DOIS-dois-três».', 'O metrónomo marca os dois tempos principais.'],
  },
  {
    id: 'shuffle',
    name: 'Shuffle (blues)',
    style: 'Blues, rock and roll',
    beats: 4,
    subdivision: 3,
    strokes: s('D-UD-UD-UD-U'),
    accents: [0, 6],
    level: 2,
    bpm: { start: 60, target: 110 },
    description: 'Colcheias «ao balanço»: o golpe para baixo é longo e o para cima é curto, como «taa-ta, taa-ta».',
    tips: ['Imagina a palavra «ca-va-lo» em cada tempo e toca no «ca» e no «lo».', 'Fica muito bem com acordes de sétima (A7, D7, E7).'],
    songIds: ['johnny-b-goode'],
  },
  {
    id: 'country',
    name: 'Baixo alternado (country)',
    style: 'Country, folk, sertanejo de raiz',
    beats: 4,
    subdivision: 2,
    strokes: s('B-DUB-DU'),
    accents: [0, 4],
    level: 2,
    bpm: { start: 60, target: 100 },
    description: 'Nota grave no tempo 1 e no tempo 3, acorde nos tempos 2 e 4.',
    tips: ['No tempo 3 podes tocar outra nota grave do acorde (por exemplo, em G: 6.ª corda e depois 4.ª corda).', 'Começa só com «baixo, acorde, baixo, acorde».'],
    songIds: ['take-me-home-country-roads'],
  },
  {
    id: 'reggae',
    name: 'Reggae (contratempo)',
    style: 'Reggae, ska',
    beats: 4,
    subdivision: 2,
    strokes: s('-U-U-U-U'),
    level: 2,
    bpm: { start: 60, target: 90 },
    description: 'Só se toca nos «e», com golpes curtos e abafados logo a seguir. Os tempos ficam em silêncio.',
    tips: ['A mão continua a descer nos tempos, mas no ar.', 'Larga a pressão da mão esquerda logo após cada golpe para o som ficar curto.'],
  },
  {
    id: 'tresillo',
    name: 'Tresillo (3 + 3 + 2)',
    style: 'Baião, pop latino, reggaeton acústico',
    beats: 4,
    subdivision: 2,
    strokes: s('D--D--D-'),
    accents: [0, 3, 6],
    level: 2,
    bpm: { start: 60, target: 100 },
    description: 'Três golpes desiguais por compasso: «1 . . 2 . . 3 .». A base rítmica de muita música nordestina e latina.',
    tips: ['Conta «1 2 3, 1 2 3, 1 2» em colcheias.', 'Quando estiver firme, acrescenta golpes para cima nos espaços.'],
    songIds: ['asa-branca'],
  },
];

export function strumById(id: string): StrumPattern | undefined {
  return STRUMS.find((p) => p.id === id);
}
