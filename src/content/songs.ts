// Song catalogue.
// Famous songs are copyrighted, so only factual metadata is bundled: title, artist, year, style and
// the chord progression (chord progressions are not lyrics). No lyrics.
// `progression` is the version closest to the recording; the simplified version is derived from it
// (domain/chordpro.ts simplifySong) unless `simple` overrides it.
// Full sheets (lyrics + chords) are included only for public-domain songs, with chord arrangements
// written for this project. See docs/decisions/0006-musicas-e-direitos.md.
import type { Genre } from '../storage/schema';
import { KIDS } from './kidsSongs';

export interface ProgressionPart {
  label: string;
  /** Chord symbols separated by spaces; «|» marks bars and is ignored by the parser. */
  chords: string;
}

export type Origin = 'BR' | 'PT' | 'US' | 'UK' | 'IE' | 'CA' | 'AU' | 'outro';

export const ORIGIN_LABEL: Record<Origin, string> = {
  BR: 'Brasil',
  PT: 'Portugal',
  US: 'EUA',
  UK: 'Reino Unido',
  IE: 'Irlanda',
  CA: 'Canadá',
  AU: 'Austrália',
  outro: 'Outro',
};

/** Chord charts consulted to check progressions (only chord symbols were used, never lyrics). */
export const CIFRAS = 'cifras.com.br, consultado em 2026-10-25/26';

export interface CatalogSong {
  id: string;
  origin: Origin;
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
  /** Progression closest to the recording, for copyrighted songs. */
  progression?: readonly ProgressionPart[];
  /** Hand-written simplified version, when the automatic one is not the usual one. */
  simple?: readonly ProgressionPart[];
  /** Non-standard tuning, e.g. half a step down. */
  tuning?: string;
  /** Where the chords were checked. Absent = written from memory, not confirmed. */
  chordSource?: string;
  /** Full ChordPro sheet, only for public-domain songs. */
  chordpro?: string;
  /** Suggested strumming pattern (↓ ↑ · as in lesson 5). */
  strum?: string;
  /** Children's and party songs get their own section in «Músicas». */
  collection?: 'infantil';
  note?: string;
}

const BASIC_STRUM = '↓ · ↓ ↑ · ↑ ↓ ↑';

