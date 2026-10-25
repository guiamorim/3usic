// Original lesson content (written for this project). Melodies used are in the public domain.
import type { Instrument } from '../storage/schema';

export type Demo =
  | { kind: 'chords'; chordIds: readonly string[]; caption: string }
  | { kind: 'tab'; caption: string; lines: readonly string[]; description: string }
  | { kind: 'strum'; caption: string; counts: readonly string[]; strokes: readonly ('↓' | '↑' | '·')[] }
  | { kind: 'tuning'; caption: string }
  | { kind: 'fretboard'; caption: string; strings: readonly number[]; maxFret: number };

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  minutes: number;
  objective: string;
  /** Recommended (not enforced) prior lessons. */
  prerequisites: readonly string[];
  explanation: readonly string[];
  demo: Demo;
  practice: {
    steps: readonly string[];
    bpm?: number;
    exerciseId?: string;
    tool?: 'tuner' | 'metronome';
  };
  /** Self-assessed completion criterion shown as a checkbox. */
  completion: string;
  mistakes: readonly string[];
  instrumentNotes?: Partial<Record<Instrument, string>>;
}

export interface Module {
  id: string;
  number: number;
  title: string;
  summary: string;
}

export const MODULES: readonly Module[] = [
  { id: 'm1', number: 1, title: 'Conhecer o instrumento e a afinação', summary: 'Partes do instrumento, nomes das cordas e afinação padrão.' },
  { id: 'm2', number: 2, title: 'Postura, som e coordenação', summary: 'Como segurar o instrumento e produzir um som limpo.' },
  { id: 'm3', number: 3, title: 'Primeiras notas e técnica', summary: 'Notas na primeira posição e exercícios de independência dos dedos.' },
  { id: 'm4', number: 4, title: 'Acordes básicos e mudanças', summary: 'Os acordes abertos essenciais e como mudar entre eles.' },
  { id: 'm5', number: 5, title: 'Ritmo, pulsação e metrónomo', summary: 'Contar tempos, figuras rítmicas e padrões de rasgueado.' },
  { id: 'm6', number: 6, title: 'Teoria musical aplicada', summary: 'Meios-tons, escala maior, tríades e intervalos — sempre no braço.' },
  { id: 'm7', number: 7, title: 'Progressões harmónicas', summary: 'Campo harmónico e as progressões mais usadas.' },
  { id: 'm8', number: 8, title: 'Melodias, riffs e acompanhamento', summary: 'Tocar uma melodia, um riff e acompanhar com dedilhado.' },
  { id: 'm9', number: 9, title: 'Consolidação e revisão', summary: 'Juntar tudo e preparar o passo seguinte: a pestana.' },
];

