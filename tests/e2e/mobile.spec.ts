import { test, expect } from '@playwright/test';

test('mobile menu opens, closes with Escape, and reaches every area', async ({ page }) => {
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Menu' });
  await expect(toggle).toBeVisible();
  await expect(page.locator('#site-nav')).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(
    page.locator('#site-nav').getByRole('link', { name: 'Downloads', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#site-nav')).toBeHidden();
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Feedback' })
    .tap();
  await expect(page).toHaveURL(/\/feedback$/);
});

test('touch targets on key controls are at least 44px tall', async ({ page }) => {
  await page.goto('/downloads');
  for (const loc of [
    page.getByRole('button', { name: 'Menu' }),
    page.locator('.passport__download').first(),
  ]) {
    const box = await loc.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
});
