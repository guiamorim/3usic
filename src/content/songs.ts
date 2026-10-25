// Song catalogue.
// Famous songs are copyrighted, so only factual metadata is bundled: title, artist, year, style and
// the chord progression of a common simplified version (chord progressions are not lyrics). No lyrics.
// Full sheets (lyrics + chords) are included only for public-domain songs, with chord arrangements
// written for this project. See docs/decisions/0006-musicas-e-direitos.md.
import type { Genre } from '../storage/schema';

export interface ProgressionPart {
  label: string;
  /** Chord symbols separated by spaces; «|» marks bars and is ignored by the parser. */
  chords: string;
}

export interface CatalogSong {
  id: string;
  title: string;
  artist: string;
  year: number;
  /** True for traditional songs whose date is only approximate. */
  yearApprox?: boolean;
  genre: Genre;
  /** Key of the shapes as played (with the capo, if any). */
  key: string;
  capo: number;
  bpm: number | null;
  time: string;
  /** Simplified progression, for copyrighted songs. */
  progression?: readonly ProgressionPart[];
  /** Full ChordPro sheet, only for public-domain songs. */
  chordpro?: string;
  /** Suggested strumming pattern (↓ ↑ · as in lesson 5). */
  strum?: string;
  note?: string;
}

const BASIC_STRUM = '↓ · ↓ ↑ · ↑ ↓ ↑';