const POP_ROCK: CatalogSong[] = [
  { id: 'knockin-on-heavens-door', origin: 'US', title: "Knockin' on Heaven's Door", artist: 'Bob Dylan', year: 1973, genre: 'rock', key: 'G', capo: 0, bpm: 69, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe e refrão', chords: 'G D Am | G D C' }], strum: BASIC_STRUM, note: 'Ótima primeira música: só acordes abertos e sempre a mesma sequência.' },
  { id: 'let-it-be', origin: 'UK', title: 'Let It Be', artist: 'The Beatles', year: 1970, genre: 'pop', key: 'C', capo: 0, bpm: 72, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'C G Am F | C G F C' }, { label: 'Refrão', chords: 'Am G F C | C G F C' }], strum: BASIC_STRUM },
  { id: 'wonderwall', origin: 'UK', title: 'Wonderwall', artist: 'Oasis', year: 1995, genre: 'rock', key: 'Em', capo: 2, bpm: 87, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'Em7 G Dsus4 A7sus4' }, { label: 'Pré-refrão', chords: 'C D Em | C D A7sus4' }, { label: 'Refrão', chords: 'C Em7 G Em7' }], strum: '↓ · ↓ · ↓ ↑ ↓ ↑', note: 'Mantém o 3.º e o 4.º dedos fixos na 2.ª e 1.ª cordas (3.ª casa) em quase todos os acordes.' },
  { id: 'stand-by-me', origin: 'US', title: 'Stand by Me', artist: 'Ben E. King', year: 1961, genre: 'pop', key: 'A', capo: 0, bpm: 118, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Toda a música', chords: 'A A F#m F#m | D E A A' }], note: 'Em Sol, sem pestana: G Em C D (capo 2 para o tom original).' },
  { id: 'wish-you-were-here', origin: 'UK', title: 'Wish You Were Here', artist: 'Pink Floyd', year: 1975, genre: 'rock', key: 'G', capo: 0, bpm: 60, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Introdução', chords: 'Em G Em G | Em A7sus4 Em A7sus4 G' }, { label: 'Estrofe', chords: 'C D/F# Am G | D/F# C Am G' }] },
  { id: 'hallelujah', origin: 'CA', title: 'Hallelujah', artist: 'Leonard Cohen', year: 1984, genre: 'folk', key: 'C', capo: 0, bpm: 60, time: '6/8', progression: [{ label: 'Estrofe', chords: 'C Am C Am | F G C G | C F G Am F | G E7 Am' }, { label: 'Refrão', chords: 'F Am F C G C' }], strum: 'Em 6/8: ↓ · ↓ ↓ ↑ ↓' },
  { id: 'sweet-home-alabama', origin: 'US', title: 'Sweet Home Alabama', artist: 'Lynyrd Skynyrd', year: 1974, genre: 'rock', key: 'D', capo: 0, bpm: 98, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Toda a música', chords: 'D Cadd9 G G' }] },
  { id: 'zombie', origin: 'IE', title: 'Zombie', artist: 'The Cranberries', year: 1994, genre: 'rock', key: 'Em', capo: 0, bpm: 84, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Toda a música', chords: 'Em Cmaj7 G D/F#' }] },
  { id: 'creep', origin: 'UK', title: 'Creep', artist: 'Radiohead', year: 1992, genre: 'rock', key: 'G', capo: 0, bpm: 92, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Toda a música', chords: 'G B C Cm' }], note: 'Boa razão para treinar pestana: B e Cm.' },
  { id: 'have-you-ever-seen-the-rain', origin: 'US', title: 'Have You Ever Seen the Rain', artist: 'Creedence Clearwater Revival', year: 1970, genre: 'rock', key: 'C', capo: 0, bpm: 116, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'C G C' }, { label: 'Refrão', chords: 'F G C Am | F G C' }] },
  { id: 'bad-moon-rising', origin: 'US', title: 'Bad Moon Rising', artist: 'Creedence Clearwater Revival', year: 1969, genre: 'rock', key: 'D', capo: 0, bpm: 179, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'D A G D' }, { label: 'Refrão', chords: 'G D A G D' }], note: 'Só três acordes, mas rápida: começa a 100 bpm.' },
  { id: 'house-of-the-rising-sun', origin: 'UK', title: 'The House of the Rising Sun', artist: 'The Animals (tradicional)', year: 1964, genre: 'rock', key: 'Am', capo: 0, bpm: 117, time: '6/8', chordSource: CIFRAS, progression: [{ label: 'Toda a música', chords: 'Am C D F | Am C E E | Am C D F | Am E Am E' }], strum: 'Dedilhado em 6/8: baixo, depois cordas 3-2-1-2-3', note: 'Canção tradicional; os acordes são os da versão dos Animals.' },
  { id: 'hotel-california', origin: 'US', title: 'Hotel California', artist: 'Eagles', year: 1976, genre: 'rock', key: 'Am', capo: 2, bpm: 75, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'Am E G D | F C Dm E' }, { label: 'Refrão', chords: 'F C E Am | F C Dm E' }], note: 'Formas de Lá menor com capo na 2.ª casa: soa no tom original, Si menor.' },
  { id: 'smells-like-teen-spirit', origin: 'US', title: 'Smells Like Teen Spirit', artist: 'Nirvana', year: 1991, genre: 'rock', key: 'Fm', capo: 0, bpm: 117, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Toda a música', chords: 'F5 Bb5 Ab5 Db5' }], note: 'Power chords móveis na 6.ª e 5.ª cordas.' },
  { id: 'wonderful-tonight', origin: 'UK', title: 'Wonderful Tonight', artist: 'Eric Clapton', year: 1977, genre: 'rock', key: 'G', capo: 0, bpm: 95, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'G D/F# C D' }, { label: 'Ponte', chords: 'C D G D/F# Em | C D G' }] },
  { id: 'imagine', origin: 'UK', title: 'Imagine', artist: 'John Lennon', year: 1971, genre: 'pop', key: 'C', capo: 0, bpm: 76, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'C Cmaj7 F | C Cmaj7 F' }, { label: 'Pré-refrão', chords: 'F Am Dm F G G7' }, { label: 'Refrão', chords: 'F G C Cmaj7 E F | F G C' }] },
  { id: 'hey-jude', origin: 'UK', title: 'Hey Jude', artist: 'The Beatles', year: 1968, genre: 'pop', key: 'F', capo: 0, bpm: 74, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'F C C7 F | Bb F C7 F' }, { label: 'Final', chords: 'F Eb Bb F' }], note: 'Muitas pestanas no tom original. Vê a sugestão de capo.' },
  { id: 'brown-eyed-girl', origin: 'UK', title: 'Brown Eyed Girl', artist: 'Van Morrison', year: 1967, genre: 'pop', key: 'G', capo: 0, bpm: 150, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'G C G D' }, { label: 'Refrão', chords: 'C D G Em C D G D' }] },
  { id: 'every-breath-you-take', origin: 'UK', title: 'Every Breath You Take', artist: 'The Police', year: 1983, genre: 'pop', key: 'G', capo: 1, bpm: 117, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'G Em C D' }], note: 'Formas de Sol com capo 1 (tom original Lá♭).' },
  { id: 'riptide', origin: 'AU', title: 'Riptide', artist: 'Vance Joy', year: 2013, genre: 'pop', key: 'Am', capo: 1, bpm: 102, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'Am G C C' }, { label: 'Refrão', chords: 'Am G C F' }] },
  { id: 'perfect', origin: 'UK', title: 'Perfect', artist: 'Ed Sheeran', year: 2017, genre: 'pop', key: 'G', capo: 1, bpm: 63, time: '6/8', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'G Em C D' }, { label: 'Pré-refrão', chords: 'Em C G D' }] },
  { id: 'someone-like-you', origin: 'UK', title: 'Someone Like You', artist: 'Adele', year: 2011, genre: 'pop', key: 'G', capo: 2, bpm: 67, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'G Bm Em C' }, { label: 'Refrão', chords: 'G D Em C' }], note: 'Originalmente ao piano; com capo 2 soa no tom original (Lá).' },
  { id: 'im-yours', origin: 'US', title: "I'm Yours", artist: 'Jason Mraz', year: 2008, genre: 'pop', key: 'G', capo: 4, bpm: 151, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Toda a música', chords: 'G D Em C' }], strum: '↓ · ↓ ↑ · ↑ ↓ ↑ (com abafamento no 2 e no 4)' },
  { id: 'hey-there-delilah', origin: 'US', title: 'Hey There Delilah', artist: "Plain White T's", year: 2006, genre: 'pop', key: 'D', capo: 0, bpm: 104, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'D F#m D F#m | Bm A G A Bm A' }, { label: 'Refrão', chords: 'D A Bm | D A Bm' }] },
  { id: 'shallow', origin: 'US', title: 'Shallow', artist: 'Lady Gaga e Bradley Cooper', year: 2018, genre: 'pop', key: 'G', capo: 0, bpm: 96, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'Em D G | C G D' }, { label: 'Refrão', chords: 'Am D/F# G D Em' }] },
];

