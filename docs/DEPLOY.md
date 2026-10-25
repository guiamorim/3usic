# Publicação e recuperação

Publicação autorizada pelo Guilherme em 2026-10-25: GitHub Pages em `https://guiamorim.github.io/3usic/` (workflow `.github/workflows/deploy.yml`). Outras publicações requerem nova autorização.

## Executar localmente (sempre possível, sem serviços externos)
```bash
npm ci && npm run build && npm run preview   # http://localhost:4173
```
Qualquer servidor de ficheiros estáticos serve `dist/` (a app usa caminhos relativos e rotas por hash, por isso funciona numa subpasta).

## Testar num telemóvel na rede local
O microfone e o service worker exigem HTTPS fora de `localhost`. Opções gratuitas: túnel HTTPS local, ou publicar num alojamento estático. Sem HTTPS, o resto da app funciona mas o afinador fica indisponível (a app explica porquê).

## Opção A — GitHub Pages (repositório público)
1. Repositório público no GitHub (`guiamorim/3usic`).
2. Settings → Pages → Build and deployment → Source: **GitHub Actions** (passo manual, uma vez).
3. Cada push para `main` corre lint, tipos, testes, build e E2E e, se tudo passar, publica `dist/`. Os PRs só correm as verificações.
3. Limites e restrições: ver `docs/COSTS.md` (não destinado a negócio online; sem cabeçalhos HTTP personalizados).

## Opção B — Cloudflare Pages
1. Ligar o repositório; comando de build `npm run build`; pasta `dist`.
2. Adicionar `public/_headers` com os cabeçalhos de `docs/SECURITY.md`.
3. Requer conta Cloudflare; ver limites em `docs/COSTS.md`.

## Checklist antes de publicar
- [ ] `npm run check` e `npm run test:e2e` a passar
- [ ] `npm audit` sem vulnerabilidades altas/críticas
- [ ] Cabeçalhos de segurança configurados (se o alojamento permitir)
- [ ] Nota de privacidade sobre os registos de acesso do alojamento
- [ ] Testar instalação e afinador num telemóvel real

## Recuperação
- **Código**: o Git é a fonte de verdade; `git checkout <tag>` + build repõe qualquer versão.
- **Versão publicada com defeito**: voltar a publicar a versão anterior. Os utilizadores recebem o aviso «nova versão» e escolhem quando atualizar; o progresso (IndexedDB) não é afetado pela cache.
- **Dados do utilizador**: só existem no dispositivo. A recuperação depende de exportações JSON feitas pelo utilizador (Ferramentas → Dados e privacidade → Exportar/Importar).
- **Alteração de esquema**: incrementar versões e acrescentar migrações (`db.ts` e `exportImport.ts`); nunca remover dados antigos sem migração testada.
