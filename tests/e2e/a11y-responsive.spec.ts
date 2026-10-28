import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = [
  '/',
  '/projects',
  '/projects/kitt-launcher',
  '/projects/blackbox',
  '/projects/aios',
  '/guides',
  '/guides/connect-obd-adapter',
  '/faq',
  '/about',
  '/downloads',
  '/feedback',
  '/privacy',
  '/community-guidelines',
  '/search?q=obd',
  '/admin',
  '/projects/nope',
];

for (const path of pages) {
  test(`axe WCAG 2.2 AA: ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'networkidle' });
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const summary = results.violations.map(
      (v) => `${v.id} (${v.impact}): ${v.nodes.length}× ${v.nodes[0]?.target}`,
    );
    expect(summary).toEqual([]);
  });
}

const widths = [360, 390, 768, 1024, 1440, 1920];
const layoutPages = [
  '/',
  '/projects/kitt-launcher',
  '/projects/aios',
  '/downloads',
  '/feedback',
  '/faq',
  '/guides/install-kitt-launcher',
];
for (const w of widths) {
  test(`no horizontal overflow at ${w}px`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 900 });
    for (const p of layoutPages) {
      await page.goto(p);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${p} at ${w}px`).toBeLessThanOrEqual(0);
    }
  });
}

test('200% zoom equivalent (640px viewport) reflows without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  for (const p of layoutPages) {
    await page.goto(p);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, p).toBeLessThanOrEqual(0);
  }
});

test('reduced motion stops the scanner animation', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/');
  const anim = await page
    .locator('.scanner span')
    .first()
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(anim).toBe('none');
  await ctx.close();
});