const FOLK_BLUES: CatalogSong[] = [
  { id: 'leaving-on-a-jet-plane', origin: 'US', title: 'Leaving on a Jet Plane', artist: 'John Denver', year: 1966, genre: 'folk', key: 'G', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'G C G C | G C D' }, { label: 'Refrão', chords: 'G C G C | G C D' }] },
  { id: 'wild-world', origin: 'UK', title: 'Wild World', artist: 'Cat Stevens', year: 1970, genre: 'folk', key: 'Am', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'Am D7 G Cmaj7 | F Dm E' }, { label: 'Refrão', chords: 'G F C | G F C' }] },
  { id: 'wagon-wheel', origin: 'US', title: 'Wagon Wheel', artist: 'Old Crow Medicine Show', year: 2004, genre: 'folk', key: 'G', capo: 2, bpm: 145, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Toda a música', chords: 'G D Em C | G D C C' }] },
  { id: 'horse-with-no-name', origin: 'US', title: 'A Horse with No Name', artist: 'America', year: 1971, genre: 'folk', key: 'Em', capo: 0, bpm: 122, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Toda a música', chords: 'Em D6/9' }], note: 'Dois acordes. O D6/9 aparece simplificado como D.' },
  { id: 'sweet-home-chicago', origin: 'US', title: 'Sweet Home Chicago', artist: 'Robert Johnson', year: 1936, genre: 'blues', key: 'E', capo: 0, bpm: null, time: '4/4', progression: [{ label: 'Blues de 12 compassos', chords: 'E7 E7 E7 E7 | A7 A7 E7 E7 | B7 A7 E7 B7' }], note: 'Forma clássica de blues de 12 compassos em Mi.' },
  { id: 'the-thrill-is-gone', origin: 'US', title: 'The Thrill Is Gone', artist: 'B.B. King', year: 1969, genre: 'blues', key: 'Bm', capo: 0, bpm: 90, time: '4/4', progression: [{ label: 'Blues menor', chords: 'Bm Bm Bm Bm | Em Em Bm Bm | G F#7 Bm Bm' }] },
];

const CLASSIC_ROCK: CatalogSong[] = [
  // EUA
  { id: 'sweet-child-o-mine', origin: 'US', title: "Sweet Child O' Mine", artist: "Guns N' Roses", year: 1987, genre: 'rock', key: 'D', capo: 0, bpm: 125, time: '4/4', tuning: 'Meio-tom abaixo (Eb Ab Db Gb Bb Eb)', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'D C G D' }, { label: 'Refrão', chords: 'A5 B5 C5 D5' }, { label: 'Parte final', chords: 'Em C B Am' }], note: 'O riff de abertura é tocado nota a nota; aqui ficam só os acordes de base. Em afinação normal soa meio-tom acima da gravação.' },
  { id: 'free-bird', origin: 'US', title: 'Free Bird', artist: 'Lynyrd Skynyrd', year: 1973, genre: 'rock', key: 'G', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'G D/F# Em | F C D' }, { label: 'Parte rápida e solo', chords: 'G Bb C' }] },
  { id: 'take-me-home-country-roads', origin: 'US', title: 'Take Me Home, Country Roads', artist: 'John Denver', year: 1971, genre: 'folk', key: 'A', capo: 0, bpm: 82, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'A F#m E D A' }, { label: 'Refrão', chords: 'A E F#m D | A E D A' }, { label: 'Ponte', chords: 'F#m E A D A E | F#m G D A E E7' }], strum: BASIC_STRUM },
  { id: 'dust-in-the-wind', origin: 'US', title: 'Dust in the Wind', artist: 'Kansas', year: 1977, genre: 'rock', key: 'C', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Introdução (dedilhado)', chords: 'C Cmaj7 Cadd9 C | Asus2 Asus4 Am' }, { label: 'Estrofe', chords: 'C G/B Am G Dm7 Am' }, { label: 'Refrão', chords: 'D/F# G Am Am/G | D/F# G Am' }], strum: 'Dedilhado (Travis picking) com o polegar a alternar baixos' },
  { id: 'nothing-else-matters', origin: 'US', title: 'Nothing Else Matters', artist: 'Metallica', year: 1991, genre: 'rock', key: 'Em', capo: 0, bpm: null, time: '6/8', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'Em D C | Em D C | G B7 Em' }, { label: 'Refrão', chords: 'C Am D | C Am D | C Am D Em' }], note: 'A introdução é dedilhada em cordas soltas (Em); começa por aí.' },
  { id: 'hey-joe', origin: 'US', title: 'Hey Joe', artist: 'Jimi Hendrix', year: 1966, genre: 'rock', key: 'E', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Toda a música', chords: 'C G D A E' }], note: 'Uma só sequência em ciclo de quintas, de C até E. Ótima para treinar mudanças.' },
  { id: 'johnny-b-goode', origin: 'US', title: 'Johnny B. Goode', artist: 'Chuck Berry', year: 1958, genre: 'rock', key: 'Bb', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Blues de 12 compassos', chords: 'Bb Bb Bb Bb | Eb Eb Bb Bb | F F Bb Bb' }], note: 'No tom original só há pestanas; usa a sugestão de capo (formas de Lá com capo 1).' },
  { id: 'patience', origin: 'US', title: 'Patience', artist: "Guns N' Roses", year: 1988, genre: 'rock', key: 'C', capo: 0, bpm: null, time: '4/4', tuning: 'Meio-tom abaixo (Eb Ab Db Gb Bb Eb)', chordSource: CIFRAS, progression: [{ label: 'Introdução', chords: 'C G A D | C G/B A D' }, { label: 'Estrofe', chords: 'C G/B G A D' }, { label: 'Refrão', chords: 'C G C Em | C G D C' }, { label: 'Final', chords: 'G D G D | F G' }] },
  // Reino Unido
  { id: 'stairway-to-heaven', origin: 'UK', title: 'Stairway to Heaven', artist: 'Led Zeppelin', year: 1971, genre: 'rock', key: 'Am', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Primeira parte', chords: 'Am G/B C D | Fmaj7 G Am' }, { label: 'Segunda parte', chords: 'C D Fmaj7 Am | C G D' }, { label: 'Parte elétrica', chords: 'C G Am | C G F Am' }, { label: 'Final', chords: 'Am G F G' }], note: 'A introdução original é dedilhada com baixo cromático (Am – G#+ – C/G – D/F#); a versão simplificada usa os acordes base.' },
  { id: 'here-comes-the-sun', origin: 'UK', title: 'Here Comes the Sun', artist: 'The Beatles', year: 1969, genre: 'pop', key: 'D', capo: 7, bpm: 129, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'D G A7' }, { label: 'Refrão', chords: 'D G E7 | D G D/F# Em7 A7' }, { label: 'Ponte', chords: 'F C G/B G D A7' }], note: 'Formas de Ré com capo na 7.ª casa (soa em Lá, como na gravação).' },
  { id: 'comfortably-numb', origin: 'UK', title: 'Comfortably Numb', artist: 'Pink Floyd', year: 1979, genre: 'rock', key: 'Bm', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'Bm A G Em Bm' }, { label: 'Refrão', chords: 'D A D A | C G C G | A C G D' }] },
  { id: 'behind-blue-eyes', origin: 'UK', title: 'Behind Blue Eyes', artist: 'The Who', year: 1971, genre: 'rock', key: 'Em', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'Em G D C A' }, { label: 'Refrão', chords: 'C D G | C D E | Bm C D A' }, { label: 'Parte rápida', chords: 'E Bm A | E Bm G D' }] },
  { id: 'sultans-of-swing', origin: 'UK', title: 'Sultans of Swing', artist: 'Dire Straits', year: 1978, genre: 'rock', key: 'Dm', capo: 0, bpm: 148, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'Dm C Bb A | Dm C Bb A | F C Bb Dm | Bb C' }, { label: 'Refrão', chords: 'Bb C | Bb C | Dm C Bb C' }] },
  { id: 'dont-look-back-in-anger', origin: 'UK', title: "Don't Look Back in Anger", artist: 'Oasis', year: 1995, genre: 'rock', key: 'C', capo: 0, bpm: 82, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'C G Am E7 | F G C Am G' }, { label: 'Ponte', chords: 'F Fm C | F Fm C | F Fm C G | G#dim Am G F G' }, { label: 'Refrão', chords: 'C G/B Am E7 | F G C Am G' }] },
];

