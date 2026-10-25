# ADR 0003 — Router próprio por hash

- **Estado**: aceite (2026-10-25)
- **Decisão**: rotas `#/...` com um hook de ~30 linhas em vez de React Router.
- **Motivo**: funciona em qualquer alojamento estático e numa subpasta sem regras de reescrita, funciona offline com o service worker e evita uma dependência.
- **Consequências**: URLs com `#`; sem carregamento de dados por rota (não é necessário).
