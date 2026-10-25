# ADR 0001 — Stack e arquitetura 100% local

- **Estado**: aceite (2026-10-25)
- **Contexto**: orçamento de 0 €, offline-first, privacidade, app tem de funcionar mesmo que serviços externos mudem as condições.
- **Decisão**: SPA React 19 + TypeScript estrito + Vite, sem backend, sem base de dados remota, sem autenticação, sem IA. Tudo é processado e guardado no navegador.
- **Consequências**: custo 0 € e nenhum dado pessoal sai do dispositivo; em contrapartida não há sincronização entre dispositivos e a perda de dados depende do navegador (mitigado com exportação e `navigator.storage.persist()`).
- **Alternativas**: Preact (menor, mas menos ecossistema de testes); backend com sincronização (custos e obrigações de RGPD desnecessários para o MVP).
