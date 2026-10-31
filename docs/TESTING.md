# Testes

## Comandos
| Comando | O que corre |
|---|---|
| `npm run lint` | ESLint (typescript-eslint strict, react-hooks, regras anti-XSS) |
| `npm run typecheck` | `tsc --noEmit` em modo estrito |
| `npm test` | Vitest: `tests/unit` e `tests/integration` (jsdom + fake-indexeddb) |
| `npm run build` | build de produção + service worker |
| `npm run test:e2e` | Playwright em Chromium (perfil Pixel 7 e desktop) sobre `npm run preview`; inclui acessibilidade com axe |
| `npm audit` | vulnerabilidades conhecidas nas dependências |

## Resultados da última execução (2026-10-25, ambiente Linux, Node 22, Chromium do Playwright 1.63)
- Lint: 0 problemas. Typecheck: 0 erros. Build: sucesso (JS principal ~500 KB, ~153 KB gzip).
- Vitest: 283 testes a passar.
- Playwright: 28 testes a passar (14 cenários × 2 perfis: telemóvel e desktop).
- axe-core (WCAG 2.0/2.1/2.2 A e AA): 0 violações em 19 páginas (modo claro) e 5 páginas (modo escuro).
- `npm audit`: 0 vulnerabilidades.

## Cobertura funcional
**Unitários**: frequência ↔ nota e cents; notas no braço; corda mais próxima; YIN com sinusoides, harmónicos, ruído, silêncio, 44,1/48 kHz; agendador do metrónomo (intervalos exatos, acentos, sem duplicar/saltar batidas, recuperação após atraso, tap tempo); teoria (ortografia de tríades/escalas, campo harmónico); correção musical dos 55 acordes (notas soadas = notas do acorde, baixo = fundamental, dedos coerentes, pestanas); geradores de exercícios (respostas corretas, opções únicas, determinismo); SRS (sem subir no mesmo dia, domínio só com consistência, descidas); progressão de lições; plano diário (soma de minutos, sem acumular atrasos); estatísticas.
**Músicas (unitários)**: reconhecimento e transposição de símbolos de acordes; parser ChordPro (metadados, secções, segmentos, limites, caracteres de controlo, ida e volta); parser de texto simples (linhas de acordes, junção por coluna, cabeçalhos, secções, tablatura); deteção de formato; plano por música (acordes em falta, transições, sugestão de capo, andamento); catálogo (metadados válidos, só acordes reconhecidos, folhas de domínio público sem avisos, todos os acordes da versão simplificada têm diagrama, a simplificada nunca tem mais acordes do que a original, pelo menos 5 rocks conferidos por país BR/PT/US/UK); simplificação de símbolos (notação brasileira 7M, 4, 9, 5+, º); filtros (incluindo país).
**Prática guiada (unitários)**: FFT; reconhecimento de acordes com sinais sintéticos de guitarra (9 acordes aceites, 8 confusões típicas rejeitadas — G/Em, C/Am, E/Em…, ruído e silêncio rejeitados); linha do tempo do Tocar junto, repetição, veredito e pontuação; padrões de batida coerentes e agendamento sem saltos; YIN com limiar de recurso e seguidor suavizado.
**Integração**: IndexedDB — migração v1→v2 sem perda de dados, músicas guardadas/apagadas, ficheiros de exportação v1 aceites; persistência após fechar/reabrir, rejeição de dados inválidos, registos corrompidos ignorados sem apagar, substituição atómica, apagar tudo; export/import ida e volta e rejeições; componentes (diagrama acessível, quiz, onboarding, aviso sem armazenamento).
**Revisão 2026-10-26 (unitários/integração)**: lembrete de cópia (primeiro aviso, 14 dias, adiar); deteção de ataques com blocos partidos; relatório de ritmo (desconto de latência, acelerar, golpes falhados, dados insuficientes); níveis de sensibilidade; rascunho de quiz (mesmo dia, inválido, outro dia); retomar no QuizRunner; ecrã de erro do ErrorBoundary; mensagens de importação em pt-PT com `zod/mini`.

**Alterações 2026-10-31**: unitários do rasto de navegação (`step`), da síntese de corda (afinação a ±3 cents medida com YIN, decaimento) e integração do «Ecrã ligado» (novo pedido ao tocar após recusa, novo pedido após libertação pelo sistema). E2E: voltar da lição→exercício regressa à lição na mesma posição; «Voltar ao passo» no modo guiado; voltar de uma canção infantil regressa à secção; varrimento de 19 ecrãs a 320 px com texto a 100% e 130% sem transbordos. Última execução: 372 unitários/integração e 56 E2E a passar.

**E2E**: 5 separadores e página «Mais»; retomar exercício após recarregar; modo guiado (passo seguinte, barra persiste, sair), «Ecrã ligado» guardado, acordes fixos na cifra; próxima lição no fim do exercício; Batidas (tocar, cursor, parar); Tocar junto sem e com microfone (microfone libertado ao parar); colar cifra com letra numa música do catálogo; músicas (filtros por estilo/país/época/artista, alternar versão simplificada/original com persistência, marcar acorde conhecido, transpor, música objetivo no plano, mudança sugerida); importar cifra em texto simples e em ficheiro ChordPro, apagar, sem pedidos externos; onboarding → lição → exercício → progresso → fechar e reabrir; plano persistente; pesquisa de acordes; mudanças num minuto com validação; metrónomo (pulsação visual, BPM, pausa); microfone recusado (alternativa) e autorizado (microfone libertado ao sair); exportar, ficheiro inválido, apagar com confirmação, importar com confirmação; manifest e funcionamento offline após o primeiro carregamento; 0 pedidos a terceiros.

## O que não foi testado (limitações do ambiente)
- Microfones reais e precisão do afinador em dispositivos físicos (só sinais sintéticos e o microfone falso do Chromium).
- Safari/iOS e Firefox (só Chromium está disponível no ambiente).
- Instalação real da PWA num dispositivo e comportamento em segundo plano.
- Leitores de ecrã reais (VoiceOver, TalkBack, NVDA).
- Exatidão temporal do metrónomo medida no áudio de saída (a lógica é testada; o áudio real não).
