import { expect, test, type Page } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

async function onboard(page: Page, opts: { instrument?: string } = {}) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Braço' })).toBeVisible();
  if (opts.instrument) await page.getByLabel(opts.instrument).check();
  await page.getByRole('button', { name: 'Seguinte' }).click();
  await page.getByLabel('Nunca toquei').check();
  await page.getByRole('button', { name: 'Seguinte' }).click();
  await page.getByLabel('Acompanhar canções com acordes').check();
  await page.getByLabel('Rock').check();
  await page.getByRole('button', { name: 'Seguinte' }).click();
  await page.getByLabel('20 min').check();
  await page.getByRole('button', { name: 'Começar a praticar' }).click();
  await expect(page.getByRole('heading', { name: 'Hoje', exact: true })).toBeVisible();
}

async function answerAll(page: Page) {
  // Answers every remaining question (first option) until the summary is shown.
  for (let i = 0; i < 20; i++) {
    await page.getByRole('group', { name: 'Opções de resposta' }).getByRole('button').first().click();
    const next = page.getByRole('button', { name: /Seguinte|Ver resultado/ });
    const last = (await next.textContent())?.includes('Ver resultado');
    await next.click();
    if (last) {
      await expect(page.getByRole('heading', { name: /^Resultado:/ })).toBeVisible();
      return;
    }
  }
}

