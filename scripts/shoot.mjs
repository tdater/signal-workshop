// Dev helper: screenshot pages at several widths and report horizontal overflow.
// Usage: WIDTHS=390,1440 node scripts/shoot.mjs http://localhost:4321 outdir / /projects
import { chromium } from '@playwright/test';
const [base, out, ...paths] = process.argv.slice(2);
const widths = (process.env.WIDTHS || '390,1440').split(',').map(Number);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',
});
for (const w of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  for (const p of paths) {
    await page.goto(base + p, { waitUntil: 'networkidle' });
    const name = `${out}/${p.replace(/\W+/g, '_') || 'home'}-${w}.png`;
    await page.screenshot({ path: name, fullPage: process.env.FULL !== '0' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    console.log(name, overflow > 0 ? `OVERFLOW ${overflow}px` : 'ok');
  }
  await page.close();
}
await browser.close();