const POP_ROCK: CatalogSong[] = [
  { id: 'knockin-on-heavens-door', title: "Knockin' on Heaven's Door", artist: 'Bob Dylan', year: 1973, genre: 'rock', key: 'G', capo: 0, bpm: 69, time: '4/4', progression: [{ label: 'Estrofe e refrão', chords: 'G D Am | G D C' }], strum: BASIC_STRUM, note: 'Ótima primeira música: só acordes abertos e sempre a mesma sequência.' },
  { id: 'let-it-be', title: 'Let It Be', artist: 'The Beatles', year: 1970, genre: 'pop', key: 'C', capo: 0, bpm: 72, time: '4/4', progression: [{ label: 'Estrofe', chords: 'C G Am F | C G F C' }, { label: 'Refrão', chords: 'Am G F C | C G F C' }], strum: BASIC_STRUM },
  { id: 'wonderwall', title: 'Wonderwall', artist: 'Oasis', year: 1995, genre: 'rock', key: 'Em', capo: 2, bpm: 87, time: '4/4', progression: [{ label: 'Estrofe', chords: 'Em7 G Dsus4 A7sus4' }, { label: 'Pré-refrão', chords: 'C D Em | C D A7sus4' }, { label: 'Refrão', chords: 'C Em7 G Em7' }], strum: '↓ · ↓ · ↓ ↑ ↓ ↑', note: 'Mantém o 3.º e o 4.º dedos fixos na 2.ª e 1.ª cordas (3.ª casa) em quase todos os acordes.' },
  { id: 'stand-by-me', title: 'Stand by Me', artist: 'Ben E. King', year: 1961, genre: 'pop', key: 'A', capo: 0, bpm: 118, time: '4/4', progression: [{ label: 'Toda a música', chords: 'A A F#m F#m | D E A A' }], note: 'Em Sol, sem pestana: G Em C D (capo 2 para o tom original).' },
  { id: 'wish-you-were-here', title: 'Wish You Were Here', artist: 'Pink Floyd', year: 1975, genre: 'rock', key: 'G', capo: 0, bpm: 60, time: '4/4', progression: [{ label: 'Introdução', chords: 'Em G Em G | Em A7sus4 Em A7sus4 G' }, { label: 'Estrofe', chords: 'C D/F# Am G | D/F# C Am G' }] },
  { id: 'hallelujah', title: 'Hallelujah', artist: 'Leonard Cohen', year: 1984, genre: 'folk', key: 'C', capo: 0, bpm: 60, time: '6/8', progression: [{ label: 'Estrofe', chords: 'C Am C Am | F G C G | C F G Am F | G E7 Am' }, { label: 'Refrão', chords: 'F Am F C G C' }], strum: 'Em 6/8: ↓ · ↓ ↓ ↑ ↓' },
  { id: 'sweet-home-alabama', title: 'Sweet Home Alabama', artist: 'Lynyrd Skynyrd', year: 1974, genre: 'rock', key: 'D', capo: 0, bpm: 98, time: '4/4', progression: [{ label: 'Toda a música', chords: 'D Cadd9 G G' }] },
  { id: 'zombie', title: 'Zombie', artist: 'The Cranberries', year: 1994, genre: 'rock', key: 'Em', capo: 0, bpm: 84, time: '4/4', progression: [{ label: 'Toda a música', chords: 'Em Cmaj7 G D/F#' }] },
  { id: 'creep', title: 'Creep', artist: 'Radiohead', year: 1992, genre: 'rock', key: 'G', capo: 0, bpm: 92, time: '4/4', progression: [{ label: 'Toda a música', chords: 'G B C Cm' }], note: 'Boa razão para treinar pestana: B e Cm.' },
  { id: 'have-you-ever-seen-the-rain', title: 'Have You Ever Seen the Rain', artist: 'Creedence Clearwater Revival', year: 1970, genre: 'rock', key: 'C', capo: 0, bpm: 116, time: '4/4', progression: [{ label: 'Estrofe', chords: 'C G C C' }, { label: 'Refrão', chords: 'F G C Am | F G C' }] },
  { id: 'bad-moon-rising', title: 'Bad Moon Rising', artist: 'Creedence Clearwater Revival', year: 1969, genre: 'rock', key: 'D', capo: 0, bpm: 179, time: '4/4', progression: [{ label: 'Estrofe', chords: 'D A G D' }, { label: 'Refrão', chords: 'G D A G D' }], note: 'Só três acordes, mas rápida: começa a 100 bpm.' },
  { id: 'house-of-the-rising-sun', title: 'The House of the Rising Sun', artist: 'The Animals (tradicional)', year: 1964, genre: 'rock', key: 'Am', capo: 0, bpm: 117, time: '6/8', progression: [{ label: 'Toda a música', chords: 'Am C D F | Am C E E | Am C D F | Am E Am E' }], strum: 'Dedilhado em 6/8: baixo, depois cordas 3-2-1-2-3', note: 'Canção tradicional; os acordes são os da versão dos Animals.' },
  { id: 'hotel-california', title: 'Hotel California', artist: 'Eagles', year: 1976, genre: 'rock', key: 'Am', capo: 7, bpm: 75, time: '4/4', progression: [{ label: 'Estrofe', chords: 'Am E G D | F C Dm E' }, { label: 'Refrão', chords: 'F C E Am | F C Dm E' }], note: 'Com capo na 7.ª casa as formas são abertas; o tom real é Si menor.' },
  { id: 'smells-like-teen-spirit', title: 'Smells Like Teen Spirit', artist: 'Nirvana', year: 1991, genre: 'rock', key: 'Fm', capo: 0, bpm: 117, time: '4/4', progression: [{ label: 'Toda a música', chords: 'F5 Bb5 Ab5 Db5' }], note: 'Power chords móveis na 6.ª e 5.ª cordas. A app só tem diagramas de alguns power chords.' },
  { id: 'wonderful-tonight', title: 'Wonderful Tonight', artist: 'Eric Clapton', year: 1977, genre: 'rock', key: 'G', capo: 0, bpm: 95, time: '4/4', progression: [{ label: 'Estrofe', chords: 'G D/F# C D' }, { label: 'Ponte', chords: 'C D G D/F# Em | C D G' }] },
  { id: 'imagine', title: 'Imagine', artist: 'John Lennon', year: 1971, genre: 'pop', key: 'C', capo: 0, bpm: 76, time: '4/4', progression: [{ label: 'Estrofe', chords: 'C Cmaj7 F | C Cmaj7 F' }, { label: 'Pré-refrão', chords: 'F Am Dm F G G7' }, { label: 'Refrão', chords: 'F G C E7 | F G C' }] },
  { id: 'hey-jude', title: 'Hey Jude', artist: 'The Beatles', year: 1968, genre: 'pop', key: 'F', capo: 0, bpm: 74, time: '4/4', progression: [{ label: 'Estrofe', chords: 'F C C7 F | Bb F C7 F' }, { label: 'Final', chords: 'F Eb Bb F' }], note: 'Muitas pestanas no tom original. Vê a sugestão de capo.' },
  { id: 'brown-eyed-girl', title: 'Brown Eyed Girl', artist: 'Van Morrison', year: 1967, genre: 'pop', key: 'G', capo: 0, bpm: 150, time: '4/4', progression: [{ label: 'Estrofe', chords: 'G C G D' }, { label: 'Refrão', chords: 'C D G Em C D G D' }] },
  { id: 'every-breath-you-take', title: 'Every Breath You Take', artist: 'The Police', year: 1983, genre: 'pop', key: 'G', capo: 1, bpm: 117, time: '4/4', progression: [{ label: 'Estrofe', chords: 'G Em C D' }], note: 'Formas de Sol com capo 1 (tom original Lá♭).' },
  { id: 'riptide', title: 'Riptide', artist: 'Vance Joy', year: 2013, genre: 'pop', key: 'Am', capo: 1, bpm: 102, time: '4/4', progression: [{ label: 'Estrofe', chords: 'Am G C C' }, { label: 'Refrão', chords: 'Am G C F' }] },
  { id: 'perfect', title: 'Perfect', artist: 'Ed Sheeran', year: 2017, genre: 'pop', key: 'G', capo: 1, bpm: 63, time: '6/8', progression: [{ label: 'Estrofe', chords: 'G Em C D' }, { label: 'Pré-refrão', chords: 'Em C G D' }] },
  { id: 'someone-like-you', title: 'Someone Like You', artist: 'Adele', year: 2011, genre: 'pop', key: 'G', capo: 2, bpm: 67, time: '4/4', progression: [{ label: 'Estrofe', chords: 'G D Em C' }, { label: 'Refrão', chords: 'G D Em C' }], note: 'Originalmente ao piano; com capo 2 soa no tom original (Lá).' },
  { id: 'im-yours', title: "I'm Yours", artist: 'Jason Mraz', year: 2008, genre: 'pop', key: 'G', capo: 4, bpm: 151, time: '4/4', progression: [{ label: 'Toda a música', chords: 'G D Em C' }], strum: '↓ · ↓ ↑ · ↑ ↓ ↑ (com abafamento no 2 e no 4)' },
  { id: 'hey-there-delilah', title: 'Hey There Delilah', artist: "Plain White T's", year: 2006, genre: 'pop', key: 'D', capo: 0, bpm: 104, time: '4/4', progression: [{ label: 'Estrofe', chords: 'D F#m D F#m | Bm A G A' }] },
  { id: 'shallow', title: 'Shallow', artist: 'Lady Gaga e Bradley Cooper', year: 2018, genre: 'pop', key: 'G', capo: 0, bpm: 96, time: '4/4', progression: [{ label: 'Estrofe', chords: 'Em D/F# G C G D' }, { label: 'Refrão', chords: 'Am D G D/F# Em' }] },
];