test.describe('percurso principal', () => {
  test('onboarding → lição → exercício → progresso → persistência após reabrir', async ({ page, context }) => {
    const external: string[] = [];
    const errors: string[] = [];
    page.on('request', (r) => {
      if (!r.url().startsWith('http://localhost:4173')) external.push(r.url());
    });
    page.on('pageerror', (e) => errors.push(String(e)));

    await onboard(page, { instrument: 'Violão clássico (nylon)' });
    await expect(page.getByText(/Violão clássico \(nylon\)/).first()).toBeVisible();
    await expect(page.getByText(/20 min por sessão/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Plano de hoje' })).toBeVisible();

    // Recommended lesson, with instrument-specific note.
    await page.getByRole('link', { name: /Começar lição/ }).click();
    await expect(page.getByRole('heading', { name: 'Partes do instrumento e nomes das cordas', level: 1 })).toBeVisible();
    await expect(page.getByText('No teu instrumento:')).toBeVisible();
    const conclude = page.getByRole('button', { name: 'Concluir lição' });
    await expect(conclude).toBeDisabled();
    await page.getByLabel(/Consigo dizer o nome e o número de cada corda/).check();
    await conclude.click();
    await expect(page.getByRole('status').filter({ hasText: 'Lição marcada como concluída' })).toBeVisible();

    // Linked exercise.
    await page.getByRole('link', { name: /Exercício: Nomes das cordas/ }).click();
    await expect(page.getByText('Pergunta 1 de 8')).toBeVisible();
    await page.getByRole('group', { name: 'Opções de resposta' }).getByRole('button').first().click();
    await expect(page.locator('.feedback')).toBeVisible();
    await page.getByRole('button', { name: 'Seguinte' }).click();
    await answerAll(page);
    await expect(page.getByRole('heading', { name: /^Resultado: \d+ de 8/ })).toBeVisible();
    // The lesson is done: the summary leads straight to the next lesson.
    await expect(page.getByRole('link', { name: 'Voltar à lição' })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Próxima lição: / })).toBeVisible();

    // Progress reflects it.
    await page.goto('/#/progresso');
    await expect(page.getByText('1 de 21 concluídas')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Nomes das cordas' })).toBeVisible();
    await expect(page.getByText(/Nomes das cordas: \d+\/8/)).toBeVisible();

    // Close and reopen: data persists (IndexedDB).
    await page.close();
    const page2 = await context.newPage();
    await page2.goto('/');
    await expect(page2.getByRole('heading', { name: 'Hoje', exact: true })).toBeVisible();
    await expect(page2.getByText('1 de 21 lições concluídas')).toBeVisible();
    await page2.goto('/#/aprender');
    await expect(page2.getByRole('link', { name: /Partes do instrumento.*Concluída/ })).toBeVisible();

    expect(errors).toEqual([]);
    expect(external, 'a aplicação não deve contactar terceiros').toEqual([]);
  });

  test('plano de estudo: marcar bloco feito sobrevive a recarregar', async ({ page }) => {
    await onboard(page);
    const first = page.getByRole('checkbox', { name: 'Marcar «Aquecimento» como feito' });
    await first.click();
    await expect(first).toBeChecked();
    await expect(page.locator('.badge').first()).toHaveText(/^1\//);
    await page.reload();
    await expect(page.getByRole('checkbox', { name: 'Marcar «Aquecimento» como feito' })).toBeChecked();
  });

  test('biblioteca de acordes: pesquisa e detalhe', async ({ page }) => {
    await onboard(page);
    await page.goto('/#/acordes');
    await page.getByLabel('Pesquisar').fill('re menor');
    await expect(page.getByRole('link', { name: 'Dm Ré menor Média' })).toBeVisible();
    await page.getByRole('link', { name: 'Dm Ré menor Média' }).click();
    await expect(page.getByRole('heading', { name: 'Dm — Ré menor' })).toBeVisible();
    await expect(page.getByRole('img', { name: /Diagrama de Dm: 6\.ª corda não se toca/ })).toBeVisible();
    await expect(page.getByText('Notas:')).toBeVisible();
  });

  test('mudanças num minuto valida e guarda o resultado', async ({ page }) => {
    await onboard(page);
    await page.clock.install();
    await page.goto('/#/praticar/mudancas');
    await page.getByRole('button', { name: 'Iniciar 60 segundos' }).click();
    await page.clock.runFor(61_000);
    await expect(page.getByText('Tempo! Quantas mudanças limpas fizeste?')).toBeVisible();
    await page.getByLabel('Número de mudanças').fill('999');
    await page.getByRole('button', { name: 'Guardar resultado' }).click();
    await expect(page.getByText('Indica um número inteiro entre 0 e 300.')).toBeVisible();
    await page.getByLabel('Número de mudanças').fill('22');
    await page.getByRole('button', { name: 'Guardar resultado' }).click();
    await expect(page.getByText('Melhor: 22 mudanças/min')).toBeVisible();
  });
});

test.describe('metrónomo', () => {
  test('inicia, mostra pulsação visual, altera BPM e pausa', async ({ page }) => {
    await onboard(page);
    await page.goto('/#/metronomo?bpm=120');
    await expect(page.getByLabel('Andamento', { exact: true })).toContainText('120');
    await page.getByRole('button', { name: 'Iniciar', exact: true }).click();
    await expect(page.locator('.beat--on')).toHaveCount(1, { timeout: 3000 });
    // Visual pulse advances through the bar.
    const seen = new Set<string>();
    for (let i = 0; i < 15; i++) {
      const t = await page
        .locator('.beat--on')
        .textContent()
        .catch(() => null);
      if (t) seen.add(t);
      await page.waitForTimeout(100);
    }
    expect(seen.size).toBeGreaterThan(1);
    await page.getByRole('button', { name: 'Aumentar 5 BPM' }).click();
    await expect(page.getByLabel('Andamento', { exact: true })).toContainText('125');
    await page.getByRole('button', { name: 'Pausar' }).click();
    await expect(page.getByRole('button', { name: 'Iniciar', exact: true })).toBeVisible();
    await expect(page.locator('.beat--on')).toHaveCount(0);
  });
});

test.describe('afinador e microfone', () => {
  test('recusa do microfone mostra alternativa', async ({ browser }) => {
    const ctx = await browser.newContext({ permissions: [] });
    const page = await ctx.newPage();
    // Simulate a denial deterministically, independent of the browser's prompt behaviour.
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('denied', 'NotAllowedError'));
    });
    await onboard(page);
    await page.goto('/#/afinador');
    await page.getByRole('button', { name: 'Ativar microfone' }).click();
    await expect(page.getByRole('alert')).toContainText('acesso ao microfone foi recusado');
    await expect(page.getByRole('button', { name: /6\.ª · E/ })).toBeVisible();
    await ctx.close();
  });

  test('microfone autorizado: escuta e liberta o microfone ao sair', async ({ browser, browserName }) => {
    test.skip(browserName !== 'chromium');
    const ctx = await browser.newContext({ permissions: ['microphone'] });
    const page = await ctx.newPage();
    // Count live tracks to prove the microphone is released.
    await page.addInitScript(() => {
      const w = window as unknown as { __tracks: MediaStreamTrack[] };
      w.__tracks = [];
      const orig = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = async (c) => {
        const s = await orig(c);
        w.__tracks.push(...s.getTracks());
        return s;
      };
    });
    await onboard(page);
    await page.goto('/#/afinador');
    await page.getByRole('button', { name: 'Ativar microfone' }).click();
    // The button appears while the mic is still starting: wait until it is actually listening.
    await expect(page.getByText(/Toca uma corda solta|cents|Não consigo identificar|longe de qualquer corda/).first()).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    const live = () => page.evaluate(() => (window as unknown as { __tracks: MediaStreamTrack[] }).__tracks.filter((t) => t.readyState === 'live').length);
    await expect.poll(live).toBe(1);
    await page.getByRole('link', { name: 'Início', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Hoje', exact: true })).toBeVisible();
    await expect.poll(live).toBe(0);
    await ctx.close();
  });
});

test.describe('dados', () => {
  test('exporta, rejeita ficheiro inválido, importa com confirmação e apaga', async ({ page }) => {
    await onboard(page);
    await page.goto('/#/aprender/l1-1');
    await page.getByLabel(/Consigo dizer o nome/).check();
    await page.getByRole('button', { name: 'Concluir lição' }).click();

    await page.goto('/#/dados');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar dados (JSON)' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^braco-progresso-\d{4}-\d{2}-\d{2}\.json$/);
    // ASCII-only path: Chromium fails to read uploads from some non-ASCII paths in this environment.
    const exported = join(mkdtempSync(join(tmpdir(), 'braco-')), 'export.json');
    await download.saveAs(exported);

    // Invalid file is rejected without changing anything.
    await page.setInputFiles('#import-file', { name: 'mau.json', mimeType: 'application/json', buffer: Buffer.from('{"app":"outra"}') });
    await expect(page.getByRole('alert')).toContainText('não foi exportado por esta aplicação');

    // Delete everything (typed confirmation).
    await page.getByRole('button', { name: 'Apagar dados…' }).click();
    const del = page.getByRole('button', { name: 'Apagar definitivamente' });
    await expect(del).toBeDisabled();
    await page.getByLabel(/Para confirmar, escreve/).fill('apagar');
    await del.click();
    await expect(page.getByRole('heading', { name: 'Bem-vindo ao Braço' })).toBeVisible();

    // Restore from the exported file, via the onboarding link.
    await page.getByRole('link', { name: 'Importar ficheiro' }).click();
    await page.setInputFiles('#import-file', exported);
    await expect(page.getByRole('heading', { name: 'Substituir os dados atuais?' })).toBeVisible();
    await expect(page.getByText(/1 lições concluídas/)).toBeVisible();
    await page.getByRole('button', { name: 'Substituir dados' }).click();
    await expect(page.getByText('Dados importados com sucesso.')).toBeVisible();
    await page.goto('/');
    await expect(page.getByText('1 de 21 lições concluídas')).toBeVisible();
  });
});

test.describe('músicas', () => {
  test('filtra o catálogo, define música objetivo e treina a mudança sugerida', async ({ page }) => {
    await onboard(page);
    await page.getByRole('link', { name: 'Músicas' }).first().click();
    await expect(page.getByRole('heading', { name: 'Músicas', level: 1 })).toBeVisible();

    await page.getByLabel('Estilo').selectOption('mpb-bossa');
    await expect(page.getByRole('link', { name: /Asa Branca/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Wonderwall/ })).toHaveCount(0);
    await page.getByRole('button', { name: 'Limpar filtros' }).click();
    await page.getByLabel('Época').selectOption('1990');
    await expect(page.getByRole('link', { name: /Wonderwall/ })).toBeVisible();
    await page.getByRole('button', { name: 'Limpar filtros' }).click();
    await page.getByLabel('Artista').selectOption('The Beatles');
    await expect(page.getByRole('status').filter({ hasText: /^3 músicas$/ })).toBeVisible();
    await page.getByRole('button', { name: 'Limpar filtros' }).click();
    await page.getByLabel('País').selectOption('PT');
    await expect(page.getByRole('link', { name: /Homem do Leme/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Wonderwall/ })).toHaveCount(0);
    await page.getByRole('button', { name: 'Limpar filtros' }).click();
    await page.getByLabel('Artista').selectOption('The Beatles');

    await page.getByRole('link', { name: /Let It Be/ }).click();
    await expect(page.getByRole('heading', { name: 'Let It Be', level: 1 })).toBeVisible();
    await expect(page.getByText('Já sabes 0 de 4 acordes.')).toBeVisible();
    // Marking a chord as known updates the plan.
    await page.getByRole('listitem').filter({ hasText: /^C/ }).getByLabel('Já sei').click();
    await expect(page.getByText('Já sabes 1 de 4 acordes.')).toBeVisible();
    // Transposing changes the shown key.
    await page.getByRole('button', { name: 'Subir meio-tom' }).click();
    await page.getByRole('button', { name: 'Subir meio-tom' }).click();
    await expect(page.getByText('Tom: D')).toBeVisible();
    await page.getByRole('button', { name: 'Repor original' }).click();

    await page.getByRole('button', { name: 'Quero aprender esta' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Música objetivo definida' })).toBeVisible();
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Música objetivo' })).toBeVisible();
    await expect(page.getByText(/«Let It Be»: aprende/)).toBeVisible();

    await page.goto('/#/musicas/let-it-be');
    await page.getByRole('link', { name: /↔/ }).first().click();
    await expect(page.getByRole('heading', { name: 'Mudanças num minuto' })).toBeVisible();
    await expect(page.getByLabel('Par de acordes')).not.toHaveValue('A-D');
  });

  test('alterna entre versão simplificada e mais próxima do original', async ({ page }) => {
    await onboard(page);
    await page.goto('/#/musicas/evidencias');
    await expect(page.getByRole('heading', { name: 'Evidências', level: 1 })).toBeVisible();
    await expect(page.getByLabel('Simplificada')).toBeChecked();
    const sheet = page.getByRole('region', { name: 'Progressão' }).locator('.sheet');
    await expect(sheet.getByText('Cº', { exact: true })).toHaveCount(0);
    await page.getByLabel('Mais próxima do original').click();
    await expect(page.getByLabel('Mais próxima do original')).toBeChecked();
    await expect(sheet.getByText('Cº', { exact: true })).toHaveCount(1);
    await expect(page.getByText(/Acordes conferidos em cifras\.com\.br/)).toBeVisible();
    // The choice is remembered.
    await page.reload();
    await expect(page.getByLabel('Mais próxima do original')).toBeChecked();
  });

  test('importa uma cifra em texto simples, mostra-a e apaga-a', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (r) => {
      if (!r.url().startsWith('http://localhost:4173')) external.push(r.url());
    });
    await onboard(page);
    await page.goto('/#/musicas/importar');
    await page
      .getByLabel('Ou cola aqui a cifra')
      .fill(['Canção de Teste - Banda X', 'Tom: G', '', '[Refrão]', 'G         D', 'Uma linha <script>alert(1)</script>', 'Em        C', 'Outra linha da letra'].join('\n'));
    await page.getByRole('button', { name: 'Pré-visualizar' }).click();
    await expect(page.getByText('Lido como texto simples. 4 acordes diferentes: G, D, Em, C.')).toBeVisible();
    await expect(page.getByLabel('Título')).toHaveValue('Canção de Teste');
    await page.getByLabel('Artista').fill('Banda Y');
    await page.getByRole('button', { name: 'Guardar música' }).click();

    await expect(page.getByRole('heading', { name: 'Canção de Teste', level: 1 })).toBeVisible();
    await expect(page.getByText('Banda Y', { exact: true })).toBeVisible();
    // Imported text is rendered as text, never as HTML.
    await expect(page.getByText('<script>alert(1)</script>', { exact: false })).toBeVisible();
    expect(await page.locator('main script').count()).toBe(0);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Canção de Teste', level: 1 })).toBeVisible();
    await page.goto('/#/musicas');
    await page.getByLabel('Origem').selectOption('user');
    await expect(page.getByRole('link', { name: /Canção de Teste/ })).toBeVisible();

    await page.getByRole('link', { name: /Canção de Teste/ }).click();
    await page.getByRole('button', { name: 'Apagar música' }).click();
    await page.getByRole('button', { name: /Confirmar: apagar/ }).click();
    await expect(page.getByRole('heading', { name: 'Músicas', level: 1 })).toBeVisible();
    await page.getByLabel('Origem').selectOption('user');
    await expect(page.getByText('Nenhuma música corresponde aos filtros.')).toBeVisible();
    expect(external).toEqual([]);
  });

  test('importa um ficheiro ChordPro', async ({ page }) => {
    await onboard(page);
    await page.goto('/#/musicas/importar');
    await page.setInputFiles('input[type=file]', {
      name: 'cancao.cho',
      mimeType: 'text/plain',
      buffer: Buffer.from('{title: Ficheiro CP}\n{artist: Alguém}\n{key: A}\n\n{start_of_chorus}\n[A]Lá [E]lá [D]lá\n{end_of_chorus}\n'),
    });
    await expect(page.getByText(/Lido como ChordPro\. 3 acordes diferentes/)).toBeVisible();
    await page.getByRole('button', { name: 'Guardar música' }).click();
    await expect(page.getByRole('heading', { name: 'Ficheiro CP', level: 1 })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Refrão' })).toBeVisible();
  });
});

test.describe('prática guiada', () => {
  test('exercício aberto a partir de uma lição deixa seguir para a próxima', async ({ page }) => {
    await onboard(page);
    await page.goto('/#/aprender/l1-1');
    await page.getByRole('link', { name: /Exercício: Nomes das cordas/ }).click();
    await answerAll(page);
    const next = page.getByRole('button', { name: /^Concluir «.*» e passar à próxima/ }).or(page.getByRole('link', { name: /^Avançar mesmo assim: / }));
    await next.click();
    await expect(page).toHaveURL(/#\/aprender\/(?!l1-1$)/);
    await expect(page.getByRole('heading', { name: 'Objetivo' })).toBeVisible();
  });

  test('separador Batidas: abre um padrão, toca e mostra o cursor', async ({ page }) => {
    await onboard(page);
    await expect(page.getByText('Como funciona?')).toBeVisible();
    // Five tabs only: Batidas lives under «Praticar» and is reachable from the home shortcuts and «Mais».
    const nav = page.getByRole('navigation', { name: 'Navegação principal' });
    await expect(nav.getByRole('link')).toHaveCount(5);
    await page.getByRole('navigation', { name: 'Atalhos' }).getByRole('link', { name: 'Batidas', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Batidas', level: 1 })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Praticar' })).toHaveAttribute('aria-current', 'page');
    await page.getByRole('link', { name: /Pop \/ folk/ }).click();
    await expect(page.getByRole('heading', { name: 'Pop / folk', level: 1 })).toBeVisible();
    await page.getByRole('button', { name: 'Tocar' }).click();
    await expect(page.locator('.strum__now')).toHaveCount(1);
    await page.getByRole('button', { name: 'Parar' }).click();
    await expect(page.locator('.strum__now')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Tempo Perdido/ })).toBeVisible();
  });

  test('tocar junto sem microfone: contagem, acorde atual e fim', async ({ page }) => {
    await onboard(page);
    await page.goto('/#/musicas/tempo-perdido');
    await page.getByRole('link', { name: /^Tocar junto/ }).click();
    await expect(page.getByRole('heading', { name: 'Tocar junto: Tempo Perdido' })).toBeVisible();
    await page.getByLabel('Avaliar com o microfone').click();
    await expect(page.getByLabel('Avaliar com o microfone')).not.toBeChecked();
    await page.getByLabel('Repetir a progressão').selectOption('1');
    await page.getByRole('button', { name: 'Começar' }).click();
    await expect(page.getByText(/Prepara-te/)).toBeVisible();
    await expect(page.getByText(/^Acorde 1 de \d+/)).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.play-along__chord')).toHaveText('C');
    await page.getByRole('button', { name: 'Parar' }).click();
    await expect(page.getByRole('heading', { name: 'Chegaste ao fim' })).toBeVisible();
  });

  test('tocar junto com microfone: escuta e liberta o microfone', async ({ browser, browserName }) => {
    test.skip(browserName !== 'chromium');
    const ctx = await browser.newContext({ permissions: ['microphone'] });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      const w = window as unknown as { __tracks: MediaStreamTrack[] };
      w.__tracks = [];
      const orig = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = async (c) => {
        const s = await orig(c);
        w.__tracks.push(...s.getTracks());
        return s;
      };
    });
    await onboard(page);
    await page.goto('/#/musicas/tempo-perdido/tocar');
    await page.getByRole('button', { name: 'Começar' }).click();
    await expect(page.getByText('Som captado')).toBeVisible();
    const live = () => page.evaluate(() => (window as unknown as { __tracks: MediaStreamTrack[] }).__tracks.filter((t) => t.readyState === 'live').length);
    await expect.poll(live).toBe(1);
    await page.getByRole('button', { name: 'Parar' }).click();
    await expect.poll(live).toBe(0);
    await expect(page.getByRole('heading', { name: /Pontuação|Sem resultado/ })).toBeVisible();
    await ctx.close();
  });

  test('letra: cola a tua cifra numa música do catálogo', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (r) => {
      if (!r.url().startsWith('http://localhost:4173')) external.push(r.url());
    });
    await onboard(page);
    await page.goto('/#/musicas/tempo-perdido');
    await expect(page.getByRole('heading', { name: 'Letra e cifra completa' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Procurar no Cifra Club/ })).toHaveAttribute('href', /duckduckgo\.com.*cifraclub/);
    await page.getByRole('link', { name: 'Colar a cifra com letra' }).click();
    await expect(page.getByRole('heading', { name: 'Colar cifra: Tempo Perdido' })).toBeVisible();
    await page.getByLabel('Ou cola aqui a cifra').fill(['C          G', 'Linha de teste da minha cifra', 'Am         Em', 'Segunda linha'].join('\n'));
    await page.getByRole('button', { name: 'Pré-visualizar' }).click();
    await expect(page.getByLabel('Título')).toHaveValue('Tempo Perdido');
    await page.getByRole('button', { name: 'Guardar música' }).click();
    await expect(page.getByRole('heading', { name: 'Tempo Perdido', level: 1 })).toBeVisible();
    await expect(page.getByText('A tua cifra, guardada só neste dispositivo.')).toBeVisible();
    await expect(
      page
        .getByRole('region', { name: 'Letra e cifra completa' })
        .or(page.locator('section').filter({ hasText: 'A tua cifra' }))
        .first(),
    ).toContainText('ste da minha cifra');
    await expect(page.getByRole('link', { name: 'Tocar junto (com a letra)' })).toBeVisible();
    expect(external).toEqual([]);
  });
});

