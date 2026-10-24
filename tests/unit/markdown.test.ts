import { describe, it, expect, vi } from 'vitest';
vi.mock('astro:content', () => ({ getCollection: async () => [] }));
const { inlineMd, compareVersions } = await import('../../src/lib/content');

describe('inlineMd', () => {
  it('escapes HTML before formatting', () => {
    expect(inlineMd('<script>alert(1)</script> **ok**')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt; <strong>ok</strong>',
    );
  });
  it('only links to site paths and https', () => {
    expect(inlineMd('[a](/guides/x)')).toBe('<a href="/guides/x">a</a>');
    expect(inlineMd('[a](https://example.com)')).toContain('rel="noopener noreferrer"');
    expect(inlineMd('[a](javascript:alert(1))')).not.toContain('<a');
  });
});

describe('compareVersions', () => {
  it('orders numerically', () => {
    expect(compareVersions('1.10', '1.9')).toBeGreaterThan(0);
    expect(compareVersions('0.2.1', '0.2.0')).toBeGreaterThan(0);
    expect(compareVersions('1.8', '1.8.0')).toBe(0);
  });
});
