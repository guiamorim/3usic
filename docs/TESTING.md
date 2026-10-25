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
**Integração**: IndexedDB — migração v1→v2 sem perda de dados, músicas guardadas/apagadas, ficheiros de exportação v1 aceites; persistência após fechar/reabrir, rejeição de dados inválidos, registos corrompidos ignorados sem apagar, substituição atómica, apagar tudo; export/import ida e volta e rejeições; componentes (diagrama acessível, quiz, onboarding, aviso sem armazenamento).
**E2E**: músicas (filtros por estilo/país/época/artista, alternar versão simplificada/original com persistência, marcar acorde conhecido, transpor, música objetivo no plano, mudança sugerida); importar cifra em texto simples e em ficheiro ChordPro, apagar, sem pedidos externos; onboarding → lição → exercício → progresso → fechar e reabrir; plano persistente; pesquisa de acordes; mudanças num minuto com validação; metrónomo (pulsação visual, BPM, pausa); microfone recusado (alternativa) e autorizado (microfone libertado ao sair); exportar, ficheiro inválido, apagar com confirmação, importar com confirmação; manifest e funcionamento offline após o primeiro carregamento; 0 pedidos a terceiros.

## O que não foi testado (limitações do ambiente)
- Microfones reais e precisão do afinador em dispositivos físicos (só sinais sintéticos e o microfone falso do Chromium).
- Safari/iOS e Firefox (só Chromium está disponível no ambiente).
- Instalação real da PWA num dispositivo e comportamento em segundo plano.
- Leitores de ecrã reais (VoiceOver, TalkBack, NVDA).
- Exatidão temporal do metrónomo medida no áudio de saída (a lógica é testada; o áudio real não).
