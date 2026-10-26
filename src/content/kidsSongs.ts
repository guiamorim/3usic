// Children's and party songs (Brazil and Portugal).
// Traditional folk songs: lyrics are public domain (anonymous, oral tradition); the chord
// arrangements are written for this project. Common regional variants exist; these are the
// best-known versions. «Parabéns a você» has an identified lyricist, so only chords are bundled.
import type { CatalogSong } from './songs';

const TRAD = 'Tradicional (domínio público)';
const KIDS_STRUM = '↓ · ↓ · (dois por compasso, só para baixo)';

const kid = (s: Omit<CatalogSong, 'collection' | 'genre' | 'capo' | 'yearApprox' | 'artist'> & Partial<Pick<CatalogSong, 'genre' | 'artist'>>): CatalogSong => ({
  genre: 'folk',
  artist: TRAD,
  capo: 0,
  yearApprox: true,
  collection: 'infantil',
  ...s,
});

export const KIDS: CatalogSong[] = [
  kid({
    id: 'parabens-a-voce-br',
    origin: 'BR',
    title: 'Parabéns a Você (versão brasileira)',
    artist: 'Melodia: Mildred e Patty Hill · letra: Bertha Celeste Homem de Mello',
    year: 1942,
    genre: 'outro',
    key: 'C',
    bpm: 100,
    time: '3/4',
    strum: 'Valsa: ↓ ↓ ↓ (baixo no 1)',
    progression: [
      { label: '«Parabéns a você…»', chords: 'C | G7 | G7 | C' },
      { label: '«Muitas felicidades…»', chords: 'C C7 | F | C G7 | C' },
    ],
    note: 'Só os acordes: a melodia é de domínio público, mas a letra brasileira tem autora identificada e pode ainda estar protegida. No Brasil segue-se o «É pique, é pique…» e o «rá-tim-bum», cantados sem acordes, só com palmas. Podes colar a letra em «Letra e cifra completa» (fica só neste aparelho).',
  }),
  kid({
    id: 'parabens-a-voce-pt',
    origin: 'PT',
    title: 'Parabéns a Você (versão portuguesa)',
    artist: 'Melodia: Mildred e Patty Hill · letra: autoria incerta',
    year: 1950,
    genre: 'outro',
    key: 'C',
    bpm: 100,
    time: '3/4',
    strum: 'Valsa: ↓ ↓ ↓ (baixo no 1)',
    progression: [
      { label: '1.ª quadra («Parabéns a você…»)', chords: 'C | G7 | G7 | C | C C7 | F | C G7 | C' },
      { label: '2.ª quadra («Hoje é dia de festa…»)', chords: 'C | G7 | G7 | C | C C7 | F | C G7 | C' },
    ],
    note: 'Só os acordes: a letra portuguesa deriva da brasileira e a autoria não está clara, por isso não é incluída. Em Portugal canta-se a mesma melodia duas vezes (a segunda quadra começa por «Hoje é dia de festa») e termina-se com vivas. Podes colar a letra em «Letra e cifra completa» (fica só neste aparelho).',
  }),
  kid({
    id: 'atirei-o-pau-no-gato',
    origin: 'BR',
    title: 'Atirei o Pau no Gato',
    year: 1900,
    key: 'C',
    bpm: 100,
    time: '2/4',
    strum: KIDS_STRUM,
    note: 'Em Portugal canta-se «Atirei o pau ao gato» (também está nesta secção).',
    chordpro: `{title: Atirei o Pau no Gato}
{artist: ${TRAD}}

{start_of_verse}
[C]Atirei o pau no [G7]gato-to,
mas o gato-to não mor[C]reu-reu-reu.
Dona [F]Chica-ca admi[C]rou-se-se
do [G7]berro, do berro que o gato [C]deu:
Miau!
{end_of_verse}
`,
  }),
  kid({
    id: 'ciranda-cirandinha',
    origin: 'BR',
    title: 'Ciranda, Cirandinha',
    year: 1900,
    key: 'C',
    bpm: 96,
    time: '2/4',
    strum: KIDS_STRUM,
    chordpro: `{title: Ciranda, Cirandinha}
{artist: ${TRAD}}

{start_of_verse: Estrofe 1}
[C]Ciranda, cirandinha,
vamos todos ciran[G7]dar,
vamos dar a meia volta,
volta e meia vamos [C]dar.
{end_of_verse}

{start_of_verse: Estrofe 2}
O [C]anel que tu me deste
era vidro e se que[G7]brou;
o amor que tu me tinhas
era pouco e se aca[C]bou.
{end_of_verse}
`,
  }),
  kid({
    id: 'marcha-soldado',
    origin: 'BR',
    title: 'Marcha Soldado',
    year: 1900,
    key: 'C',
    bpm: 108,
    time: '2/4',
    strum: KIDS_STRUM,
    chordpro: `{title: Marcha Soldado}
{artist: ${TRAD}}

{start_of_verse}
[C]Marcha, soldado, cabeça de pa[G7]pel,
se não marchar direito vai preso pro quar[C]tel.
O quartel pegou fogo, a polícia deu si[G7]nal:
acode, acode, acode a bandeira nacio[C]nal!
{end_of_verse}
`,
  }),
  kid({
    id: 'o-cravo-brigou-com-a-rosa',
    origin: 'BR',
    title: 'O Cravo Brigou com a Rosa',
    year: 1900,
    key: 'C',
    bpm: 108,
    time: '3/4',
    strum: 'Valsa: ↓ ↓ ↓ (baixo no 1)',
    chordpro: `{title: O Cravo Brigou com a Rosa}
{artist: ${TRAD}}

{start_of_verse: Estrofe 1}
O [C]cravo brigou com a [G7]rosa
debaixo de uma sa[C]cada;
o cravo saiu fe[G7]rido
e a rosa despeda[C]çada.
{end_of_verse}

{start_of_verse: Estrofe 2}
O [C]cravo ficou do[G7]ente,
a rosa foi visi[C]tar;
o cravo teve um des[G7]maio
e a rosa pôs-se a cho[C]rar.
{end_of_verse}
`,
  }),
  kid({
    id: 'escravos-de-jo',
    origin: 'BR',
    title: 'Escravos de Jó',
    year: 1900,
    key: 'C',
    bpm: 100,
    time: '2/4',
    strum: KIDS_STRUM,
    note: 'Jogo de roda: passa-se um objeto ao vizinho em cada tempo e «tira, põe, deixa ficar» marca os gestos.',
    chordpro: `{title: Escravos de Jó}
{artist: ${TRAD}}

{start_of_verse}
[C]Escravos de Jó jogavam caxan[G7]gá.
Tira, põe, deixa fi[C]car.
Guerreiros com guerreiros fazem [G7]zigue-zigue-[C]zá.
Guerreiros com guerreiros fazem [G7]zigue-zigue-[C]zá.
{end_of_verse}
`,
  }),
  kid({
    id: 'peixe-vivo',
    origin: 'BR',
    title: 'Peixe Vivo',
    year: 1900,
    key: 'G',
    bpm: 92,
    time: '4/4',
    strum: '↓ · ↓ ↑ · ↑ ↓ ↑',
    chordpro: `{title: Peixe Vivo}
{artist: ${TRAD}}

{start_of_verse}
[G]Como pode o peixe vivo
viver fora da água [D7]fria?
Como pode o peixe vivo
viver fora da água [G]fria?
{end_of_verse}

{start_of_chorus}
Como pode[G7]rei vi[C]ver,
como pode[D7]rei vi[G]ver,
sem a tua, sem a [D7]tua,
sem a tua compa[G]nhia?
{end_of_chorus}
`,
  }),
  kid({
    id: 'sapo-cururu',
    origin: 'BR',
    title: 'Sapo Cururu',
    year: 1900,
    key: 'C',
    bpm: 96,
    time: '2/4',
    strum: KIDS_STRUM,
    chordpro: `{title: Sapo Cururu}
{artist: ${TRAD}}

{start_of_verse: Estrofe 1}
[C]Sapo cururu na beira do [G7]rio,
quando o sapo canta, ó maninha,
é que está com [C]frio.
{end_of_verse}

{start_of_verse: Estrofe 2}
A [C]mulher do sapo deve estar lá den[G7]tro,
fazendo rendinha, ó maninha,
pro seu casa[C]mento.
{end_of_verse}
`,
  }),
  kid({
    id: 'se-essa-rua-fosse-minha',
    origin: 'BR',
    title: 'Se Essa Rua Fosse Minha',
    year: 1900,
    key: 'Am',
    bpm: 80,
    time: '4/4',
    strum: '↓ · ↓ ↑ · ↑ ↓ ↑',
    chordpro: `{title: Se Essa Rua Fosse Minha}
{artist: ${TRAD}}

{start_of_verse}
Se essa [Am]rua, se essa rua fosse [E7]minha,
eu mandava, eu mandava ladri[Am]lhar,
com pe[A7]drinhas, com pedrinhas de bri[Dm]lhante,
para o [Am]meu, para o meu a[E7]mor pas[Am]sar.
{end_of_verse}
`,
  }),
  kid({
    id: 'borboletinha',
    origin: 'BR',
    title: 'Borboletinha',
    year: 1900,
    key: 'C',
    bpm: 104,
    time: '2/4',
    strum: KIDS_STRUM,
    chordpro: `{title: Borboletinha}
{artist: ${TRAD}}

{start_of_verse}
[C]Borboletinha tá na co[G7]zinha,
fazendo chocolate para a ma[C]drinha.
Poti, poti, perna de [G7]pau,
olho de vidro e nariz de pica-[C]pau, pau, pau.
{end_of_verse}
`,
  }),
  kid({
    id: 'pirulito-que-bate-bate',
    origin: 'BR',
    title: 'Pirulito Que Bate Bate',
    year: 1900,
    key: 'C',
    bpm: 104,
    time: '2/4',
    strum: KIDS_STRUM,
    chordpro: `{title: Pirulito Que Bate Bate}
{artist: ${TRAD}}

{start_of_verse}
[C]Pirulito que bate, bate,
pirulito que já ba[G7]teu;
quem gosta de mim é ela,
quem gosta dela sou [C]eu.
{end_of_verse}
`,
  }),
  kid({
    id: 'indo-eu-a-caminho-de-viseu',
    origin: 'PT',
    title: 'Indo Eu, a Caminho de Viseu',
    year: 1900,
    genre: 'fado-tradicional',
    key: 'G',
    bpm: 112,
    time: '2/4',
    strum: KIDS_STRUM,
    chordpro: `{title: Indo Eu, a Caminho de Viseu}
{artist: ${TRAD}}

{start_of_verse}
[G]Indo eu, indo eu,
a caminho de Vi[D7]seu,
indo eu, indo eu,
a caminho de Vi[G]seu,
encontrei o meu amor,
ai Jesus, que lá vou [D7]eu,
encontrei o meu amor,
ai Jesus, que lá vou [G]eu.
{end_of_verse}

{start_of_chorus}
Ora zuz, truz, truz,
ora zás, trás, [D7]trás,
ora chega, chega, chega,
ora arreda lá para [G]trás.
{end_of_chorus}
`,
  }),
  kid({
    id: 'todos-os-patinhos',
    origin: 'PT',
    title: 'Todos os Patinhos',
    year: 1900,
    genre: 'fado-tradicional',
    key: 'C',
    bpm: 100,
    time: '2/4',
    strum: KIDS_STRUM,
    chordpro: `{title: Todos os Patinhos}
{artist: ${TRAD}}

{start_of_verse}
[C]Todos os patinhos
sabem bem na[G7]dar,
sabem bem na[C]dar;
cabeça para [F]baixo,
rabinho para o [C]ar,
cabeça para [G7]baixo,
rabinho para o [C]ar.
{end_of_verse}
`,
  }),
  kid({
    id: 'a-machadinha',
    origin: 'PT',
    title: 'A Machadinha',
    year: 1900,
    genre: 'fado-tradicional',
    key: 'C',
    bpm: 108,
    time: '2/4',
    strum: KIDS_STRUM,
    note: 'Dança de roda: no «salta, machadinha» uma criança salta para o meio.',
    chordpro: `{title: A Machadinha}
{artist: ${TRAD}}

{start_of_verse}
Ah, ah, [C]ah, minha machadinha,
ah, ah, ah, minha ma[G7]chadinha.
Quem te pôs a mão
sabendo que és [C]minha?
Sabendo que és minha,
também eu sou [G7]tua;
salta, machadinha,
para o meio da [C]rua.
{end_of_verse}
`,
  }),
  kid({
    id: 'o-rosa-arredonda-a-saia',
    origin: 'PT',
    title: 'Ó Rosa, Arredonda a Saia',
    year: 1900,
    genre: 'fado-tradicional',
    key: 'G',
    bpm: 112,
    time: '2/4',
    strum: KIDS_STRUM,
    chordpro: `{title: Ó Rosa, Arredonda a Saia}
{artist: ${TRAD}}

{start_of_verse}
Ó [G]Rosa, arredonda a saia,
ó Rosa, arredonda-a [D7]bem;
ó Rosa, arredonda a saia,
olha a roda que ela [G]tem.
{end_of_verse}
`,
  }),
  kid({
    id: 'frei-joao',
    origin: 'PT',
    title: 'Frei João',
    year: 1800,
    key: 'C',
    bpm: 96,
    time: '4/4',
    strum: '↓ ↓ ↓ ↓',
    note: 'Melodia francesa («Frère Jacques»). Canta-se em cânone: cada voz entra duas medidas depois da anterior, sobre o mesmo acorde.',
    chordpro: `{title: Frei João}
{artist: ${TRAD}}

{start_of_verse}
[C]Frei João, Frei João,
dormes tu? Dormes [G7]tu?
[C]Toca o sino, toca o sino:
dim, dim, [G7]dão! Dim, dim, [C]dão!
{end_of_verse}
`,
  }),
];
