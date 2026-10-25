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
- Lint: 0 problemas. Typecheck: 0 erros. Build: sucesso (JS principal ~440 KB, ~135 KB gzip).
- Vitest: 215 testes a passar.
- Playwright: 22 testes a passar (11 cenários × 2 perfis: telemóvel e desktop).
- axe-core (WCAG 2.0/2.1/2.2 A e AA): 0 violações em 14 páginas (modo claro) e 3 páginas (modo escuro).
- `npm audit`: 0 vulnerabilidades.

## Cobertura funcional
**Unitários**: frequência ↔ nota e cents; notas no braço; corda mais próxima; YIN com sinusoides, harmónicos, ruído, silêncio, 44,1/48 kHz; agendador do metrónomo (intervalos exatos, acentos, sem duplicar/saltar batidas, recuperação após atraso, tap tempo); teoria (ortografia de tríades/escalas, campo harmónico); correção musical dos 37 acordes (notas soadas = notas do acorde, baixo = fundamental, dedos coerentes, pestanas); geradores de exercícios (respostas corretas, opções únicas, determinismo); SRS (sem subir no mesmo dia, domínio só com consistência, descidas); progressão de lições; plano diário (soma de minutos, sem acumular atrasos); estatísticas.
**Integração**: IndexedDB — persistência após fechar/reabrir, rejeição de dados inválidos, registos corrompidos ignorados sem apagar, substituição atómica, apagar tudo; export/import ida e volta e rejeições; componentes (diagrama acessível, quiz, onboarding, aviso sem armazenamento).
**E2E**: onboarding → lição → exercício → progresso → fechar e reabrir; plano persistente; pesquisa de acordes; mudanças num minuto com validação; metrónomo (pulsação visual, BPM, pausa); microfone recusado (alternativa) e autorizado (microfone libertado ao sair); exportar, ficheiro inválido, apagar com confirmação, importar com confirmação; manifest e funcionamento offline após o primeiro carregamento; 0 pedidos a terceiros.

## O que não foi testado (limitações do ambiente)
- Microfones reais e precisão do afinador em dispositivos físicos (só sinais sintéticos e o microfone falso do Chromium).
- Safari/iOS e Firefox (só Chromium está disponível no ambiente).
- Instalação real da PWA num dispositivo e comportamento em segundo plano.
- Leitores de ecrã reais (VoiceOver, TalkBack, NVDA).
- Exatidão temporal do metrónomo medida no áudio de saída (a lógica é testada; o áudio real não).