const FOLK_BLUES: CatalogSong[] = [
  { id: 'leaving-on-a-jet-plane', title: 'Leaving on a Jet Plane', artist: 'John Denver', year: 1966, genre: 'folk', key: 'G', capo: 0, bpm: null, time: '4/4', progression: [{ label: 'Estrofe', chords: 'G C G C | G C D' }, { label: 'Refrão', chords: 'G C G C | G C D' }] },
  { id: 'wild-world', title: 'Wild World', artist: 'Cat Stevens', year: 1970, genre: 'folk', key: 'Am', capo: 0, bpm: null, time: '4/4', progression: [{ label: 'Estrofe', chords: 'Am D7 G Cmaj7 | F Dm E' }, { label: 'Refrão', chords: 'G F C | G F C' }] },
  { id: 'wagon-wheel', title: 'Wagon Wheel', artist: 'Old Crow Medicine Show', year: 2004, genre: 'folk', key: 'G', capo: 2, bpm: 145, time: '4/4', progression: [{ label: 'Toda a música', chords: 'G D Em C | G D C C' }] },
  { id: 'horse-with-no-name', title: 'A Horse with No Name', artist: 'America', year: 1971, genre: 'folk', key: 'Em', capo: 0, bpm: 122, time: '4/4', progression: [{ label: 'Toda a música', chords: 'Em D6/9' }], note: 'Dois acordes. O D6/9 aparece simplificado como D.' },
  { id: 'sweet-home-chicago', title: 'Sweet Home Chicago', artist: 'Robert Johnson', year: 1936, genre: 'blues', key: 'E', capo: 0, bpm: null, time: '4/4', progression: [{ label: 'Blues de 12 compassos', chords: 'E7 E7 E7 E7 | A7 A7 E7 E7 | B7 A7 E7 B7' }], note: 'Forma clássica de blues de 12 compassos em Mi.' },
  { id: 'the-thrill-is-gone', title: 'The Thrill Is Gone', artist: 'B.B. King', year: 1969, genre: 'blues', key: 'Bm', capo: 0, bpm: 90, time: '4/4', progression: [{ label: 'Blues menor', chords: 'Bm Bm Bm Bm | Em Em Bm Bm | G F#7 Bm Bm' }] },
];

