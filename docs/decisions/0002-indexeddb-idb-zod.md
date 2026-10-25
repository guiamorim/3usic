# ADR 0002 — IndexedDB com `idb` e validação com Zod

- **Estado**: aceite (2026-10-25)
- **Contexto**: progresso estruturado, robusto a corrupção e a ficheiros importados maliciosos.
- **Decisão**: IndexedDB via `idb` (wrapper fino, ISC) com uma store por entidade; Zod (`.strict()`) como fonte única dos tipos e validação em todas as fronteiras (gravar, ler, importar). Uma porta `AppStorage` com adaptadores IndexedDB e memória.
- **Consequências**: dados inválidos nunca entram no estado; registos corrompidos são ignorados e reportados (não apagados). Zod pesa ~50 KB gzip — candidato a `zod/mini`.
- **Alternativas**: `localStorage` (síncrono, limite pequeno, sem transações); Dexie (mais pesado); validação manual (mais propensa a erros).
