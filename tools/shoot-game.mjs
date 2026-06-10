// Capture the running game (dev server) mid-run and mid-slide to verify the
// animated sprite in context. Usage: node tools/shoot-game.mjs [baseURL] [outDir]
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:5173';
const out = process.argv[3] ?? 'gameshots';
mkdirSync(out, { recursive: true });
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
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => m.type() === 'error' && console.log('[err]', m.text()));

await page.goto(`${base}/?screen=game`, { waitUntil: 'load' });
await page.waitForTimeout(3000); // boot + fonts + textures

// run a bit, then snap mid-run
await page.keyboard.press('Space');
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/run.png` });

// jump snapshot (press and capture while airborne)
await page.keyboard.down('Space');
await page.waitForTimeout(120);
await page.keyboard.up('Space');
await page.waitForTimeout(120);
await page.screenshot({ path: `${out}/jump.png` });

// slide snapshot (hold down)
await page.waitForTimeout(1200);
await page.keyboard.down('ArrowDown');
await page.waitForTimeout(250);
await page.screenshot({ path: `${out}/slide.png` });
await page.keyboard.up('ArrowDown');

console.log('done');
await browser.close();