const BRASIL: CatalogSong[] = [
  { id: 'asa-branca', title: 'Asa Branca', artist: 'Luiz Gonzaga', year: 1947, genre: 'mpb-bossa', key: 'G', capo: 0, bpm: null, time: '2/4', progression: [{ label: 'Estrofe', chords: 'C G D7 G | G7 C D7 G' }], note: 'Baião: acentua o 1 e o «e» do 2.' },
  { id: 'garota-de-ipanema', title: 'Garota de Ipanema', artist: 'Tom Jobim e Vinicius de Moraes', year: 1962, genre: 'mpb-bossa', key: 'F', capo: 0, bpm: 130, time: '4/4', progression: [{ label: 'Parte A', chords: 'Fmaj7 Fmaj7 G7 G7 | Gm7 Gb7 Fmaj7 Gb7' }], note: 'Harmonia de bossa nova: um desafio. Vários acordes aparecem simplificados.' },
  { id: 'evidencias', title: 'Evidências', artist: 'Chitãozinho & Xororó', year: 1990, genre: 'outro', key: 'Am', capo: 0, bpm: null, time: '4/4', progression: [{ label: 'Progressão principal (simplificada)', chords: 'Am F C G' }], note: 'Versão simplificada; a gravação original tem mais acordes.' },
  { id: 'tempo-perdido', title: 'Tempo Perdido', artist: 'Legião Urbana', year: 1986, genre: 'rock', key: 'Em', capo: 0, bpm: null, time: '4/4', progression: [{ label: 'Toda a música', chords: 'C Am7 Bm Em' }] },
  { id: 'tocando-em-frente', title: 'Tocando em Frente', artist: 'Almir Sater e Renato Teixeira', year: 1990, genre: 'folk', key: 'D', capo: 0, bpm: null, time: '4/4', progression: [{ label: 'Estrofe', chords: 'D C G D | C G D' }] },
];

// ---------- Public domain: full sheets (lyrics are public domain; chord arrangements are original) ----------