const BRASIL: CatalogSong[] = [
  { id: 'asa-branca', origin: 'BR', title: 'Asa Branca', artist: 'Luiz Gonzaga', year: 1947, genre: 'mpb-bossa', key: 'C', capo: 0, bpm: null, time: '2/4', chordSource: CIFRAS, progression: [{ label: 'Introdução', chords: 'C F C G' }, { label: 'Estrofe', chords: 'C C7 F | C G C | C7 F Fm | G C' }], note: 'Baião: acentua o 1 e o «e» do 2.' },
  { id: 'garota-de-ipanema', origin: 'BR', title: 'Garota de Ipanema', artist: 'Tom Jobim e Vinicius de Moraes', year: 1962, genre: 'mpb-bossa', key: 'F', capo: 0, bpm: 130, time: '4/4', progression: [{ label: 'Parte A', chords: 'Fmaj7 Fmaj7 G7 G7 | Gm7 Gb7 Fmaj7 Gb7' }], note: 'Harmonia de bossa nova: um desafio. Vários acordes aparecem simplificados.' },
  { id: 'evidencias', origin: 'BR', title: 'Evidências', artist: 'Chitãozinho & Xororó', year: 1990, genre: 'outro', key: 'E', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Introdução', chords: 'E E5+ A F#m B7 | E E5+ A E/G# F#m B7 E B4' }, { label: 'Estrofe', chords: 'E B/D# C#m Bm E7 A | C#7 F#m B7 Cº C#m C#m7/B | F#7 E/G# F#/A# B7' }, { label: 'Refrão', chords: 'E G#7 A F#m B7 | F#m B7 E' }] },
  { id: 'tempo-perdido', origin: 'BR', title: 'Tempo Perdido', artist: 'Legião Urbana', year: 1986, genre: 'rock', key: 'C', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Toda a música', chords: 'C G4/B Am | Bm Em D' }] },
  { id: 'tocando-em-frente', origin: 'BR', title: 'Tocando em Frente', artist: 'Almir Sater e Renato Teixeira', year: 1990, genre: 'folk', key: 'D', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'D C G | D C G D' }, { label: 'Parte B', chords: 'Am Am/C Am G' }, { label: 'Refrão', chords: 'D C G | D C G D' }] },
  { id: 'pais-e-filhos', origin: 'BR', title: 'Pais e Filhos', artist: 'Legião Urbana', year: 1989, genre: 'rock', key: 'G', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'C D G | C D G | C D F C/E | C Bm Am D' }, { label: 'Refrão', chords: 'G C Em C | G C Em C | D G C' }] },
  { id: 'sera', origin: 'BR', title: 'Será', artist: 'Legião Urbana', year: 1985, genre: 'rock', key: 'C', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Introdução e estrofe', chords: 'C G Am F' }, { label: 'Refrão', chords: 'G Dm G Dm | Am F G' }, { label: 'Ponte', chords: 'C G/B Bb9 Am' }, { label: 'Final', chords: 'C F C F C' }] },
  { id: 'que-pais-e-este', origin: 'BR', title: 'Que País É Este', artist: 'Legião Urbana', year: 1987, genre: 'rock', key: 'Em', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Toda a música', chords: 'Em C D' }], note: 'Três acordes do princípio ao fim: ótima para treinar a mão direita.' },
  { id: 'eduardo-e-monica', origin: 'BR', title: 'Eduardo e Mônica', artist: 'Legião Urbana', year: 1986, genre: 'rock', key: 'E', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Introdução', chords: 'E A9 D9 E' }, { label: 'Estrofe', chords: 'E A9 D9 E | A9 D9 E B | E A9 E B | E A B' }, { label: 'Final', chords: 'A D E | B A G#m F#m E' }] },
  { id: 'oculos', origin: 'BR', title: 'Óculos', artist: 'Os Paralamas do Sucesso', year: 1984, genre: 'rock', key: 'E', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Introdução', chords: 'E A B C#m A B' }, { label: 'Estrofe', chords: 'E A B' }, { label: 'Refrão', chords: 'C#m A C#m A | C#m A B | E A B' }] },
  { id: 'pro-dia-nascer-feliz', origin: 'BR', title: 'Pro Dia Nascer Feliz', artist: 'Barão Vermelho', year: 1983, genre: 'rock', key: 'A', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Introdução', chords: 'A D/A F7+/A E/A D/A' }, { label: 'Estrofe', chords: 'A D/A F7+/A D/A A' }, { label: 'Pré-refrão', chords: 'G F G D | F A G D7' }, { label: 'Refrão', chords: 'G D7 G D | F A' }] },
  { id: 'exagerado', origin: 'BR', title: 'Exagerado', artist: 'Cazuza', year: 1985, genre: 'rock', key: 'G', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Introdução', chords: 'G D C' }, { label: 'Estrofe', chords: 'G D C | Em D | C Am Bm D' }, { label: 'Segunda parte', chords: 'Em Bm Am F | Em Bm Am F | C D' }] },
  { id: 'maluco-beleza', origin: 'BR', title: 'Maluco Beleza', artist: 'Raul Seixas', year: 1977, genre: 'rock', key: 'C', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'C G/B Am F | G C G7 | C G/B Am F | G C Am' }, { label: 'Refrão', chords: 'Dm G7 Dm G7 | C E7 F G7' }] },
  { id: 'metamorfose-ambulante', origin: 'BR', title: 'Metamorfose Ambulante', artist: 'Raul Seixas', year: 1973, genre: 'rock', key: 'A', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Introdução', chords: 'A G D E | A G D A' }, { label: 'Estrofe', chords: 'G D A | G D A' }, { label: 'Segunda parte', chords: 'Bb A F | C D' }] },
  { id: 'ovelha-negra', origin: 'BR', title: 'Ovelha Negra', artist: 'Rita Lee', year: 1975, genre: 'rock', key: 'A', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Introdução', chords: 'A9 D9' }, { label: 'Estrofe', chords: 'A9 D9 | A9 D9 E | F#m7(11) E' }, { label: 'Refrão', chords: 'D F#m F C G | G D E E4' }] },
  { id: 'infinita-highway', origin: 'BR', title: 'Infinita Highway', artist: 'Engenheiros do Hawaii', year: 1987, genre: 'rock', key: 'A', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Introdução', chords: 'A5 C#5 D5 E5' }, { label: 'Estrofe', chords: 'A5 C#5 E5' }, { label: 'Segunda parte', chords: 'D5 E5 F#m A | C#m/G# F#5 D5 E' }, { label: 'Solo', chords: 'D E F#m' }] },
  { id: 'anna-julia', origin: 'BR', title: 'Anna Júlia', artist: 'Los Hermanos', year: 1999, genre: 'rock', key: 'E', capo: 0, bpm: null, time: '4/4', tuning: 'Meio-tom abaixo (Eb Ab Db Gb Bb Eb)', chordSource: CIFRAS, progression: [{ label: 'Introdução', chords: 'E C#m' }, { label: 'Estrofe', chords: 'E C#m G#m A B | E C#m G#m A B' }, { label: 'Pré-refrão', chords: 'C#m G#m A E | C#m G#m A B' }, { label: 'Refrão', chords: 'E A B' }] },
  { id: 'epitafio', origin: 'BR', title: 'Epitáfio', artist: 'Titãs', year: 2001, genre: 'rock', key: 'G', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'G D/F# Em G7 | C Cm G' }, { label: 'Pré-refrão', chords: 'C Cm G E7 | A7 D7 | C Cm G E7 | Cm G' }, { label: 'Refrão', chords: 'G Am7 Cm G | D/F# Em G7 | C Cm' }] },
];

const PORTUGAL: CatalogSong[] = [
  { id: 'chico-fininho', origin: 'PT', title: 'Chico Fininho', artist: 'Rui Veloso', year: 1980, genre: 'rock', key: 'G', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Introdução', chords: 'G7 C7 | D7#9' }, { label: 'Estrofe', chords: 'G7 C7(9)' }, { label: 'Refrão', chords: 'G7 C7(9) G7 C7(9) | D7#9' }], note: 'Blues-rock: só dois acordes na estrofe.' },
  { id: 'nao-ha-estrelas-no-ceu', origin: 'PT', title: 'Não Há Estrelas no Céu', artist: 'Rui Veloso', year: 1990, genre: 'pop', key: 'C', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'C F G C | C F G C' }, { label: 'Refrão', chords: 'Am D7 G F G C | Am D7 G F Em G C' }] },
  { id: 'a-minha-maneira', origin: 'PT', title: 'À Minha Maneira', artist: 'Xutos & Pontapés', year: 1988, genre: 'rock', key: 'C', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'C F Bb G | C F C G' }, { label: 'Refrão', chords: 'Am G C | Am G C | Am G F E | F G Bb G C' }] },
  { id: 'homem-do-leme', origin: 'PT', title: 'Homem do Leme', artist: 'Xutos & Pontapés', year: 1988, genre: 'rock', key: 'Am', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'Am Em F G' }, { label: 'Refrão', chords: 'F Am7 Em C | F Am7 Em Am' }] },
  { id: 'contentores', origin: 'PT', title: 'Contentores', artist: 'Xutos & Pontapés', year: 1987, genre: 'rock', key: 'A', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'A D A G | D A G D | A E A' }, { label: 'Passagem', chords: 'D E C F A' }, { label: 'Final', chords: 'A D E A' }] },
  { id: 'dunas', origin: 'PT', title: 'Dunas', artist: 'GNR', year: 1986, genre: 'rock', key: 'G', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'G Em C D' }, { label: 'Refrão', chords: 'C D G Em | C D' }] },
  { id: 'pronuncia-do-norte', origin: 'PT', title: 'Pronúncia do Norte', artist: 'GNR', year: 1996, yearApprox: true, genre: 'pop', key: 'C', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Introdução', chords: 'F G' }, { label: 'Estrofe', chords: 'F G Am C | E F' }, { label: 'Ponte', chords: 'F G Am C F | G Dm F C C7 | G Em F' }] },
  { id: 'cavalos-de-corrida', origin: 'PT', title: 'Cavalos de Corrida', artist: 'UHF', year: 1980, genre: 'rock', key: 'D', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'D Bm' }, { label: 'Refrão', chords: 'G A G A | G A D Bm G A' }] },
  { id: 'sou-como-um-rio', origin: 'PT', title: 'Sou Como um Rio', artist: 'Delfins', year: 1990, yearApprox: true, genre: 'pop', key: 'D', capo: 0, bpm: null, time: '4/4', chordSource: CIFRAS, progression: [{ label: 'Estrofe', chords: 'D G D G | Am Em D' }, { label: 'Refrão', chords: 'C D G Em | C D Em | C D G' }] },
];

// ---------- Public domain: full sheets (lyrics are public domain; chord arrangements are original) ----------

const PUBLIC_DOMAIN: CatalogSong[] = [
  {
    id: 'amazing-grace', origin: 'UK',
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
    id: 'when-the-saints', origin: 'US',
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
    id: 'oh-susanna', origin: 'US',
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
    id: 'greensleeves', origin: 'UK',
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
    id: 'swing-low', origin: 'US',
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
    id: 'auld-lang-syne', origin: 'UK',
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
    id: 'atirei-o-pau-ao-gato', origin: 'PT',
    collection: 'infantil',
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
    id: 'blues-em-la', origin: 'outro',
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

export const CATALOG: readonly CatalogSong[] = [...POP_ROCK, ...FOLK_BLUES, ...CLASSIC_ROCK, ...BRASIL, ...PORTUGAL, ...PUBLIC_DOMAIN, ...KIDS];

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
