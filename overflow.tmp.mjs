import { chromium, devices } from 'playwright';
const b = await chromium.launch();
for (const width of [320, 375, 390]) {
const ctx = await b.newContext({ ...devices['iPhone 13'], viewport: { width, height: 800 } });
const page = await ctx.newPage();
await page.goto('http://localhost:4173/');
for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Seguinte' }).click();
await page.getByRole('button', { name: 'Começar a praticar' }).click();
const pages = ['#/', '#/aprender', '#/aprender/l1-1', '#/aprender/l4-1', '#/praticar', '#/praticar/notas-1a-posicao', '#/praticar/mudancas', '#/musicas', '#/musicas/evidencias', '#/musicas/tempo-perdido/tocar', '#/musicas/importar', '#/batidas', '#/batidas/galope', '#/acordes', '#/acordes/G', '#/afinador', '#/metronomo', '#/ferramentas', '#/progresso', '#/definicoes', '#/dados'];
for (const h of pages) {
  await page.goto('http://localhost:4173/' + h); await page.waitForTimeout(250);
  const r = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const bad = [];
    document.querySelectorAll('main *').forEach((el) => {
      const rc = el.getBoundingClientRect();
      if (rc.width && (rc.right > vw + 1 || rc.left < -1)) {
        const st = getComputedStyle(el);
        if (el.closest('.table-scroll, .chord-strip, [data-scroll]')) return;
        bad.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} "${(el.textContent||'').trim().slice(0,30)}" ${Math.round(rc.left)}-${Math.round(rc.right)}`);
      }
    });
    return { sw: document.documentElement.scrollWidth, vw, bad: bad.slice(0, 6) };
  });
  if (r.sw > r.vw || r.bad.length) console.log(width, h, r.sw, r.vw, r.bad);
}
await ctx.close();
}
await b.close();