test.describe('modo guiado e ecrã ligado', () => {
  test('o plano leva de um passo ao seguinte sem voltar ao início', async ({ page }) => {
    await onboard(page);
    await page.getByRole('link', { name: /^Começar: Aquecimento/ }).click();
    const bar = page.getByRole('complementary', { name: 'Plano de hoje' });
    await expect(bar).toContainText('passo 1 de');
    await expect(bar).toContainText('Aquecimento');
    await bar.getByRole('button', { name: /Feito · seguinte/ }).click();
    await expect(bar).toContainText('passo 2 de');
    // Navigating inside the activity keeps the bar.
    await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Mais' }).click();
    await page.getByRole('link', { name: /^Acordes/ }).click();
    await expect(page.getByRole('heading', { name: 'Acordes', level: 1 })).toBeVisible();
    await expect(bar).toBeVisible();
    // Away from the step: one tap brings the user back to it.
    await bar.getByRole('link', { name: 'Voltar ao passo' }).click();
    await expect(page.getByRole('heading', { name: 'Acordes', level: 1 })).toHaveCount(0);
    await expect(bar.getByRole('link', { name: 'Voltar ao passo' })).toHaveCount(0);
    await bar.getByRole('button', { name: 'Sair do modo guiado' }).click();
    await expect(bar).toHaveCount(0);
    await page.getByRole('link', { name: 'Início', exact: true }).click();
    await expect(page.getByRole('checkbox', { name: /Marcar «Aquecimento» como feito/ })).toBeChecked();
    await expect(page.getByRole('link', { name: /^Continuar: / })).toBeVisible();
  });

  test('botão «Ecrã ligado» fica guardado', async ({ page }) => {
    await onboard(page);
    const btn = page.getByRole('button', { name: /Ecrã ligado/ });
    await expect(btn).toHaveAttribute('aria-pressed', 'false');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    await page.reload();
    await expect(page.getByRole('button', { name: /Ecrã ligado/ })).toHaveAttribute('aria-pressed', 'true');
  });

  test('cifra: acordes fixos no topo ao percorrer', async ({ page }) => {
    await onboard(page);
    await page.goto('/#/musicas/evidencias');
    const strip = page.locator('.chord-strip').first();
    await expect(strip).toHaveClass(/chord-strip--pinned/);
    await expect(strip.getByRole('list', { name: 'Acordes desta cifra' })).toContainText('F#m');
    await strip.getByRole('button', { name: /Fixar os acordes/ }).click();
    await expect(strip).not.toHaveClass(/chord-strip--pinned/);
  });
});

