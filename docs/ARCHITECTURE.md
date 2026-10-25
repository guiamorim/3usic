# Arquitetura

```
UI (src/features, src/components)  ── React, rotas por hash
        │ useStore()
Store (src/app/store.tsx)           ── estado em memória + ações; grava antes de atualizar
        │ AppStorage (porta)
Persistência (src/storage)          ── IndexedDbStorage | MemoryStorage, Zod em todas as fronteiras
Domínio (src/domain)                ── funções puras: notas, teoria, SRS, plano, progressão, exercícios
Conteúdo (src/content)              ── dados estáticos: acordes, lições, rótulos
Áudio (src/audio)                   ── YIN e agendador puros + motores Web Audio
PWA                                 ── vite-plugin-pwa (Workbox generateSW, precache, registerType: prompt)
```

## Fluxo de dados
1. No arranque, `StoreProvider` abre o IndexedDB (ou memória, com aviso), lê e valida tudo.
2. Cada ação (concluir lição, resultado de exercício…) calcula o novo registo com funções do domínio, grava-o e só então atualiza o estado React.
3. O plano diário, a lição recomendada e as revisões são **derivados** do estado a cada render — não são guardados, por isso faltar dias nunca cria atrasos.

## Modelo de dados (IndexedDB `braco-guitarra`, versão 2)
| Store | Chave | Conteúdo |
|---|---|---|
| `meta` | `profile`, `settings` | perfil e preferências do metrónomo |
| `lessons` | `lessonId` | lições concluídas |
| `skills` | `skillId` | estado SRS (caixa Leitner, próxima revisão, dias aprovados) |
| `attempts` | `id` | resultados de exercícios |
| `practice` | `id` | registos de tempo de prática |
| `chordChanges` | `id` | resultados de «mudanças num minuto» |
| `planDays` | `day` | blocos do plano marcados como feitos |
| `songs` | `id` | músicas importadas (v2): metadados + cifra normalizada em ChordPro |

A versão 2 acrescenta o store `songs` (migração `oldVersion < 2` em `db.ts`) e os campos opcionais `targetSongId` e `knownChords` nas preferências. Ficheiros exportados v1 são migrados ao importar (`songs: []`).

## Navegação guiada
- `src/app/useTodayPlan.ts`: plano do dia partilhado pelo Início e pela barra guiada. `nextBlock` (em `domain/plan.ts`) escolhe o passo seguinte por fazer.
- `src/app/planFlow.ts`: passo ativo guardado em `sessionStorage` (sobrevive a navegar dentro da atividade). `src/app/PlanBar.tsx` mostra a barra «Feito · seguinte».
- `src/app/wakeLock.ts`: `useWakeLock(settings.keepAwake)`, readquire o bloqueio quando a página volta a ficar visível.
- Saída de áudio: `outputNode(ctx)` (limitador + ganho) em `audio/context.ts`, para sons mais altos nos altifalantes do telemóvel sem distorção.

## Prática com microfone e batidas
- `src/domain/chordDetect.ts`: FFT, cromagrama (130–1100 Hz, fora dos cliques do metrónomo) e `judgeChord`, que compara o acorde esperado com as 24 tríades maiores/menores (modelos com harmónicos). Verifica «é este o acorde?», não transcreve livremente.
- `src/domain/playAlong.ts`: linha do tempo em tempos (compassos do catálogo ou tempos por acorde nas cifras importadas), repetição, veredito por acorde (≥ 35 % dos frames com som reconhecidos) e pontuação.
- `src/domain/strumming.ts` + `src/content/strums.ts`: padrões de batida e agendamento de subdivisões (`collectSlots`). `src/audio/slotClock.ts` agenda sons no relógio de áudio.
- `src/audio/context.ts`: no iOS, `navigator.audioSession` passa a «playback» para o som tocar com o interruptor de silêncio ligado, e a «play-and-record» enquanto o microfone está aberto. Sem essa API, toca-se `silence.wav` no gesto do utilizador.
- `src/audio/micInput.ts`: microfone para o «Tocar junto»; o contexto de áudio é criado no clique (antes de qualquer `await`), como o iOS exige.

## Músicas
- `src/domain/chordSymbols.ts`: lê símbolos de acordes (lista de sufixos permitidos, para não confundir palavras da letra com acordes), simplifica para as qualidades da biblioteca e transpõe.
- `src/domain/chordpro.ts`: parser ChordPro e de texto simples (deteta linhas só com acordes e junta-as à letra por coluna), deteção automática de formato, limites (200 000 caracteres, 3000 linhas, 400 por linha), remoção de caracteres de controlo e serialização para ChordPro. Nada é avaliado nem inserido como HTML: o ecrã usa só nós de texto React.
- `src/domain/songPlan.ts`: acordes conhecidos (lições concluídas + marcados), acordes em falta, transições mais frequentes, sugestão de capo (procura a casa de capo 1–7 que minimiza a dificuldade das formas), andamento lento e foco do dia.
- `src/domain/songLibrary.ts`: junta catálogo e músicas importadas, filtros (incluindo país) e facetas. Cada entrada tem duas vistas: `full` (a cifra como está) e `simple` (derivada com `simplifySong`, ou definida à mão no catálogo com `simple`). `versionOf(song, settings.songVersion)` escolhe a vista usada na lista, no detalhe e no plano do dia.
- `simplifySong` (em `chordpro.ts`) passa cada acorde por `simplifySymbol`: 7M/maj7, add9, 6, sus → tríade; m7(9) → m; 7(9) → 7; diminutos/aumentados → removidos; baixo invertido → acorde sem o baixo (E/G# → E); power chords mantêm-se. Repetições seguidas são fundidas.
- `src/content/songs.ts`: catálogo (ver ADR 0006).

## Pedagogia implementada
- Progressão gradual por módulos; pré-requisitos como recomendação, não bloqueio; ponto de partida ajustado à experiência.
- Prática deliberada: cada lição tem objetivo, passos, critério de conclusão observável e erros comuns.
- Recuperação ativa e feedback imediato com explicação em todos os exercícios.
- Repetição espaçada (Leitner: 1, 3, 7, 14, 30 dias). Uma competência só sobe uma caixa por dia; «dominado» exige ≥ 4 dias aprovados. Uma pontuação alta isolada não conta como domínio.
- Prática intercalada nas revisões (perguntas de várias competências misturadas).
- Plano diário: aquecimento, revisão, técnica, conteúdo novo e aplicação musical, proporcional ao tempo disponível.

## Áudio
- **Afinador**: `getUserMedia` (sem cancelamento de eco/ruído/AGC) → `AnalyserNode` (4096 amostras) → YIN com limiar 0,15 e interpolação parabólica → mediana de 5 leituras → corda mais próxima e cents. Gate por RMS para silêncio; aviso de ruído após 1,5 s sem altura definida.
- **Metrónomo**: temporizador de 25 ms agenda cliques 120 ms à frente no relógio do `AudioContext`; a indicação visual lê a mesma linha temporal em `requestAnimationFrame`.

## PWA e offline
Precache de todos os ficheiros da build (~480 KB). Navegação cai em `index.html`. Atualizações não são aplicadas automaticamente: o utilizador vê «Há uma nova versão» e escolhe quando recarregar. O progresso está no IndexedDB, independente da cache do service worker.
