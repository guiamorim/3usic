# Segurança e privacidade

Referências: OWASP Top 10 (2021) e OWASP ASVS como guia; não foi feita uma auditoria formal.

## Modelo de ameaça (MVP)
Sem backend, sem contas, sem dados transmitidos. Superfícies relevantes: (1) ficheiros importados, (2) dados no IndexedDB (podem estar corrompidos ou alterados), (3) cadeia de dependências, (4) microfone, (5) alojamento.

## Medidas implementadas
| Área | Medida | Evidência |
|---|---|---|
| XSS | React escapa todo o texto; `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `javascript:` proibidos por ESLint | `eslint.config.js`; `npm run lint` sem erros |
| CSP | `default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; connect-src 'self'…` injetada em `dist/index.html` | `vite.config.ts`; E2E corre com CSP ativa sem erros de consola |
| Validação | Esquemas Zod `.strict()` para tudo o que é gravado, lido ou importado; limites de tamanho e de valores | `src/storage/schema.ts`; testes em `tests/integration/storage.test.ts` |
| Importação | Limite 5 MB; apenas `JSON.parse`; rejeita campos desconhecidos, versões futuras, duplicados, `__proto__`; pré-visualização e confirmação; substituição numa só transação | `exportImport.ts`; testes unitários e E2E |
| Importação de cifras | Só texto (máx. 400 KB por ficheiro, 200 000 caracteres); processado por um parser próprio de linhas, sem `eval` nem HTML; caracteres de controlo e de direção bidi removidos; mostrado como texto React; guardado só no dispositivo e validado com Zod | `chordpro.ts`; testes unitários; E2E confirma que `<script>` na letra aparece como texto |
| Integridade local | Registos inválidos são ignorados e o utilizador é avisado; nunca apagados automaticamente | teste «ignora (sem apagar) registos corrompidos» |
| Falhas de escrita | O estado só muda depois de a escrita ter sucesso; erro de quota tem mensagem específica | `src/app/store.tsx` |
| Microfone | Pedido só ao carregar «Ativar microfone»; sem gravação; faixas paradas ao sair da página ou mudar de separador | E2E «liberta o microfone ao sair» |
| Segredos | Nenhum segredo, chave ou credencial no código | revisão; não há serviços externos |
| Rastreamento | Sem analytics, cookies, fontes ou CDNs externos | E2E verifica 0 pedidos a terceiros |
| Dependências | `npm audit`: 0 vulnerabilidades (2026-10-25) | `npm audit` |
| Referer | `<meta name="referrer" content="no-referrer">` | `index.html` |

## Configuração recomendada do alojamento
Se publicares, envia estes cabeçalhos HTTP (a meta-CSP não suporta `frame-ancestors`):
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: microphone=(self), camera=(), geolocation=()
Strict-Transport-Security: max-age=31536000
```
GitHub Pages não permite cabeçalhos personalizados; Cloudflare Pages permite (ficheiro `_headers`).

## Privacidade e RGPD
- Dados guardados: preferências (instrumento, nível, objetivos, géneros, disponibilidade, Lá de referência) e progresso. Não há nome, email nem identificadores.
- Os dados ficam no dispositivo; o responsável pela app não lhes tem acesso. O utilizador pode consultá-los, exportá-los e apagá-los em «Dados e privacidade».
- O áudio do microfone é processado em memória, fotograma a fotograma, e descartado.
- Se a app for publicada, o fornecedor de alojamento processa dados técnicos de acesso (p. ex. IP, user-agent) segundo as suas políticas; isso deve ser indicado numa política de privacidade antes da publicação.
- **Não é declarada conformidade com o RGPD.** A avaliação jurídica fica por fazer antes de qualquer publicação, sobretudo se houver contas, pagamentos ou sincronização.

## Se for introduzido um backend
Avaliar autenticação, autorização por recurso, sessões seguras, CSRF, rate limiting, proteção contra abuso, encriptação em trânsito/repouso, registo de acessos e retenção de dados.

## Limitações
- Sem auditoria de segurança independente.
- A CSP em `<meta>` não cobre `frame-ancestors` (clickjacking) sem cabeçalhos do alojamento.
