import { chromium, devices } from 'playwright';
const b = await chromium.launch();
for (const scheme of ['light','dark']) {
const ctx = await b.newContext({ ...devices['iPhone 13'], colorScheme: scheme });
const page = await ctx.newPage();
const errs=[]; page.on('pageerror', e=>errs.push(String(e)));
await page.goto('http://localhost:4173/');
for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Seguinte' }).click();
await page.getByRole('button', { name: 'Começar a praticar' }).click();
await page.waitForTimeout(800);
await page.evaluate(() => { const t=[...document.querySelectorAll('[role=status],[role=alert]')].find(e=>e.textContent.includes('offline')); t?.closest('div')?.remove(); });
await page.screenshot({ path: `/tmp/claude-0/sp/d-${scheme}.png`, fullPage: true });
if (scheme==='light') {
await page.getByRole('link', { name: /^Começar:/ }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/claude-0/sp/step1.png' });
await page.getByRole('button', { name: /Feito · seguinte/ }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/claude-0/sp/step2.png' });
await page.goto('http://localhost:4173/#/musicas/evidencias'); await page.waitForTimeout(300);
await page.getByRole('heading', { name: 'Progressão' }).scrollIntoViewIfNeeded();
await page.mouse.wheel(0, 300); await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/claude-0/sp/sticky.png' });
}
console.log(scheme, errs);
await ctx.close();
}
await b.close();
