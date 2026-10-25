import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = ['#/', '#/aprender', '#/aprender/l4-1', '#/praticar', '#/praticar/acordes-abertos', '#/acordes', '#/acordes/Bm', '#/afinador', '#/metronomo', '#/progresso', '#/ferramentas', '#/definicoes', '#/dados', '#/musicas', '#/musicas/let-it-be', '#/musicas/amazing-grace', '#/musicas/importar', '#/praticar/mudancas/G-Em', '#/batidas', '#/batidas/pop-folk', '#/musicas/tempo-perdido', '#/musicas/tempo-perdido/tocar'];

test('acessibilidade automática (axe, WCAG 2.2 A/AA)', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  const onboarding = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(onboarding.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);

  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Seguinte' }).click();
  await page.getByRole('button', { name: 'Começar a praticar' }).click();
  for (const hash of PAGES) {
    await page.goto(`/${hash}`);
    await page.waitForTimeout(300);
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(r.violations.map((v) => `${hash} ${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
  }
});

test('acessibilidade em modo escuro', async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: 'dark' });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4173/');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Seguinte' }).click();
  await page.getByRole('button', { name: 'Começar a praticar' }).click();
  for (const hash of ['#/', '#/acordes/C', '#/metronomo', '#/musicas', '#/musicas/greensleeves', '#/batidas/galope']) {
    await page.goto(`http://localhost:4173/${hash}`);
    await page.waitForTimeout(300);
    const r = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();
    expect(r.violations.map((v) => `${hash} ${v.id}: ${v.help}`)).toEqual([]);
  }
  await ctx.close();
});