export const LESSONS: readonly Lesson[] = [
  // ---------------- Módulo 1
  {
    id: 'l1-1',
    moduleId: 'm1',
    title: 'Partes do instrumento e nomes das cordas',
    minutes: 10,
    objective: 'Identificar as partes principais do instrumento e nomear as seis cordas soltas.',
    prerequisites: [],
    explanation: [
      'O instrumento tem três zonas principais: a cabeça (com as tarraxas, que afinam as cordas), o braço (dividido em casas pelos trastos) e o corpo (onde se toca com a mão direita).',
      'As cordas numeram-se da mais fina para a mais grossa: a 1.ª é a mais aguda e fica mais perto do chão quando seguras o instrumento; a 6.ª é a mais grave.',
      'Em afinação padrão, da 6.ª para a 1.ª: Mi – Lá – Ré – Sol – Si – Mi (E – A – D – G – B – E). Uma frase para memorizar: «Meu Lápis Ré-Sol Sabe Muito».',
      'Cada casa sobe a nota meio-tom. Pressionar uma corda logo atrás de um trasto (não em cima dele) dá o som mais limpo.',
    ],
    demo: { kind: 'tuning', caption: 'Afinação padrão, da corda mais grave (6.ª) para a mais aguda (1.ª).' },
    practice: {
      steps: [
        'Toca cada corda solta da 6.ª até à 1.ª, dizendo o nome em voz alta.',
        'Agora ao contrário, da 1.ª para a 6.ª.',
        'Fecha os olhos, toca uma corda ao acaso e diz qual é pelo som e pela posição.',
        'Faz o exercício «Nomes das cordas» até acertares pelo menos 7 em 8.',
      ],
      exerciseId: 'cordas',
    },
    completion: 'Consigo dizer o nome e o número de cada corda sem consultar.',
    mistakes: [
      'Confundir a 1.ª corda com a 6.ª: a 1.ª é a mais fina, mesmo estando «em baixo».',
      'Chamar «Mi» às duas sem distinguir: usa «Mi grave» (6.ª) e «Mi agudo» (1.ª).',
    ],
    instrumentNotes: {
      classical: 'No violão clássico as três cordas agudas são de nylon e as graves têm bordão revestido de metal.',
      electric: 'Na guitarra elétrica, verifica o volume do amplificador antes de começar: baixo é suficiente para praticar.',
    },
  },
  {
    id: 'l1-2',
    moduleId: 'm1',
    title: 'Afinar em afinação padrão',
    minutes: 10,
    objective: 'Afinar as seis cordas com o afinador da aplicação ou de ouvido.',
    prerequisites: ['l1-1'],
    explanation: [
      'Um instrumento desafinado torna qualquer exercício frustrante. Afina sempre antes de praticar — as cordas novas desafinam com mais frequência nos primeiros dias.',
      'Rodar a tarraxa num sentido aumenta a tensão (som mais agudo); no outro, diminui (som mais grave). Faz movimentos pequenos e volta a tocar a corda.',
      'Dica: se a corda estiver alta, desce um pouco abaixo da nota e volta a subir até ela. As cordas seguram melhor a afinação quando se chega à nota a subir.',
      'Sem microfone? Usa os sons de referência do afinador e compara de ouvido: quando as duas notas estão próximas, ouves uma «ondulação» que fica mais lenta até desaparecer.',
    ],
    demo: { kind: 'tuning', caption: 'Frequências de referência com Lá = 440 Hz.' },
    practice: {
      steps: [
        'Abre o afinador e autoriza o microfone (o som é analisado apenas no teu dispositivo).',
        'Toca a 6.ª corda com força moderada e deixa-a soar.',
        'Ajusta a tarraxa até o indicador mostrar «Afinado».',
        'Repete para as restantes cordas e faz uma segunda volta: afinar uma corda altera ligeiramente as outras.',
      ],
      tool: 'tuner',
    },
    completion: 'Consigo afinar as seis cordas sozinho em menos de cinco minutos.',
    mistakes: [
      'Rodar a tarraxa errada: segue a corda desde a ponte até à tarraxa antes de rodar.',
      'Tocar várias cordas ao mesmo tempo: o afinador precisa de uma nota de cada vez.',
      'Apertar demasiado e partir a corda: se a nota sobe muito, para e confirma que estás na corda certa.',
    ],
  },
  // ---------------- Módulo 2
  {
    id: 'l2-1',
    moduleId: 'm2',
    title: 'Postura e posição das mãos',
    minutes: 10,
    objective: 'Segurar o instrumento de forma relaxada e posicionar a mão esquerda para pressionar as cordas com eficiência.',
    prerequisites: ['l1-1'],
    explanation: [
      'Senta-te com as costas direitas e os ombros soltos. O instrumento apoia-se no corpo; não deve ser a mão esquerda a segurá-lo.',
      'Mão esquerda: polegar atrás do braço, mais ou menos atrás do dedo médio. Os dedos ficam arqueados, como se segurasses uma bola pequena, e pressionam com a ponta.',
      'Pressiona apenas o necessário para a nota soar limpa. Força a mais cansa e não melhora o som.',
      'Faz pausas: dor aguda não é normal. Pontas dos dedos sensíveis nas primeiras semanas é normal e passa com prática regular e curta.',
    ],
    demo: { kind: 'fretboard', caption: 'Coloca um dedo por casa: indicador na 1.ª, médio na 2.ª, anelar na 3.ª, mindinho na 4.ª.', strings: [1, 2, 3, 4, 5, 6], maxFret: 4 },
    practice: {
      steps: [
        'Coloca os quatro dedos nas casas 1 a 4 da 3.ª corda, um dedo por casa.',
        'Levanta e pousa cada dedo lentamente, sem que os outros se mexam.',
        'Verifica no espelho (ou com a câmara) se os ombros estão soltos.',
        'Repete durante dois minutos e descansa.',
      ],
    },
    completion: 'Consigo manter a postura relaxada e pressionar uma nota limpa com cada dedo.',
    mistakes: [
      'Polegar por cima do braço a apertar: provoca tensão no pulso.',
      'Dedos esticados e planos: abafam as cordas vizinhas.',
      'Inclinar o instrumento para ver o braço: tenta olhar só de lado.',
    ],
    instrumentNotes: {
      classical: 'No violão clássico usa-se tradicionalmente a perna esquerda elevada (ou um apoio) com o instrumento entre as pernas.',
    },
  },
  {
    id: 'l2-2',
    moduleId: 'm2',
    title: 'Produzir um som limpo: palheta e dedos',
    minutes: 15,
    objective: 'Tocar notas isoladas com som limpo, com palheta ou com os dedos da mão direita.',
    prerequisites: ['l2-1'],
    explanation: [
      'Com palheta: segura-a entre o polegar e o lado do indicador, deixando só a ponta de fora. Movimentos pequenos, a partir do pulso.',
      'Com os dedos: o polegar (p) toca as cordas graves (6.ª–4.ª); indicador (i), médio (m) e anelar (a) tocam a 3.ª, 2.ª e 1.ª.',
      'Alterna sempre: palhetada para baixo e para cima, ou dedos i–m alternados. Isto prepara para tocar mais rápido mais tarde.',
    ],
    demo: {
      kind: 'tab',
      caption: 'Notas soltas alternadas (cada número é uma corda solta tocada uma vez).',
      lines: ['e|--0-0-0-0---------|', 'B|----------0-0-0-0-|', 'G|------------------|', 'D|------------------|', 'A|------------------|', 'E|------------------|'],
      description: 'Quatro vezes a 1.ª corda solta, depois quatro vezes a 2.ª corda solta.',
    },
    practice: {
      steps: [
        'Com o metrónomo a 60 BPM, toca a 1.ª corda uma vez por tempo, alternando baixo/cima (ou i/m).',
        'Passa para a 2.ª corda sem perder o tempo.',
        'Repete com a 3.ª e volta à 1.ª.',
        'Só sobe para 70 BPM quando todas as notas soarem limpas.',
      ],
      bpm: 60,
      tool: 'metronome',
    },
    completion: 'Consigo tocar 16 notas seguidas a 60 BPM, alternando, sem falhar o tempo.',
    mistakes: [
      'Movimentos grandes com o braço inteiro: usa o pulso.',
      'Segurar a palheta com força excessiva: deve poder mexer-se ligeiramente.',
      'Tocar sempre para baixo: perdes velocidade e controlo mais tarde.',
    ],
    instrumentNotes: {
      classical: 'No violão clássico usa os dedos (i–m alternados); a palheta não é habitual em cordas de nylon.',
      electric: 'Na guitarra elétrica, abafa as cordas que não tocas com a palma da mão direita para evitar ruído.',
    },
  },
  // ---------------- Módulo 3
  {
    id: 'l3-1',
    moduleId: 'm3',
    title: 'Notas na primeira posição (cordas 1 a 3)',
    minutes: 15,
    objective: 'Encontrar as notas naturais entre a corda solta e a 3.ª casa nas cordas 1, 2 e 3.',
    prerequisites: ['l2-2'],
    explanation: [
      'Cada casa sobe meio-tom. Entre a maioria das notas naturais há um tom (duas casas), exceto entre Mi–Fá e Si–Dó, onde há só meio-tom (uma casa).',
      '1.ª corda (Mi): solta = Mi, 1.ª casa = Fá, 3.ª casa = Sol.',
      '2.ª corda (Si): solta = Si, 1.ª casa = Dó, 3.ª casa = Ré.',
      '3.ª corda (Sol): solta = Sol, 2.ª casa = Lá.',
      'Com estas oito notas já consegues tocar muitas melodias simples.',
    ],
    demo: { kind: 'fretboard', caption: 'Notas naturais nas cordas 1 a 3, até à 3.ª casa.', strings: [1, 2, 3], maxFret: 3 },
    practice: {
      steps: [
        'Toca e diz o nome: Sol – Lá – Si – Dó – Ré – Mi – Fá – Sol (subindo da 3.ª corda solta à 1.ª corda, 3.ª casa).',
        'Desce pela ordem inversa.',
        'Faz o exercício «Notas na 1.ª posição».',
      ],
      exerciseId: 'notas-1a-posicao',
    },
    completion: 'Consigo tocar a escala de Sol (solta) a Sol (1.ª corda, 3.ª casa) dizendo as notas.',
    mistakes: ['Usar sempre o mesmo dedo: usa o dedo correspondente à casa (casa 1 = indicador, 2 = médio, 3 = anelar).', 'Esquecer que Mi–Fá e Si–Dó estão a uma casa de distância.'],
  },
  {
    id: 'l3-2',
    moduleId: 'm3',
    title: 'Exercício cromático 1-2-3-4',
    minutes: 10,
    objective: 'Desenvolver independência e coordenação entre as duas mãos com um padrão de quatro dedos.',
    prerequisites: ['l2-1'],
    explanation: [
      'Este é um aquecimento clássico: um dedo por casa, casas 1-2-3-4, em todas as cordas.',
      'O objetivo não é velocidade, é precisão: cada nota limpa, a tempo, e os dedos que não estão a tocar ficam perto das cordas.',
      'Começa devagar com o metrónomo. Sobe 5 BPM só quando conseguires três repetições seguidas sem erros.',
    ],
    demo: {
      kind: 'tab',
      caption: 'Padrão cromático nas duas cordas mais graves (continua até à 1.ª corda).',
      lines: ['e|------------------|', 'B|------------------|', 'G|------------------|', 'D|------------------|', 'A|----------1-2-3-4-|', 'E|--1-2-3-4---------|'],
      description: 'Casas 1, 2, 3 e 4 na 6.ª corda, depois casas 1, 2, 3 e 4 na 5.ª corda.',
    },
    practice: {
      steps: ['Metrónomo a 60 BPM, uma nota por tempo.', 'Sobe da 6.ª à 1.ª corda e desce de volta.', 'Alterna a palhetada (baixo/cima) ou os dedos i–m.', 'Quando estiver fácil, toca duas notas por tempo.'],
      bpm: 60,
      tool: 'metronome',
    },
    completion: 'Consigo tocar o padrão completo, a subir e a descer, a 60 BPM sem parar.',
    mistakes: ['Levantar muito os dedos entre notas.', 'Acelerar nas cordas mais fáceis e perder o tempo.', 'Polegar a apertar demasiado: relaxa.'],
  },
  // ---------------- Módulo 4
  {
    id: 'l4-1',
    moduleId: 'm4',
    title: 'Os primeiros acordes: Em, Am e E',
    minutes: 15,
    objective: 'Tocar Em, Am e E com todas as notas a soar limpas.',
    prerequisites: ['l2-2'],
    explanation: [
      'Um acorde é um conjunto de notas tocadas em simultâneo. Nos diagramas, as linhas verticais são as cordas (6.ª à esquerda), as horizontais são os trastos, os círculos são dedos e os números indicam qual dedo usar.',
      '«O» por cima de uma corda significa corda solta (toca-se); «X» significa que essa corda não se toca.',
      'Em usa só dois dedos. E é igual ao Em mais o indicador na 1.ª casa da 3.ª corda. Am tem a mesma forma do E, uma corda abaixo.',
      'Verifica cada acorde corda a corda: toca uma de cada vez e ajusta o dedo que estiver a abafar.',
    ],
    demo: { kind: 'chords', chordIds: ['Em', 'E', 'Am'], caption: 'Repara como E e Am têm a mesma forma em cordas diferentes.' },
    practice: {
      steps: ['Forma o Em, toca corda a corda e corrige.', 'Repete com E e com Am.', 'Alterna Em → E → Em: só muda um dedo.', 'Alterna E → Am: move a forma inteira uma corda.'],
      exerciseId: 'acordes-abertos',
    },
    completion: 'Consigo formar Em, Am e E e todas as cordas soam sem ruídos.',
    mistakes: ['Tocar a 6.ª corda no Am (começa na 5.ª).', 'A palma da mão a encostar à 1.ª corda e a abafá-la.', 'Dedos longe do trasto: precisam de mais força e soam pior.'],
  },
  {
    id: 'l4-2',
    moduleId: 'm4',
    title: 'D e A — e as primeiras mudanças',
    minutes: 15,
    objective: 'Tocar D e A e mudar entre os dois de forma fluida.',
    prerequisites: ['l4-1'],
    explanation: [
      'O D toca-se só nas quatro cordas mais agudas; o A nas cinco. Verificar onde começa a palhetada é tão importante como os dedos.',
      'Mudar de acorde é uma competência à parte. Treina-a de forma isolada: forma o primeiro acorde, levanta os dedos e forma o segundo, sem tocar. Só depois juntas o som.',
      'Procura dedos-guia: dedos que ficam na mesma corda ou só deslizam. Entre A e D não há nenhum em comum, por isso pensa no movimento como um todo.',
      'O exercício «mudanças num minuto» é uma forma simples de medir progresso: conta quantas mudanças limpas fazes em 60 segundos e tenta melhorar ao longo dos dias.',
    ],
    demo: { kind: 'chords', chordIds: ['D', 'A'], caption: 'D (só quatro cordas) e A (cinco cordas).' },
    practice: {
      steps: ['Forma D, depois A, sem tocar, dez vezes.', 'Agora toca uma vez cada acorde e muda.', 'Faz «Mudanças num minuto» com o par A ↔ D e regista o resultado.', 'Repete amanhã: o número sobe com prática espaçada.'],
      exerciseId: 'mudancas',
    },
    completion: 'Consigo fazer pelo menos 20 mudanças limpas A ↔ D num minuto.',
    mistakes: ['Tocar todas as cordas no D.', 'Olhar para cada dedo individualmente: pensa no acorde como uma forma.', 'Parar o ritmo para mudar: é melhor tocar uma corda solta do que parar.'],
  },
  {
    id: 'l4-3',
    moduleId: 'm4',
    title: 'G e C — completar os acordes abertos',
    minutes: 20,
    objective: 'Tocar G e C e encadear G – C – D – Em.',
    prerequisites: ['l4-2'],
    explanation: [
      'G e C pedem mais abertura da mão. Mantém o polegar atrás do braço e o pulso ligeiramente mais baixo para os dedos chegarem.',
      'No C, o anelar está na 5.ª corda (3.ª casa); a 6.ª não se toca. O indicador na 2.ª corda deve deixar a 1.ª corda soar.',
      'Entre C e Am o indicador e o médio ficam no mesmo sítio: são dedos-guia. Aproveita-os.',
      'Com E, Em, A, Am, D, Dm, G e C consegues tocar uma grande parte do repertório popular.',
    ],
    demo: { kind: 'chords', chordIds: ['G', 'C', 'Dm'], caption: 'G, C e Dm completam os acordes abertos essenciais.' },
    practice: {
      steps: ['Forma G e C corda a corda.', 'Alterna C ↔ Am usando os dedos-guia.', 'Toca G – C – D – Em, quatro tempos cada, a 60 BPM.', 'Faz «Mudanças num minuto» com G ↔ C.'],
      bpm: 60,
      exerciseId: 'mudancas',
    },
    completion: 'Consigo tocar G – C – D – Em a 60 BPM, quatro tempos por acorde, sem parar.',
    mistakes: ['Abafar a 1.ª corda no C com o anelar.', 'Tocar a 6.ª corda no C.', 'Tensão no polegar ao esticar para o G.'],
  },
  // ---------------- Módulo 5
  {
    id: 'l5-1',
    moduleId: 'm5',
    title: 'Pulsação e figuras rítmicas',
    minutes: 10,
    objective: 'Contar tempos em 4/4 e reconhecer semibreve, mínima, semínima e colcheia.',
    prerequisites: [],
    explanation: [
      'A pulsação é o «batimento» regular da música — o que fazes com o pé sem pensar. O metrónomo torna-a audível.',
      'Em 4/4 há quatro tempos por compasso e a semínima vale um tempo. A mínima vale dois, a semibreve quatro e a colcheia meio tempo.',
      'Para contar colcheias diz «1 e 2 e 3 e 4 e»: os números caem no tempo, o «e» fica a meio.',
      'Ler ritmo é matemática simples: as figuras de um compasso somam sempre o número de tempos indicado.',
    ],
    demo: { kind: 'strum', caption: 'Colcheias em 4/4: oito golpes por compasso.', counts: ['1', 'e', '2', 'e', '3', 'e', '4', 'e'], strokes: ['↓', '↑', '↓', '↑', '↓', '↑', '↓', '↑'] },
    practice: {
      steps: ['Liga o metrónomo a 70 BPM e bate o pé.', 'Conta «1 2 3 4» em voz alta com o acento no 1.', 'Agora conta «1 e 2 e 3 e 4 e».', 'Faz o exercício «Figuras rítmicas».'],
      bpm: 70,
      exerciseId: 'ritmo',
    },
    completion: 'Consigo contar colcheias em voz alta a 70 BPM sem me adiantar ao metrónomo.',
    mistakes: ['Acelerar quando a música fica mais fácil.', 'Contar sem som: diz a contagem em voz alta no início.'],
  },
  {
    id: 'l5-2',
    moduleId: 'm5',
    title: 'Padrões de rasgueado em 4/4',
    minutes: 15,
    objective: 'Tocar um padrão de rasgueado constante sobre uma mudança de acordes.',
    prerequisites: ['l5-1', 'l4-1'],
    explanation: [
      'A mão direita mexe-se sempre em colcheias, para baixo nos números e para cima nos «e» — mesmo quando não toca nas cordas. Isto mantém o ritmo estável.',
      'Um padrão muito usado: ↓ ↓↑ ↑↓↑ (contado «1, 2 e, e 4 e»). No tempo 3 a mão desce no ar, sem tocar.',
      'Primeiro treina o padrão com as cordas abafadas (mão esquerda pousada sem pressionar). Depois junta um acorde, e só no fim as mudanças.',
    ],
    demo: { kind: 'strum', caption: 'Padrão base: o «·» é um movimento no ar.', counts: ['1', 'e', '2', 'e', '3', 'e', '4', 'e'], strokes: ['↓', '·', '↓', '↑', '·', '↑', '↓', '↑'] },
    practice: {
      steps: ['Metrónomo a 70 BPM. Padrão com as cordas abafadas, quatro compassos.', 'O mesmo padrão sobre Em.', 'Em (2 compassos) → Am (2 compassos), sem parar.', 'Quando estiver estável, sobe para 80 BPM.'],
      bpm: 70,
      tool: 'metronome',
    },
    completion: 'Consigo manter o padrão durante oito compassos com uma mudança de acorde, sem parar a mão direita.',
    mistakes: ['Parar a mão direita no tempo «vazio».', 'Tocar com força igual em todos os golpes: os golpes para baixo nos tempos podem ser ligeiramente mais fortes.'],
  },
  // ---------------- Módulo 6
  {
    id: 'l6-1',
    moduleId: 'm6',
    title: 'Tons, meios-tons e a escala maior',
    minutes: 15,
    objective: 'Construir a escala maior a partir da fórmula T-T-mT-T-T-T-mT e tocá-la numa corda.',
    prerequisites: ['l3-1'],
    explanation: [
      'Meio-tom = uma casa. Tom = duas casas.',
      'A escala maior segue sempre a mesma fórmula: tom, tom, meio-tom, tom, tom, tom, meio-tom.',
      'Na 5.ª corda, a partir da 3.ª casa (Dó): casas 3-5-7-8-10-12-14-15 dão Dó Ré Mi Fá Sol Lá Si Dó.',
      'A partir de qualquer nota, a mesma fórmula dá a escala maior dessa nota — é por isso que a guitarra é tão «geométrica».',
    ],
    demo: {
      kind: 'tab',
      caption: 'Escala de Dó maior numa só corda (5.ª).',
      lines: ['e|----------------------------|', 'B|----------------------------|', 'G|----------------------------|', 'D|----------------------------|', 'A|-3-5-7-8-10-12-14-15--------|', 'E|----------------------------|'],
      description: 'Na 5.ª corda, casas 3, 5, 7, 8, 10, 12, 14 e 15.',
    },
    practice: {
      steps: ['Toca a escala de Dó na 5.ª corda dizendo os nomes.', 'Aplica a fórmula a partir de Sol (6.ª corda, 3.ª casa).', 'Faz o exercício «Notas nas cordas graves».'],
      exerciseId: 'notas-graves',
    },
    completion: 'Consigo construir a escala maior a partir de qualquer nota da 6.ª ou 5.ª corda usando a fórmula.',
    mistakes: ['Esquecer os meios-tons entre o 3.º–4.º e o 7.º–8.º graus.', 'Decorar casas sem perceber a fórmula.'],
  },
  {
    id: 'l6-2',
    moduleId: 'm6',
    title: 'Como se forma um acorde',
    minutes: 15,
    objective: 'Explicar a diferença entre acordes maiores e menores e encontrar as suas notas.',
    prerequisites: ['l6-1', 'l4-1'],
    explanation: [
      'Uma tríade tem três notas: fundamental, terceira e quinta.',
      'Maior: terceira maior (4 meios-tons) + quinta perfeita (7). Menor: terceira menor (3 meios-tons) + quinta perfeita.',
      'Por isso E e Em diferem numa só nota: o Sol♯ (E) passa a Sol (Em). Experimenta: no E, levanta o indicador.',
      'Nos acordes abertos as notas repetem-se em várias oitavas, mas as notas diferentes são sempre só três (ou quatro, nos acordes com sétima).',
    ],
    demo: { kind: 'chords', chordIds: ['E', 'Em', 'A', 'Am'], caption: 'Maior vs. menor: muda apenas a terceira.' },
    practice: {
      steps: ['Toca E e Em alternadamente e ouve a diferença de carácter.', 'Faz o mesmo com A e Am.', 'Faz o exercício «Notas dos acordes».'],
      exerciseId: 'teoria-triades',
    },
    completion: 'Consigo dizer as três notas de C, G, Am e Em.',
    mistakes: ['Pensar que «menor» quer dizer «mais pequeno» ou «mais grave»: refere-se ao intervalo de terceira.'],
  },
  {
    id: 'l6-3',
    moduleId: 'm6',
    title: 'Intervalos de ouvido',
    minutes: 10,
    objective: 'Reconhecer de ouvido e no braço os intervalos de 2.ª maior, 3.ª maior e menor, 4.ª, 5.ª e oitava.',
    prerequisites: ['l6-1'],
    explanation: [
      'Um intervalo é a distância entre duas notas. No braço, cada intervalo tem uma forma fixa.',
      'Na mesma corda: 2.ª maior = 2 casas, 3.ª menor = 3, 3.ª maior = 4, 4.ª perfeita = 5, 5.ª perfeita = 7, oitava = 12.',
      'Associar a melodias conhecidas ajuda, mas o mais fiável é cantar as notas e tocá-las.',
      'Se não puderes ouvir som, o exercício mostra as notas escritas: calcula a distância em meios-tons.',
    ],
    demo: { kind: 'fretboard', caption: 'Na mesma corda, cada casa é meio-tom.', strings: [5], maxFret: 12 },
    practice: { steps: ['Toca 5.ª corda solta e 7.ª casa: quinta perfeita.', 'Solta e 12.ª casa: oitava.', 'Faz o exercício «Intervalos básicos».'], exerciseId: 'intervalos' },
    completion: 'Acerto pelo menos 6 de 8 intervalos no exercício.',
    mistakes: ['Confundir 4.ª e 5.ª: a 5.ª soa mais «aberta» e estável.'],
  },
  // ---------------- Módulo 7
  {
    id: 'l7-1',
    moduleId: 'm7',
    title: 'Campo harmónico: os graus I, IV e V',
    minutes: 15,
    objective: 'Encontrar os acordes de uma tonalidade e reconhecer os graus I, IV, V e vi.',
    prerequisites: ['l6-2'],
    explanation: [
      'Construindo uma tríade sobre cada nota da escala maior obtém-se o campo harmónico: I, ii, iii, IV, V, vi e vii°.',
      'Os graus I, IV e V são maiores; ii, iii e vi são menores; vii° é diminuto.',
      'Em Sol maior: G (I), Am (ii), Bm (iii), C (IV), D (V), Em (vi). Com G, C, D e Em tocas centenas de canções.',
      'Saber os graus permite transpor: a mesma progressão I–IV–V em Lá é A–D–E.',
    ],
    demo: { kind: 'chords', chordIds: ['G', 'C', 'D', 'Em'], caption: 'Sol maior: I – IV – V – vi.' },
    practice: { steps: ['Toca I–IV–V–I em Sol (G–C–D–G), quatro tempos cada.', 'Transpõe para Lá (A–D–E–A).', 'Faz o exercício «Acordes de uma tonalidade».'], exerciseId: 'teoria-tonalidades', bpm: 70 },
    completion: 'Consigo dizer e tocar I, IV, V e vi em Sol e em Dó.',
    mistakes: ['Confundir o vi (menor) com o VI.'],
  },
  {
    id: 'l7-2',
    moduleId: 'm7',
    title: 'A progressão I – V – vi – IV',
    minutes: 15,
    objective: 'Tocar a progressão I–V–vi–IV em Sol e em Dó com rasgueado.',
    prerequisites: ['l7-1', 'l5-2'],
    explanation: [
      'I–V–vi–IV é uma das progressões mais comuns na música popular. Em Sol: G – D – Em – C. Em Dó: C – G – Am – F (usa Fmaj7 ou o F simplificado se ainda não fazes pestana).',
      'Treina primeiro as mudanças difíceis isoladamente (por exemplo Em → C e C → G).',
      'Quando a progressão estiver fluida, experimenta cantar uma melodia por cima: é assim que se acompanha.',
    ],
    demo: { kind: 'chords', chordIds: ['G', 'D', 'Em', 'C'], caption: 'I – V – vi – IV em Sol.' },
    practice: { steps: ['Metrónomo a 70 BPM: um compasso de 4 tempos por acorde.', 'Usa o padrão de rasgueado da lição de ritmo.', 'Toca a progressão quatro vezes seguidas sem parar.', 'Repete em Dó com Fmaj7.'], bpm: 70, tool: 'metronome' },
    completion: 'Consigo tocar G – D – Em – C quatro vezes seguidas a 70 BPM sem parar.',
    mistakes: ['Parar entre acordes: antecipa a mudança no último «e» do compasso.'],
  },
  // ---------------- Módulo 8
  {
    id: 'l8-1',
    moduleId: 'm8',
    title: 'Primeira melodia: «Ode à Alegria»',
    minutes: 15,
    objective: 'Tocar o tema da «Ode à Alegria» (Beethoven, domínio público) nas cordas 1 e 2.',
    prerequisites: ['l3-1'],
    explanation: [
      'Esta melodia usa apenas cinco notas: Dó, Ré, Mi, Fá e Sol — todas na primeira posição, nas cordas 1 e 2.',
      'Lê a tablatura da esquerda para a direita. Cada número é a casa; a linha indica a corda.',
      'Toca devagar e mantém os dedos perto das cordas. Usa o dedo da casa (1.ª casa = indicador, 3.ª casa = anelar).',
    ],
    demo: {
      kind: 'tab',
      caption: '«Ode à Alegria» — primeira frase (Beethoven, domínio público).',
      lines: ['e|-0-0-1-3-3-1-0---------0-0-----|', 'B|---------------3-1-1-3-----3-3-|', 'G|-------------------------------|', 'D|-------------------------------|', 'A|-------------------------------|', 'E|-------------------------------|'],
      description: 'Mi Mi Fá Sol Sol Fá Mi Ré Dó Dó Ré Mi Mi Ré Ré. Mi = 1.ª corda solta, Fá = 1.ª corda casa 1, Sol = 1.ª corda casa 3, Ré = 2.ª corda casa 3, Dó = 2.ª corda casa 1.',
    },
    practice: { steps: ['Toca as primeiras sete notas até soarem fluidas.', 'Junta o resto da frase.', 'Com metrónomo a 70 BPM, uma nota por tempo (as duas últimas valem dois tempos).'], bpm: 70 },
    completion: 'Consigo tocar a primeira frase inteira a 70 BPM sem parar.',
    mistakes: ['Usar o indicador para a 3.ª casa: obriga a saltar.'],
  },
  {
    id: 'l8-2',
    moduleId: 'm8',
    title: 'Riff com power chords',
    minutes: 15,
    objective: 'Tocar um riff original com E5, G5 e A5, abafando as cordas que não soam.',
    prerequisites: ['l4-1', 'l5-1'],
    explanation: [
      'O power chord tem só a fundamental e a quinta (às vezes a oitava). Não é maior nem menor, por isso serve em muitos contextos — sobretudo rock.',
      'A forma é móvel: fundamental na 6.ª corda com o indicador, quinta e oitava duas casas acima com anelar e mindinho.',
      'Abafa as restantes cordas: a ponta do indicador encosta levemente à 5.ª corda e a palma da mão direita repousa junto à ponte.',
    ],
    demo: {
      kind: 'tab',
      caption: 'Riff original em Mi (dois tempos por acorde).',
      lines: ['e|--------------------|', 'B|--------------------|', 'G|--------------------|', 'D|-2-2---5-5---7-7----|', 'A|-2-2---5-5---7-7----|', 'E|-0-0---3-3---5-5----|'],
      description: 'E5 (casas 0-2-2) duas vezes, G5 (3-5-5) duas vezes, A5 (5-7-7) duas vezes, nas cordas 6, 5 e 4.',
    },
    practice: { steps: ['Forma E5, G5 e A5 individualmente.', 'Desliza entre G5 e A5 sem mudar a forma da mão.', 'Toca o riff a 80 BPM, colcheias.'], bpm: 80, tool: 'metronome' },
    completion: 'Consigo tocar o riff quatro vezes seguidas a 80 BPM sem ruído das outras cordas.',
    mistakes: ['Deixar a 3.ª corda a soar.', 'Mudar a forma da mão ao deslocar o acorde.'],
    instrumentNotes: { classical: 'No violão de nylon o efeito é menos marcante, mas é um ótimo exercício de mudança de posição.' },
  },
  {
    id: 'l8-3',
    moduleId: 'm8',
    title: 'Acompanhar com dedilhado (p-i-m-a)',
    minutes: 15,
    objective: 'Acompanhar uma progressão com um padrão de arpejo p–i–m–a.',
    prerequisites: ['l2-2', 'l4-3'],
    explanation: [
      'No arpejo as notas do acorde tocam-se uma a uma. O polegar (p) toca o baixo (a fundamental do acorde); i, m e a tocam a 3.ª, 2.ª e 1.ª cordas.',
      'O baixo muda com o acorde: no Am é a 5.ª corda, no C também a 5.ª, no G a 6.ª, no Em a 6.ª.',
      'Mantém os dedos da mão direita pousados perto das cordas que vão tocar.',
    ],
    demo: {
      kind: 'tab',
      caption: 'Arpejo p–i–m–a sobre Am e C.',
      lines: ['e|-------0-------0-|', 'B|-----1-------1---|', 'G|---2-------0-----|', 'D|-----------------|', 'A|-0-------3-------|', 'E|-----------------|'],
      description: 'Am: 5.ª corda solta, 3.ª corda casa 2, 2.ª corda casa 1, 1.ª corda solta. C: 5.ª corda casa 3, 3.ª corda solta, 2.ª corda casa 1, 1.ª corda solta.',
    },
    practice: { steps: ['Am com p–i–m–a, uma nota por tempo a 60 BPM.', 'Am → C, dois compassos cada.', 'Am – C – G – Em, com o baixo correto em cada acorde.'], bpm: 60, tool: 'metronome' },
    completion: 'Consigo dedilhar Am – C – G – Em a 60 BPM com o baixo correto.',
    mistakes: ['Polegar a tocar sempre a mesma corda.', 'Mão direita a «saltar»: os movimentos vêm dos dedos.'],
    instrumentNotes: { electric: 'Na elétrica, experimenta o captador do braço e um som limpo para os arpejos.' },
  },
  // ---------------- Módulo 9
  {
    id: 'l9-1',
    moduleId: 'm9',
    title: 'Revisão: tocar uma peça completa',
    minutes: 20,
    objective: 'Juntar acordes, ritmo e mudanças numa peça de 16 compassos.',
    prerequisites: ['l7-2'],
    explanation: [
      'Esta lição não traz conteúdo novo: serve para verificar o que já está consolidado.',
      'Peça: 4 compassos de G – D – Em – C, 4 de Am – C – G – Em em arpejo, 4 de G – D – Em – C em rasgueado, final em G.',
      'Grava-te (com o gravador do telemóvel) e ouve: é a forma mais honesta de perceber o que precisa de trabalho.',
    ],
    demo: { kind: 'chords', chordIds: ['G', 'D', 'Em', 'C', 'Am'], caption: 'Todos os acordes da peça.' },
    practice: { steps: ['Faz primeiro as revisões pendentes no dashboard.', 'Toca a peça a 60 BPM.', 'Identifica a mudança mais difícil e pratica-a isoladamente.', 'Toca de novo a 70 BPM.'], bpm: 60, tool: 'metronome' },
    completion: 'Consigo tocar a peça completa a 60 BPM sem parar.',
    mistakes: ['Repetir só o que já sai bem: dedica tempo à parte difícil.'],
  },
  {
    id: 'l9-2',
    moduleId: 'm9',
    title: 'Primeiros passos na pestana: o acorde F',
    minutes: 15,
    objective: 'Tocar o F simplificado e começar a preparar o F com pestana completa.',
    prerequisites: ['l4-3'],
    explanation: [
      'Na pestana o indicador pressiona várias cordas na mesma casa. É uma das maiores dificuldades iniciais — é normal levar semanas.',
      'Começa pelo F simplificado: o indicador cobre só a 1.ª e a 2.ª cordas na 1.ª casa.',
      'Para a pestana completa, usa o lado ósseo do indicador (rola-o ligeiramente para o lado) e puxa com o braço em vez de apertar com o polegar.',
      'Se as cordas ficarem abafadas, verifica nota a nota e ajusta só o dedo responsável.',
    ],
    demo: { kind: 'chords', chordIds: ['F-simples', 'F', 'Fmaj7'], caption: 'Três formas de tocar Fá, da mais fácil à mais difícil.' },
    practice: { steps: ['Fmaj7 → C, até estar confortável.', 'F simplificado → C.', 'Tenta a pestana completa durante 1 minuto, verificando corda a corda. Descansa.', 'Faz «Mudanças num minuto» com C ↔ F.'], exerciseId: 'mudancas' },
    completion: 'Consigo tocar o F simplificado com as quatro cordas a soar limpas.',
    mistakes: ['Apertar o polegar com força: cansa e não ajuda.', 'Indicador demasiado longe do trasto.', 'Desistir cedo: a pestana melhora com prática curta e frequente.'],
  },
];

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function lessonsOfModule(moduleId: string): Lesson[] {
  return LESSONS.filter((l) => l.moduleId === moduleId);
}
