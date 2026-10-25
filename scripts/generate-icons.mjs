// Renders PNG icons from inline SVG with the preinstalled Chromium (Playwright). Run: npm run icons
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';

const svg = (size, pad) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">
  <rect width="64" height="64" rx="${pad ? 0 : 14}" fill="#7a3e1d"/>
  <g transform="${pad ? 'translate(9.6 9.6) scale(0.7)' : ''}">
    <g stroke="#faf7f2" stroke-width="3" stroke-linecap="round">
      <path d="M18 14v36M27 14v36M37 14v36M46 14v36"/>
      <path d="M14 24h36M14 34h36" stroke-width="2"/>
    </g>
    <circle cx="37" cy="29" r="5" fill="#e8a873"/>
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
