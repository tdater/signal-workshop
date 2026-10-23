import { defineConfig, devices } from '@playwright/test';

// Uses the Chromium that ships with this environment when present; otherwise Playwright's own.
const executablePath =
  process.env.CHROMIUM ??
  (process.env.CI_PLAYWRIGHT_BUNDLED
    ? undefined
    : '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome');

export default defineConfig({
  testDir: 'tests/e2e',
  globalSetup: './tests/support/playwright-global.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:8790',
    trace: 'retain-on-failure',
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      testIgnore: /mobile\.spec\.ts/,
    },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /mobile\.spec\.ts/ },
  ],
});