test.describe('offline e PWA', () => {
  test('manifest válido e funcionamento offline após o primeiro carregamento', async ({ page, context }) => {
    await page.goto('/');
    const manifest = await (await page.request.get('/manifest.webmanifest')).json();
    expect(manifest.name).toContain('Braço');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.some((i: { sizes: string }) => i.sizes === '512x512')).toBe(true);

    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    // Make sure the SW controls the page before going offline.
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    await onboard(page);

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Hoje', exact: true })).toBeVisible();
    await page.goto('/#/acordes/G');
    await expect(page.getByRole('heading', { name: 'G — Sol maior' })).toBeVisible();
    await page.goto('/#/afinador');
    await expect(page.getByRole('button', { name: 'Ativar microfone' })).toBeVisible();
    await page.goto('/#/praticar/ritmo');
    await expect(page.getByText('Pergunta 1 de 8')).toBeVisible();
    await context.setOffline(false);
  });
});

test.describe('melhorias da revisão', () => {
  test('um exercício interrompido continua onde ficou', async ({ page }) => {
    await onboard(page);
    await page.goto('/#/praticar/ritmo');
    await expect(page.getByText('Pergunta 1 de 8')).toBeVisible();
    await page.locator('.quiz__options .option').first().click();
    await page.reload();
    await expect(page.getByText(/Continuas onde ficaste: 1 de 8/)).toBeVisible();
    await expect(page.getByText('Pergunta 2 de 8')).toBeVisible();
    await page.getByRole('button', { name: 'Recomeçar' }).click();
    await expect(page.getByText('Pergunta 1 de 8')).toBeVisible();
  });

  test('a página «Mais» reúne ferramentas, acordes e batidas', async ({ page }) => {
    await onboard(page);
    await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Mais' }).click();
    await expect(page.getByRole('heading', { name: 'Mais', level: 1 })).toBeVisible();
    for (const name of ['Afinador', 'Metrónomo', 'Acordes', 'Batidas', 'Progresso', 'Dados e privacidade']) {
      await expect(page.getByRole('link', { name: new RegExp(`^${name}`) })).toBeVisible();
    }
  });
});

