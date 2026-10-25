# CLAUDE.md — Braço (PWA de aprendizagem de guitarra e violão)

## Objetivo e âmbito
MVP de uma PWA offline-first para principiantes aprenderem guitarra/violão: onboarding, dashboard com plano diário, currículo de 9 módulos (21 lições), exercícios com repetição espaçada, biblioteca de acordes, músicas (catálogo + importação de cifras ChordPro/texto + plano por música), afinador (microfone, processamento local), metrónomo, progresso local e export/import JSON. Sem conta, sem backend, sem IA, custo obrigatório 0 €. Interface em português europeu.

## Stack
React 19 · TypeScript estrito · Vite 8 · vite-plugin-pwa (Workbox, `generateSW`) · IndexedDB via `idb` · validação com `zod` · Web Audio API · Vitest + Testing Library + fake-indexeddb · Playwright + axe-core · ESLint (typescript-eslint strict + react-hooks).

## Comandos
```
npm install          # dependências
npm run dev          # servidor de desenvolvimento (sem service worker)
npm run build        # tsc + build de produção em dist/
npm run preview      # serve dist/ em http://localhost:4173
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm test             # unitários + integração (Vitest)
npm run test:e2e     # Playwright (faz build antes: usa `npm run preview`)
npm run check        # lint + typecheck + test + build
npm run icons        # regenera os PNG de public/icons a partir do SVG
```
Os testes E2E correm sobre `dist/`: corre `npm run build` antes de `npm run test:e2e`.

## Estrutura
- `src/domain/` — regras puras e testáveis: notas/frequências, guitarra, teoria (ortografia correta de notas), exercícios (geradores determinísticos com RNG), SRS (Leitner), progressão, plano diário, estatísticas.
- `src/content/` — conteúdo original: acordes, currículo, rótulos, catálogo de músicas.
- `src/domain/chordSymbols.ts`, `chordpro.ts`, `songPlan.ts`, `songLibrary.ts` — músicas: símbolos, parser/serializador, plano, catálogo+importadas.
- `src/audio/` — YIN (`pitch.ts`), agendador do metrónomo (puro), motores Web Audio (`tuner.ts`, `metronome.ts`, `synth.ts`).
- `src/storage/` — esquemas Zod (fonte única de verdade), IndexedDB/memória, export/import.
- `src/app/` — store (React context), router por hash, layout, prompt de atualização.
- `src/features/` — ecrãs. `src/components/` — diagramas SVG e componentes partilhados.
- `tests/unit`, `tests/integration`, `tests/e2e`. `docs/` — documentação e ADRs.

## Regras de segurança
- Nunca usar `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function` (bloqueado por ESLint).
- Todo o dado lido do IndexedDB ou importado passa por `zod` (`.strict()`); dados inválidos são ignorados e reportados, nunca apagados em silêncio.
- Importação: limite 5 MB, só `JSON.parse`, confirmação antes de substituir, transação única.
- Microfone só por ação explícita; libertado ao sair da página/separador. Áudio nunca é gravado nem enviado.
- CSP restritiva injetada na build (`vite.config.ts`). Nenhum pedido a terceiros (verificado em E2E).

## Regras de conteúdo
- Nunca incluir letras ou cifras completas de músicas protegidas em `src/content`: só metadados e progressão de acordes. Letra completa só para domínio público. Músicas importadas ficam no dispositivo (ADR 0006).

## Regras de custo zero
- Nada de serviços pagos, APIs de IA, analytics, fontes externas ou CDNs. Dependências só open source.
- Publicar/alojar requer autorização expressa do utilizador. A app tem de continuar a funcionar com `npm run build && npm run preview` sem qualquer serviço externo.

## Convenções
- Lógica nova vai para `src/domain` como função pura, com testes. Componentes finos.
- Texto de interface em pt-PT; comentários de código em inglês.
- Escritas: `persist()` no store grava primeiro e só depois atualiza o estado.
- Novas versões do esquema: incrementar `DB_VERSION`/`SCHEMA_VERSION`, acrescentar migração em `db.ts` (upgrade) e em `exportImport.ts` (`migrate`).

## Decisões
Ver `docs/decisions/` (ADR 0001–0006).

## Estado atual (2026-10-25)
Todas as funcionalidades do MVP implementadas e testadas automaticamente. Publicado em https://guiamorim.github.io/3usic/ (GitHub Pages, deploy automático no push para `main`). Músicas e importação de cifras acrescentadas (esquema v2). 80 músicas, versões simplificada/original (`settings.songVersion`), filtro por país. Tocar junto (`#/musicas/:id/tocar`, reconhecimento de acordes), separador Batidas (`#/batidas`), letra via cifra colada pelo utilizador (`UserSong.catalogId`). Modo guiado (`PlanBar`, `planFlow`), `settings.keepAwake` (wake lock). Não validado: afinador com microfones reais em vários dispositivos; instalação em iOS/Android reais; leitores de ecrã reais (só axe automático).

## Limitações conhecidas
Ver `docs/ROADMAP.md` e `README.md` (secção Limitações).

## Próximas tarefas
1. Testar afinador, metrónomo e Tocar junto em telemóveis reais (Android/iOS) e ajustar limiares.
2. Conferir acordes das músicas sem `chordSource` (internacionais antigas, Garota de Ipanema).
3. Cabeçalhos de segurança: GitHub Pages não permite configurá-los (CSP vai em meta).
4. Reduzir bundle (avaliar `zod/mini`).
