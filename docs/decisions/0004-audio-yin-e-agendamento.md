# ADR 0004 — Afinador YIN e metrónomo agendado no relógio de áudio

- **Estado**: aceite (2026-10-25)
- **Afinador**: YIN implementado em TypeScript (sem dependências), janela de 4096 amostras, limiar 0,15, mediana de 5 leituras. Escolhido em vez de autocorrelação simples por ser mais robusto a erros de oitava nas cordas graves (sinal com fundamental fraca e harmónicos fortes — coberto por teste). Microfone pedido só por ação explícita e libertado ao sair.
- **Metrónomo**: padrão de agendamento antecipado (timer de 25 ms, janela de 120 ms) no `AudioContext.currentTime`; a parte visual deriva da mesma linha temporal. Não depende de `setInterval` para a pulsação.
- **Limitações**: precisão em microfones reais por validar; navegadores podem suspender áudio em segundo plano.
