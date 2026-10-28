import { test, expect, type Page } from '@playwright/test';
import { TEST_PASSWORD } from '../support/server.mjs';

const routes = [
  '/',
  '/projects',
  '/projects/kitt-launcher',
  '/projects/retrotv',
  '/projects/blackbox',
  '/projects/aios',
  '/guides',
  '/guides/install-retrotv',
  '/faq',
  '/about',
  '/downloads',
  '/feedback',
  '/privacy',
  '/community-guidelines',
  '/search',
  '/admin',
];

test('every public area is reachable from navigation and reloads directly', async ({ page }) => {
  await page.goto('/');
  for (const label of ['Projects', 'Guides', 'FAQ', 'Downloads', 'About', 'Feedback']) {
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: label, exact: true })
      .click();
    await expect(page.locator('h1')).toBeVisible();
    await page.reload();
    await expect(page.locator('h1')).toBeVisible();
  }
  await page.getByRole('contentinfo').getByRole('link', { name: 'Privacy' }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await page.getByRole('contentinfo').getByRole('link', { name: 'Community guidelines' }).click();
  await expect(page.getByText('deleted without warning or discussion')).toBeVisible();
});

test('no console errors or CSP violations on main pages', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(`${page.url()}: ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`${page.url()}: ${e.message}`));
  for (const r of routes) await page.goto(r, { waitUntil: 'networkidle' });
  expect(errors).toEqual([]);
});

test('unknown project gives a useful 404', async ({ page }) => {
  const res = await page.goto('/projects/does-not-exist');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Nothing on this channel.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'KITT Launcher' })).toBeVisible();
});

test('project finder matches problems to projects deterministically', async ({ page }) => {
  await page.goto('/');
  const finder = page.locator('[data-finder]');
  await finder.getByRole('button', { name: /retro games on my TV/ }).click();
  const results = finder.locator('[data-results]');
  await expect(results.getByRole('link', { name: 'RetroTV', exact: true })).toBeVisible();
  await expect(results.getByRole('link', { name: 'KITT Launcher', exact: true })).toHaveCount(0);
  await finder.getByRole('button', { name: 'Car head unit' }).click();
  await expect(results).toContainText('Nothing here matches that combination yet');
  await finder.getByRole('button', { name: 'Clear choices' }).click();
  await finder.getByRole('button', { name: 'It has to work without a signal' }).click();
  await expect(results.getByRole('link', { name: 'BLACKBOX', exact: true })).toBeVisible();
  await expect(results.getByRole('link', { name: 'KITT Launcher', exact: true })).toBeVisible();
});

test('project library filters and handles empty results', async ({ page }) => {
  await page.goto('/projects');
  await page.getByLabel('Search projects').fill('controller');
  await expect(page.locator('.pcard:visible')).toHaveCount(1);
  await page.getByLabel('Search projects').fill('zzzz-nothing');
  await expect(page.getByText('No projects match those filters.')).toBeVisible();
  await page.getByLabel('Search projects').fill('');
  await page.getByRole('button', { name: 'Active development' }).click();
  await expect(page.locator('.pcard:visible h2')).toHaveText(['BLACKBOX', 'AIOS']);
});

test('screenshot viewer traps focus, steps, and returns focus on Escape', async ({ page }) => {
  await page.goto('/projects/kitt-launcher');
  const thumb = page.locator('a[data-full]').first();
  await thumb.click();
  const dialog = page.getByRole('dialog', { name: 'Screenshot viewer' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused();
  await expect(dialog.locator('.lightbox__count')).toHaveText(/^1 \//);
  await page.keyboard.press('ArrowRight');
  await expect(dialog.locator('.lightbox__count')).toHaveText(/^2 \//);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(thumb).toBeFocused();
});

test('videos never autoplay or preload', async ({ page }) => {
  await page.goto('/projects/kitt-launcher');
  for (const v of await page.locator('video').all()) {
    await expect(v).toHaveAttribute('preload', 'none');
    expect(await v.getAttribute('autoplay')).toBeNull();
    expect(await v.evaluate((el: HTMLVideoElement) => el.paused)).toBe(true);
  }
});

test('BLACKBOX shows an honest no-media state', async ({ page }) => {
  await page.goto('/projects/blackbox');
  await expect(page.getByText('No published media yet')).toBeVisible();
  await expect(page.locator('#media img')).toHaveCount(0);
});

test('AIOS shows real media and an honest no-release state, never a source link', async ({
  page,
}) => {
  await page.goto('/projects/aios');
  await expect(page.locator('#no-release')).toContainText('No release yet');
  await expect(page.locator('#media img').first()).toBeVisible();
  await expect(page.getByText('invented sample data').first()).toBeVisible();
  await expect(page.locator('a[href*="github.com/tdater/aios"]')).toHaveCount(0);
  await expect(page.locator('a[href$=".apk"]')).toHaveCount(0);
  await expect(page.locator('#setup')).toHaveCount(0);
  await page.goto('/downloads');
  await expect(page.getByText('No release is available for AIOS right now.')).toBeVisible();
});

test('KITT Launcher shows the 1.9 releases, music library and film editions', async ({ page }) => {
  await page.goto('/projects/kitt-launcher');
  await expect(page.locator('#passport-kitt-launcher-kitt-1-9')).toContainText(
    'KITT-Launcher-v1.9.apk',
  );
  await expect(page.locator('#passport-kitt-launcher-kitt2-1-9')).toContainText(
    'KITT-Launcher.2-v1.9.apk',
  );
  await expect(page.getByRole('heading', { name: 'Film editions', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'New in 1.9: music library' })).toBeVisible();
  await expect(page.locator('img[src*="l2-edition-hillvalley2015"]')).toHaveCount(1);
});

test('the finder matches AIOS to its problem and the Windows platform', async ({ page }) => {
  await page.goto('/');
  const finder = page.locator('[data-finder]');
  await finder.getByRole('button', { name: /my AIs, notes and projects in one place/ }).click();
  const results = finder.locator('[data-results]');
  await expect(results.getByRole('link', { name: 'AIOS', exact: true })).toBeVisible();
  await finder.getByRole('button', { name: 'Windows PC' }).click();
  await expect(results.getByRole('link', { name: 'AIOS', exact: true })).toBeVisible();
  await expect(results.getByRole('link', { name: 'RetroTV', exact: true })).toHaveCount(0);
});

test('download passport shows release metadata from one record', async ({ page }) => {
  await page.goto('/downloads');
  const passport = page.locator('#passport-retrotv-1-4');
  await expect(passport.getByRole('link', { name: /Download APK/ })).toHaveAttribute(
    'href',
    'https://github.com/tdater/RetroTV-releases/releases/download/v1.4/RetroTV-v1.4.apk',
  );
  await expect(passport).toContainText(
    '8c8566d4218d8e9a3d42999bf61030009edd136779e529b4933f9ffb50732513',
  );
  await expect(passport).toContainText('RetroTV-v1.4.apk');
  await expect(
    passport.getByRole('img', { name: /QR code for the RetroTV 1.4 download link/ }),
  ).toBeVisible();
  await expect(page.locator('#passport-blackbox-0-2-1')).toContainText('Early release');
});

test('copy link uses the clipboard', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/downloads');
  const passport = page.locator('#passport-retrotv-1-4');
  await passport.getByRole('button', { name: 'Copy link' }).click();
  await expect(passport.getByRole('button', { name: 'Copied' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('RetroTV-v1.4.apk');
});

test('setup trail saves progress locally and resets', async ({ page }) => {
  await page.goto('/projects/retrotv');
  const trail = page.locator('[data-trail]');
  await trail.getByLabel(/Install Downloader on the TV/).check();
  await expect(trail.locator('[data-progress]')).toHaveText('1 of 5 steps ticked');
  await page.reload();
  await expect(trail.getByLabel(/Install Downloader on the TV/)).toBeChecked();
  await trail.getByRole('button', { name: 'Reset checklist' }).click();
  await expect(trail.locator('[data-progress]')).toHaveText('0 of 5 steps ticked');
});

test('FAQ search, filter and deep links work', async ({ page }) => {
  await page.goto('/faq');
  await page.getByLabel('Search answers').fill('adapter');
  await expect(page.locator('#obd-adapter-not-found')).toBeVisible();
  await expect(page.locator('#retrotv-fire-tv')).toBeHidden();
  await page.getByLabel('Search answers').fill('qqqqq');
  await expect(page.getByText('No answers match.')).toBeVisible();
  await page.goto('/faq#retrotv-fire-tv');
  await expect(page.locator('#retrotv-fire-tv')).toBeInViewport();
});

test('workshop search finds guides and handles no results', async ({ page }) => {
  await page.goto('/search?q=fire+tv');
  await expect(page.getByRole('link', { name: /Install RetroTV/ })).toBeVisible();
  await page
    .getByLabel(/Search projects, guides/)
    .first()
    .fill('xylophone');
  await expect(page.getByText(/No results for/)).toBeVisible();
  await page.goto('/');
  await page.locator('#nav-q').fill('checksum');
  await page.locator('#nav-q').press('Enter');
  await expect(page).toHaveURL(/\/search\?q=checksum/);
  await expect(page.getByRole('link', { name: /SHA-256/ }).first()).toBeVisible();
});

async function fillFeedback(page: Page, message: string) {
  await page.goto('/feedback?project=blackbox');
  await page.getByLabel('Message').fill(message);
}

test('feedback: bug fields reveal, validation errors are announced', async ({ page }) => {
  await page.goto('/feedback');
  await expect(
    page.getByText('Constructive feedback, questions, suggestions, and ideas are welcome.'),
  ).toBeVisible();
  await expect(page.getByLabel('App version')).toBeHidden();
  await page.getByLabel('Bug report').check();
  await expect(page.getByLabel('App version')).toBeVisible();
  await page.getByRole('button', { name: 'Send feedback' }).click();
  await expect(page.getByRole('alert')).toContainText('Write at least 10 characters');
  await expect(page.getByLabel('Message')).toHaveAttribute('aria-invalid', 'true');
});

test('feedback: network failure keeps the text and stores nothing', async ({ page }) => {
  await fillFeedback(page, 'This one will fail to send on purpose.');
  await page.route('**/api/feedback', (r) => r.abort());
  await page.getByRole('button', { name: 'Send feedback' }).click();
  await expect(page.getByRole('alert')).toContainText('Nothing was stored');
  await expect(page.getByLabel('Message')).toHaveValue('This one will fail to send on purpose.');
});

test('feedback → moderation → public display, with XSS rendered as text', async ({
  page,
  context,
}) => {
  const payload = `<img src=x onerror="window.__pwned=1"> BLACKBOX idea ${Date.now()}`;
  await fillFeedback(page, payload);
  await page.getByLabel('Display name').fill('E2E Tester');
  await page.getByLabel('Reply email').fill('e2e@example.com');
  await page.getByRole('button', { name: 'Send feedback' }).click();
  await expect(page.getByRole('heading', { name: 'Received: waiting for review' })).toBeVisible();
  await expect(page.getByText("It isn't public yet")).toBeVisible();

  // Not public before approval
  await page.goto('/projects/blackbox');
  await expect(page.locator('#feedback')).toContainText('No approved comments yet');

  // Moderate
  const admin = await context.newPage();
  await admin.goto('/admin');
  await admin.getByLabel('Password').fill('wrong password here');
  await admin.getByRole('button', { name: 'Sign in' }).click();
  await expect(admin.getByRole('alert')).toContainText('not correct');
  await admin.getByLabel('Password').fill(TEST_PASSWORD);
  await admin.getByRole('button', { name: 'Sign in' }).click();
  const item = admin.locator('.admin__item', { hasText: 'BLACKBOX idea' });
  await expect(item).toContainText('e2e@example.com');
  await item.getByRole('button', { name: 'Approve (publish)' }).click();
  await expect(admin.getByRole('status')).toContainText('Done: approve');

  // Public, as text, without the private email
  await page.reload();
  const list = page.locator('#feedback [data-items]');
  await expect(list).toContainText('<img src=x onerror="window.__pwned=1">');
  await expect(list).toContainText('E2E Tester');
  await expect(list).not.toContainText('e2e@example.com');
  expect(
    await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned),
  ).toBeUndefined();
  await expect(list.locator('img')).toHaveCount(0);

  await admin.getByRole('button', { name: 'Sign out' }).click();
  await expect(admin.getByLabel('Password')).toBeVisible();
});

test('keyboard: skip link and focus visibility', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  const outline = await skip.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe('none');
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('low-glow preference persists and survives blocked storage', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Low-glow reading mode' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-glow', 'low');
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('blocked');
      },
    });
  });
  await page.goto('/projects/retrotv');
  await expect(page.locator('[data-storage-note]')).toBeVisible();
  await page.getByRole('button', { name: 'Low-glow reading mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-glow', 'low');
});

test('core content works without JavaScript', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('.finder__static')).toBeVisible();
  await page.goto('/downloads');
  await expect(page.locator('#passport-retrotv-1-4 .passport__url')).toHaveValue(
    /RetroTV-v1.4.apk/,
  );
  await page.goto('/projects/kitt-launcher');
  await expect(page.locator('#site-nav')).toBeVisible();
  await expect(page.locator('a[data-full]').first()).toHaveAttribute('href', /\.webp$/);
  // No-JS feedback posts straight to the API and lands on a receipt.
  await page.goto('/feedback');
  await page.getByLabel('Message').fill('Sent with JavaScript switched off entirely.');
  await page.getByRole('button', { name: 'Send feedback' }).click();
  await expect(page).toHaveURL(/\/feedback\/received\?s=public&id=fb_/);
  await ctx.close();
});

test('security headers are served', async ({ request }) => {
  const res = await request.get('/');
  const csp = res.headers()['content-security-policy'];
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(res.headers()['x-content-type-options']).toBe('nosniff');
  // Public pages must stay indexable and cacheable; only admin, receipts and the API opt out.
  expect(res.headers()['x-robots-tag']).toBeUndefined();
  expect(res.headers()['cache-control'] ?? '').not.toContain('no-store');
  const admin = await request.get('/admin');
  expect(admin.headers()['x-robots-tag']).toContain('noindex');
  const api = await request.get('/api/feedback?project=retrotv');
  expect(api.headers()['x-robots-tag']).toBe('noindex');
  expect(api.headers()['x-content-type-options']).toBe('nosniff');
});
