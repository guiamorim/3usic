// Renders PNG icons from inline SVG with the preinstalled Chromium (Playwright). Run: npm run icons
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';

const svg = (size, pad) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">
  <defs><linearGradient id="cdg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6b2a10"/><stop offset="1" stop-color="#e2611c"/></linearGradient></defs>
  <rect width="64" height="64" rx="${pad ? 0 : 14}" fill="url(#cdg)"/>
  <g transform="${pad ? 'translate(9.6 9.6) scale(0.7)' : ''}">
    <path d="M32 10C45 10 52 15 52 22C52 34 40 47 32 54C24 47 12 34 12 22C12 15 19 10 32 10Z" fill="#fff3e8"/><g stroke="#6b2a10" stroke-linecap="round"><path d="M23 17v22M29 17v26M35 17v26M41 17v22" stroke-width="2"/><path d="M20 17h24" stroke-width="3.5"/><path d="M21 25h22M22 33h20" stroke-width="1.5"/></g><g fill="#e2611c"><circle cx="29" cy="29" r="3.6"/><circle cx="41" cy="21" r="3.6"/></g>
  </g>
</svg>`;

const targets = [
  ['public/icons/icon-192.png', 192, false],
  ['public/icons/icon-512.png', 512, false],
  ['public/icons/icon-maskable-512.png', 512, true],
  ['public/icons/apple-touch-icon.png', 180, true],
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [file, size, pad] of targets) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg(size, pad)}</body></html>`);
  const buf = await page.locator('svg').screenshot({ omitBackground: true });
  await writeFile(file, buf);
  console.log('wrote', file);
}
await browser.close();
