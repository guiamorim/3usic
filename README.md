# Braço — aprender guitarra e violão

PWA para aprender guitarra elétrica, guitarra acústica e violão (aço ou nylon). Funciona offline depois do primeiro carregamento, não pede conta e guarda o progresso apenas no dispositivo.

## Funcionalidades (implementadas)
- **Onboarding**: instrumento, experiência, objetivo, géneros, tempo por sessão e dias por semana (editáveis depois).
- **Hoje**: plano diário (aquecimento, revisão, técnica, conteúdo novo, aplicação), lição recomendada, revisões pendentes, tempo de prática, acesso ao afinador e metrónomo.
- **Aprender**: 9 módulos, 21 lições originais. Cada lição tem objetivo, pré-requisitos (recomendados, não bloqueantes), explicação, demonstração (diagramas, tablatura, padrões de rasgueado), prática, critério de conclusão, erros comuns e próxima atividade.
- **Praticar**: 9 exercícios de escolha múltipla com feedback e explicação (cordas, notas, acordes, intervalos com áudio e alternativa visual, ritmo, teoria) + «mudanças de acordes num minuto». Repetição espaçada (Leitner); «dominado» só após bons resultados em ≥ 4 dias diferentes.
- **Acordes**: 37 acordes pesquisáveis com diagrama, cordas abertas/abafadas, dedos, pestana, notas, dificuldade, transições e relacionados. A correção musical de cada diagrama é verificada por testes.
- **Afinador**: microfone com autorização explícita, deteção YIN local, nota/corda/cents, baixo/afinado/alto, avisos de ruído, tratamento de recusa e sons de referência como alternativa.
- **Metrónomo**: 30–240 BPM, 2/4, 3/4, 4/4, 6/8, acento, volume, tap tempo, agendado no relógio de áudio com indicação visual.
- **Dados**: exportar/importar JSON validado, apagar tudo (confirmação escrita), pedido de armazenamento persistente.

## Requisitos
Node.js ≥ 20 (testado com 22) e npm. Para testes E2E: Chromium do Playwright (`npx playwright install chromium` se ainda não o tiveres).

## Instalar e executar
```bash
npm install
npm run dev            # desenvolvimento: http://localhost:5173
npm run build          # produção em dist/
npm run preview        # serve dist/ em http://localhost:4173 (inclui service worker)
```
O microfone só funciona em HTTPS ou `localhost`. Para testar num telemóvel na rede local é preciso HTTPS (ver `docs/DEPLOY.md`).

## Testes
```bash
npm run check          # lint + tipos + unitários/integração + build
npm run test:e2e       # E2E e acessibilidade (requer build)
```
Detalhes em [docs/TESTING.md](docs/TESTING.md).

## Instalar como app
Em Chrome/Edge (Android, Windows, macOS, Linux): menu → «Instalar aplicação». Em iOS/iPadOS (Safari): Partilhar → «Adicionar ao ecrã principal». A instalação requer que a app seja servida por HTTPS.

## Limitações
- O afinador foi testado com sinais sintéticos e com o microfone simulado do Chromium, **não** com microfones reais em vários dispositivos.
- Instalação PWA não foi testada em dispositivos iOS/Android reais.
- Acessibilidade verificada com axe (0 violações nas páginas testadas); não houve teste com leitores de ecrã reais.
- O progresso vive no navegador: limpar dados do site apaga-o. Exporta regularmente.
- O metrónomo pode atrasar ou parar em segundo plano/ecrã bloqueado (comportamento dos navegadores).
- Só afinação padrão; sem gravação de áudio; sem sincronização entre dispositivos.
- Conclusão de lições é autoavaliada (caixa de confirmação); o domínio é medido pelos exercícios.

## Documentação
[Arquitetura](docs/ARCHITECTURE.md) · [Custos](docs/COSTS.md) · [Segurança e privacidade](docs/SECURITY.md) · [Testes](docs/TESTING.md) · [Publicação](docs/DEPLOY.md) · [Roadmap](docs/ROADMAP.md) · [Decisões](docs/decisions/)

## Licenças de conteúdo
Lições, exercícios, riffs e textos são originais deste projeto. A «Ode à Alegria» (Beethoven) é domínio público.
