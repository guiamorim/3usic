# Roadmap

## Implementado (MVP)
Ver README → Funcionalidades.

## Próximo (prioridade alta)
1. Validar o afinador em telemóveis reais (Android Chrome, iOS Safari) e ajustar limiares de clareza/RMS.
2. Testar instalação PWA e comportamento offline em iOS/Android reais.
3. Teste com leitor de ecrã (TalkBack, VoiceOver).
4. (Feito) CI no GitHub Actions: lint, tipos, testes, build, E2E e publicação.
5. Reduzir o bundle (avaliar `zod/mini`, divisão por rotas).

## Implementado depois do MVP
- Catálogo de músicas, importação de cifras (ChordPro e texto simples) e plano por música (2026-10-25).
- Melhorias da revisão (2026-10-26): pedido automático de armazenamento persistente e lembrete de cópia a cada 14 dias, ecrã de erro por página, ecrãs carregados a pedido e `zod/mini` (arranque 552 → 377 KB), navegação com 5 separadores + «Mais», ícones SVG, tokens de raio/tipo, retomar exercício interrompido, sensibilidade e diagnóstico do microfone no Tocar junto, avaliação de ritmo nas Batidas, 28 músicas conferidas.
- Modo guiado pelo plano, ecrã sempre ligado, diagramas fixos na cifra, novo visual do Início, correções de toque duplo/zoom no iOS (2026-10-25).
- Tocar junto com reconhecimento de acordes, separador Batidas, atalho para letra + colar cifra na música, afinador com Hz/histórico/modo cromático, correções de áudio no iPhone (2026-10-25).
- Rock clássico BR/PT/US/UK, filtro por país, versões simplificada e mais próxima do original, power chords móveis (2026-10-25).

## Planeado (não implementado)
- Validar o reconhecimento de acordes, a avaliação de ritmo e o afinador em iPhone/Android reais e ajustar os limiares (`THRESHOLDS` em `domain/playAlong.ts`, `OnsetDetector` em `domain/rhythm.ts`).
- Ritmo no Tocar junto (hoje só nas Batidas) e calibração explícita de latência para medir se o aluno toca adiantado/atrasado.
- Batidas de bossa nova e samba, validadas por quem as toque.
- Conferir os acordes das 4 músicas ainda sem fonte: Hallelujah, Sweet Home Chicago, The Thrill Is Gone e «Garota de Ipanema» (cifras.com.br não permitiu a consulta).
- Mais músicas brasileiras e portuguesas, com acordes confirmados por alguém que as toque.
- Editar uma cifra importada dentro da app.
- Diagramas para mais acordes (diminutos, aumentados, com nona, sétima maior) para a versão original.
- Rolagem automática da cifra ao ritmo da música.
- Afinações alternativas (Drop D, meio-tom abaixo, DADGAD) e modo cromático no afinador.
- Reconhecimento de acordes de ouvido.
- Mais lições: escalas pentatónicas, pestana com forma de A/Am, dedilhados avançados, leitura de partitura.
- Gravação local para autoavaliação (sem envio).
- Lembretes opcionais (notificações locais), sem penalizações.
- Sincronização entre dispositivos (exigiria backend: ver SECURITY.md).

## Modelo de negócio futuro (não implementar sem validação)
- Gratuito com valor real: tudo o que existe hoje.
- Premium possível: percursos intermédios/avançados, mais conteúdo, estatísticas detalhadas, personalização.
- Sem preços definidos: requer validação de mercado. Pagamentos implicam custos e rever alojamento (GitHub Pages não é destinado a negócio online).
- IA: opcional e futura; avaliar custo, privacidade, qualidade pedagógica e alternativas locais antes de qualquer integração.