const PUBLIC_DOMAIN: CatalogSong[] = [
  {
    id: 'amazing-grace',
    title: 'Amazing Grace',
    artist: 'John Newton (domínio público)',
    year: 1779,
    genre: 'folk',
    key: 'G',
    capo: 0,
    bpm: 80,
    time: '3/4',
    strum: 'Em 3/4: ↓ ↓ ↓ (baixo no 1)',
    chordpro: `{title: Amazing Grace}
{artist: John Newton (domínio público)}
{key: G}
{tempo: 80}
{time: 3/4}

{start_of_verse: Estrofe 1}
A[G]mazing [G7]grace! How [C]sweet the [G]sound
That saved a wretch like [D]me!
I [G]once was [G7]lost, but [C]now am [G]found;
Was [Em]blind, but [D7]now I [G]see.
{end_of_verse}

{start_of_verse: Estrofe 2}
'Twas [G]grace that [G7]taught my [C]heart to [G]fear,
And grace my fears re[D]lieved;
How [G]precious [G7]did that [C]grace ap[G]pear
The [Em]hour I [D7]first be[G]lieved.
{end_of_verse}
`,
  },
  {
    id: 'when-the-saints',
    title: 'When the Saints Go Marching In',
    artist: 'Tradicional (domínio público)',
    year: 1900,
    yearApprox: true,
    genre: 'blues',
    key: 'C',
    capo: 0,
    bpm: 100,
    time: '4/4',
    strum: BASIC_STRUM,
    chordpro: `{title: When the Saints Go Marching In}
{artist: Tradicional (domínio público)}
{key: C}
{tempo: 100}
{time: 4/4}

{start_of_chorus}
Oh when the [C]saints go marching in,
Oh when the saints go marching [G7]in,
Oh Lord, I [C]want to [C7]be in that [F]number,
When the [C]saints go [G7]marching [C]in.
{end_of_chorus}

{start_of_verse}
Oh when the [C]sun refuse to shine,
Oh when the sun refuse to [G7]shine,
Oh Lord, I [C]want to [C7]be in that [F]number,
When the [C]sun re[G7]fuse to [C]shine.
{end_of_verse}
`,
  },
  {
    id: 'oh-susanna',
    title: 'Oh! Susanna',
    artist: 'Stephen Foster (domínio público)',
    year: 1848,
    genre: 'folk',
    key: 'C',
    capo: 0,
    bpm: 110,
    time: '2/4',
    chordpro: `{title: Oh! Susanna}
{artist: Stephen Foster (domínio público)}
{key: C}
{tempo: 110}
{time: 2/4}

{start_of_verse}
I [C]come from Alabama with my [G7]banjo on my knee,
I'm [C]going to Louisiana, my [G7]true love for to [C]see.
It rained all night the day I left, the [G7]weather it was dry,
The [C]sun so hot I froze to death, Su[G7]sanna, don't you [C]cry.
{end_of_verse}

{start_of_chorus}
Oh! [F]Susanna, oh [C]don't you cry for [G7]me,
For I [C]come from Alabama with my [G7]banjo on my [C]knee.
{end_of_chorus}
`,
  },
  {
    id: 'greensleeves',
    title: 'Greensleeves',
    artist: 'Tradicional inglesa (domínio público)',
    year: 1580,
    yearApprox: true,
    genre: 'classica',
    key: 'Am',
    capo: 0,
    bpm: 90,
    time: '3/4',
    strum: 'Dedilhado em 3/4: baixo – 3 – 2',
    chordpro: `{title: Greensleeves}
{artist: Tradicional inglesa (domínio público)}
{key: Am}
{tempo: 90}
{time: 3/4}

{start_of_verse}
A[Am]las, my [G]love, you [Am]do me [E]wrong
To [Am]cast me [G]off dis[Am]cour[E]teous[Am]ly.
For [Am]I have [G]loved you [Am]well and [E]long,
De[Am]lighting [G]in your [Am]com[E]pa[Am]ny.
{end_of_verse}

{start_of_chorus}
[C]Greensleeves was [G]all my [Am]joy,
And [E]Greensleeves was my de[Am]light;
[C]Greensleeves was my [G]heart of [Am]gold,
And [E]who but my lady [Am]Greensleeves.
{end_of_chorus}
`,
  },
  {
    id: 'swing-low',
    title: 'Swing Low, Sweet Chariot',
    artist: 'Spiritual tradicional (domínio público)',
    year: 1870,
    yearApprox: true,
    genre: 'blues',
    key: 'G',
    capo: 0,
    bpm: 70,
    time: '4/4',
    chordpro: `{title: Swing Low, Sweet Chariot}
{artist: Spiritual tradicional (domínio público)}
{key: G}
{tempo: 70}
{time: 4/4}

{start_of_chorus}
[G]Swing low, sweet [C]chari[G]ot,
Coming for to carry me [D]home;
[G]Swing low, sweet [C]chari[G]ot,
Coming [D]for to carry me [G]home.
{end_of_chorus}

{start_of_verse}
I [G]looked over Jordan, and [C]what did I [G]see,
Coming for to carry me [D]home?
A [G]band of angels [C]coming after [G]me,
Coming [D]for to carry me [G]home.
{end_of_verse}
`,
  },
  {
    id: 'auld-lang-syne',
    title: 'Auld Lang Syne',
    artist: 'Robert Burns (domínio público)',
    year: 1788,
    genre: 'folk',
    key: 'G',
    capo: 0,
    bpm: 80,
    time: '4/4',
    chordpro: `{title: Auld Lang Syne}
{artist: Robert Burns (domínio público)}
{key: G}
{tempo: 80}
{time: 4/4}

{start_of_verse}
Should [G]auld acquaintance [D]be for[G]got,
And [G7]never [C]brought to [G]mind?
Should [G]auld acquaintance [D]be for[G]got,
And [Em]auld [C]lang [D]syne[G].
{end_of_verse}

{start_of_chorus}
For [G]auld lang syne, my [D]dear,
For [G]auld [G7]lang [C]syne,
We'll [G]tak a cup o' [D]kindness [G]yet,
For [Em]auld [C]lang [D]syne[G].
{end_of_chorus}
`,
  },
  {
    id: 'atirei-o-pau-ao-gato',
    title: 'Atirei o Pau ao Gato',
    artist: 'Tradicional portuguesa (domínio público)',
    year: 1900,
    yearApprox: true,
    genre: 'fado-tradicional',
    key: 'C',
    capo: 0,
    bpm: 100,
    time: '2/4',
    note: 'Canção infantil tradicional. Harmonização simples escrita para esta app.',
    chordpro: `{title: Atirei o Pau ao Gato}
{artist: Tradicional portuguesa (domínio público)}
{key: C}
{tempo: 100}
{time: 2/4}

[C]Atirei o pau ao [G7]gato, to-to,
Mas o gato, to-to, não mor[C]reu, reu-reu.
Dona [F]Chica, ca-ca, assus[C]tou-se, se-se,
Com o [G7]berro, rro-rro, que o gato [C]deu: miau!
`,
  },
  {
    id: 'blues-em-la',
    title: 'Blues em Lá (exercício)',
    artist: 'Braço (original)',
    year: 2026,
    genre: 'blues',
    key: 'A',
    capo: 0,
    bpm: 80,
    time: '4/4',
    strum: 'Shuffle: ↓ · ↓ ↑ ↓ · ↓ ↑ (colcheias «balançadas»)',
    note: 'Peça original para treinar a forma de blues de 12 compassos.',
    chordpro: `{title: Blues em Lá (exercício)}
{artist: Braço (original)}
{key: A}
{tempo: 80}
{time: 4/4}

{comment: Um acorde por compasso. Conta 1-2-3-4 em cada um.}
{start_of_verse: Compassos 1–4}
[A7]1 2 3 4 [A7]1 2 3 4 [A7]1 2 3 4 [A7]1 2 3 4
{end_of_verse}
{start_of_verse: Compassos 5–8}
[D7]1 2 3 4 [D7]1 2 3 4 [A7]1 2 3 4 [A7]1 2 3 4
{end_of_verse}
{start_of_verse: Compassos 9–12}
[E7]1 2 3 4 [D7]1 2 3 4 [A7]1 2 3 4 [E7]1 2 3 4
{end_of_verse}
`,
  },
];

export const CATALOG: readonly CatalogSong[] = [...POP_ROCK, ...FOLK_BLUES, ...BRASIL, ...PUBLIC_DOMAIN];

export function catalogSongById(id: string): CatalogSong | undefined {
  return CATALOG.find((s) => s.id === id);
}

/** Decade bucket; everything before 1900 shares one bucket. */
export function decadeOf(year: number): number {
  return year < 1900 ? 1800 : Math.floor(year / 10) * 10;
}

export function decadeLabel(decade: number): string {
  return decade < 1900 ? 'Antes de 1900' : `Anos ${String(decade).slice(2)} (${decade})`;
}
