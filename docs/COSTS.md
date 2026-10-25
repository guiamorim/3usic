# Custos, limites e riscos

Última verificação: 2026-10-25. Legenda: **Verificado** = confirmado na documentação oficial nesta data; **Estimativa**; **Por confirmar**.

## Matriz

| Componente | Solução | Condições gratuitas verificadas | Limites | Custo obrigatório | Risco | Alternativa |
|---|---|---|---|---|---|---|
| Desenvolvimento | Node.js, npm, Vite, TypeScript, ESLint, Vitest, Playwright, axe-core | Software open source (MIT, Apache-2.0, MPL-2.0, ISC, BSD). Licenças lidas do `package-lock.json` — **Verificado** | Nenhum | 0 € | Baixo | — |
| Dependências de runtime | react, react-dom (MIT), idb (ISC), zod (MIT), workbox (MIT) | Licenças nos `package.json` instalados — **Verificado** | Nenhum | 0 € | Baixo (manutenção) | APIs nativas (IndexedDB direto, validação manual) |
| Hospedagem | Nenhuma obrigatória: `npm run build && npm run preview` corre localmente | — | — | 0 € | — | — |
| Hospedagem (opcional) | GitHub Pages | Grátis em repositórios **públicos** com GitHub Free; privados exigem plano pago — **Verificado** ([docs](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)) | Site ≤ 1 GB; largura de banda *soft* 100 GB/mês; 10 builds/h (*soft*, não se aplica com GitHub Actions); não destinado a negócio online/SaaS comercial — **Verificado** | 0 € | Médio: proibição de uso comercial obriga a migrar se houver plano pago | Cloudflare Pages, qualquer servidor estático |
| Hospedagem (opcional) | Cloudflare Pages | Plano Free — **Verificado** ([docs](https://developers.cloudflare.com/pages/platform/limits)) | 500 builds/mês, 20 000 ficheiros, 25 MiB por ficheiro, 100 domínios/projeto. Largura de banda de estáticos não indicada na página de limites — **Por confirmar** | 0 € (requer conta) | Baixo/médio: condições podem mudar | GitHub Pages |
| CI (opcional) | GitHub Actions | **Por confirmar** nesta sessão (minutos gratuitos para repositórios públicos) | — | 0 € esperado | Baixo | Correr `npm run check` localmente |
| Armazenamento | IndexedDB no navegador do utilizador | Nativo do navegador | Quota dependente do navegador/disco (Chromium de teste reportou ~3 GB disponíveis); dados podem ser limpos pelo navegador sem `persist()` | 0 € | Médio: perda de dados se o utilizador limpar o site | Exportação JSON |
| Áudio | Web Audio API + YIN implementado localmente | Nativo | Qualidade depende do microfone | 0 € | Baixo | Sons de referência (afinar de ouvido) |
| Serviços externos | Nenhum (sem fontes, CDNs, analytics, APIs) | Verificado em E2E: 0 pedidos a terceiros | — | 0 € | — | — |
| IA | Não obrigatória — não usada | — | — | 0 € | — | — |
| Domínio próprio | Não incluído | — | — | 0 € (opcional pago) | — | Subdomínio gratuito do alojamento |

## Notas
- Custo obrigatório total para desenvolver e executar localmente: **0 €**.
- Publicar exige uma decisão e autorização tua. Nenhum recurso externo foi criado.
- As condições gratuitas de terceiros podem mudar; a app não depende delas para funcionar.
- Uma eventual versão freemium com pagamentos teria custos (processador de pagamentos, alojamento comercial, eventualmente backend) e exigiria rever o alojamento, porque o GitHub Pages não é destinado a negócio online.
