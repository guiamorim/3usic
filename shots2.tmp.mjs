import { chromium, devices } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ ...devices['iPhone 13'] });
const page = await ctx.newPage();
await page.goto('http://localhost:4173/');
for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Seguinte' }).click();
await page.getByRole('button', { name: 'Começar a praticar' }).click();
await page.evaluate(() => document.querySelector('.toast, .update-prompt')?.remove());
for (const [n,h] of [['metro','#/metronomo'],['lesson','#/aprender/l1-1'],['song','#/musicas/evidencias'],['tools','#/ferramentas'],['practice','#/praticar'],['chord','#/acordes/G']]) {
  await page.goto('http://localhost:4173/' + h); await page.waitForTimeout(400);
  await page.screenshot({ path: `/tmp/claude-0/sp/${n}.png`, fullPage: true });
}
await b.close();
