// Dev QA: captures each screen via the ?screen= boot shortcut using the
// system Chrome/Edge through playwright-core. Usage:
//   node tools/screenshot.mjs <baseURL> [outDir]
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:4173';
const outDir = process.argv[3] ?? 'shots';
mkdirSync(outDir, { recursive: true });

const exe = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));

const browser = await chromium.launch({
  executablePath: exe,
  headless: true,
  args: ['--use-gl=angle', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('console', (m) => {
  if (m.type() === 'error') console.log('[console.error]', m.text());
});
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

const shots = [
  ['title', 'title.png', null],
  ['map', 'map.png', null],
  ['game', 'game-hint.png', null],
  [
    'game',
    'game-running.png',
    async () => {
      await page.keyboard.press('Space');
      await page.waitForTimeout(4000);
    },
  ],
  ['pause', 'pause.png', null],
  ['result', 'result.png', null],
];

for (const [screen, file, extra] of shots) {
  await page.goto(`${base}/?screen=${screen}`, { waitUntil: 'load' });
  await page.waitForTimeout(3000); // boot + fonts + texture gen
  if (extra) await extra();
  await page.screenshot({ path: `${outDir}/${file}` });
  console.log('captured', file);
}

await browser.close();
console.log('done');
