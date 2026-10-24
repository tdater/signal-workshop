// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// The public domain is not decided yet. Set PUBLIC_SITE_URL (e.g. https://example.com) at build
// time to turn on canonical URLs and the sitemap; without it neither is emitted.
const site = process.env.PUBLIC_SITE_URL || undefined;

export default defineConfig({
  // Keep the whitespace between inline elements so badges, links and labels never run together
  // for screen readers or copy and paste.
  compressHTML: false,
  site,
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: site
    ? [sitemap({ filter: (page) => !/\/(admin|feedback\/received)/.test(page) })]
    : [],
  // No data: URIs for fonts or images, so the CSP can stay strict (font-src 'self').
  vite: { build: { sourcemap: false, assetsInlineLimit: 0 } },
});