test('secção de canções infantis e Parabéns', async ({ page }) => {
  await onboard(page);
  await page.goto('/#/musicas');
  await page.getByRole('button', { name: 'Infantis e festas' }).click();
  await expect(page.getByRole('link', { name: /Parabéns a Você \(versão brasileira\)/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Parabéns a Você \(versão portuguesa\)/ })).toBeVisible();
  await page.getByRole('link', { name: /Ciranda, Cirandinha/ }).click();
  await expect(page.getByText('vamos todos ciran', { exact: false }).first()).toBeVisible();
  // Back returns to the kids section, not to the full list.
  await page.getByRole('link', { name: /^← / }).click();
  await expect(page.getByRole('button', { name: 'Infantis e festas' })).toHaveAttribute('aria-pressed', 'true');
});

test('voltar regressa ao ecrã de origem, na mesma posição', async ({ page }) => {
  await onboard(page);
  await page.getByRole('link', { name: /Começar lição/ }).click();
  const lesson = 'Partes do instrumento e nomes das cordas';
  await expect(page.getByRole('heading', { name: lesson, level: 1 })).toBeVisible();
  const exercise = page.getByRole('link', { name: /Exercício: Nomes das cordas/ });
  await exercise.scrollIntoViewIfNeeded();
  const y = await page.evaluate(() => window.scrollY);
  expect(y).toBeGreaterThan(0);
  await exercise.click();
  await expect(page.getByText('Pergunta 1 de 8')).toBeVisible();
  // The back link names the screen the user came from and returns to the same scroll position.
  await page.getByRole('link', { name: `← ${lesson}` }).click();
  await expect(page.getByRole('heading', { name: lesson, level: 1 })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(y - 40);
});

test('responsividade: nada transborda a 320 px com texto aumentado', async ({ browser }) => {
  test.setTimeout(120_000);
  const ctx = await browser.newContext({ viewport: { width: 320, height: 720 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await onboard(page);
  const routes = [
    '',
    'aprender',
    'aprender/l1-1',
    'praticar',
    'praticar/mudancas',
    'musicas',
    'musicas/wonderwall',
    'musicas/wonderwall/tocar',
    'musicas/importar',
    'batidas',
    'batidas/pop-folk',
    'acordes',
    'acordes/G',
    'afinador',
    'metronomo',
    'progresso',
    'ferramentas',
    'definicoes',
    'dados',
  ];
  for (const fs of ['100%', '130%']) {
    for (const r of routes) {
      await page.evaluate((h) => (location.hash = '#/' + h), r);
      await page.waitForTimeout(300);
      // CSP forbids injected <style>; an inline style property on <html> is allowed.
      await page.evaluate((size) => document.documentElement.style.setProperty('font-size', size, 'important'), fs);
      const issues = await page.evaluate(() => {
        const out: string[] = [];
        const w = document.documentElement.clientWidth;
        if (document.documentElement.scrollWidth > w + 1) out.push(`página ${document.documentElement.scrollWidth} > ${w}`);
        for (const el of document.querySelectorAll<HTMLElement>('button, .btn, .chip, select, .option')) {
          const box = el.getBoundingClientRect();
          if (box.width === 0) continue;
          const name = (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 30);
          if (el.scrollWidth > el.clientWidth + 2) out.push(`conteúdo maior que o botão: ${name}`);
          if (box.right > w + 1) out.push(`fora do ecrã: ${name}`);
        }
        return out;
      });
      expect(issues, `#/${r} @ ${fs}`).toEqual([]);
    }
  }
  await ctx.close();
});
