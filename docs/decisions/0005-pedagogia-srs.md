# ADR 0005 — Repetição espaçada tipo Leitner e domínio por consistência

- **Estado**: aceite (2026-10-25)
- **Decisão**: cada exercício corresponde a uma competência com caixa Leitner 0–5 (intervalos 0/1/3/7/14/30 dias). ≥ 80% sobe uma caixa, no máximo uma vez por dia; < 60% desce duas caixas (mín. 1) e revê amanhã. «Dominado» = caixa ≥ 4, ≥ 4 dias aprovados e último resultado ≥ 80%.
- **Motivo**: o prompt exige não confundir uma pontuação alta isolada com domínio. Leitner é simples, explicável ao utilizador e testável. SM-2/FSRS seriam mais finos mas mais opacos para um MVP.
- **Plano diário** é recalculado a cada dia a partir do estado, sem acumular atrasos nem «sequências quebradas».
- **Conclusão de lições** é autoavaliada (o critério é observável, mas não verificável pela app); por isso o domínio vem só dos exercícios.
