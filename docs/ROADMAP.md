# Roadmap

## Implementado (MVP)
Ver README → Funcionalidades.

## Próximo (prioridade alta)
1. Validar o afinador em telemóveis reais (Android Chrome, iOS Safari) e ajustar limiares de clareza/RMS.
2. Testar instalação PWA e comportamento offline em iOS/Android reais.
3. Teste com leitor de ecrã (TalkBack, VoiceOver).
4. CI no GitHub Actions: `npm run check` + E2E.
5. Reduzir o bundle (avaliar `zod/mini`, divisão por rotas).

## Planeado (não implementado)
- Afinações alternativas (Drop D, meio-tom abaixo, DADGAD) e modo cromático no afinador.
- Exercício de ritmo com toque em tempo real (medir desvio em relação ao metrónomo).
- Reconhecimento de acordes de ouvido.
- Mais lições: escalas pentatónicas, pestana com forma de A/Am, dedilhados avançados, leitura de partitura.
- Repertório de domínio público com acordes.
- Gravação local para autoavaliação (sem envio).
- Lembretes opcionais (notificações locais), sem penalizações.
- Sincronização entre dispositivos (exigiria backend: ver SECURITY.md).

## Modelo de negócio futuro (não implementar sem validação)
- Gratuito com valor real: tudo o que existe hoje.
- Premium possível: percursos intermédios/avançados, mais conteúdo, estatísticas detalhadas, personalização.
- Sem preços definidos: requer validação de mercado. Pagamentos implicam custos e rever alojamento (GitHub Pages não é destinado a negócio online).
- IA: opcional e futura; avaliar custo, privacidade, qualidade pedagógica e alternativas locais antes de qualquer integração.
