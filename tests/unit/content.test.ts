import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { problems } from '../../src/data/finder';
import { PROJECT_IDS } from '../../functions/_lib/project-ids';

// Content integrity checks that run without building. The build itself validates schemas with
// zod, and scripts/postbuild-check.mjs checks the generated output.
const dir = (d: string) => new URL(`../../src/content/${d}/`, import.meta.url);
const yamls = (d: string) =>
  readdirSync(dir(d))
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => ({ file: f, ...parse(readFileSync(new URL(f, dir(d)), 'utf8')) }));
const guides = readdirSync(dir('guides')).map((f) => ({
  file: f,
  ...parse(readFileSync(new URL(f, dir('guides')), 'utf8').split('---')[1]),
}));
const projects = yamls('projects');
const releases = yamls('releases');
const faqs = parse(
  readFileSync(new URL('../../src/content/faqs.yaml', import.meta.url), 'utf8'),
) as { id: string; links?: { href: string }[]; projects?: string[] }[];
const published = projects.filter((p) => p.published);

describe('projects', () => {
  it('have unique slugs matching their file names', () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const p of projects) expect(p.file).toBe(`${p.slug}.yaml`);
  });
  it('functions/_lib/project-ids.ts is in sync (run scripts/sync-projects.mjs)', () => {
    expect([...PROJECT_IDS]).toEqual(published.map((p) => p.slug).sort());
  });
  it('setup trail steps point at published guides', () => {
    const live = new Set(guides.filter((g) => g.published).map((g) => g.slug));
    for (const p of published)
      for (const s of p.setupTrail ?? [])
        if (s.guide) expect(live, `${p.slug}: ${s.guide}`).toContain(s.guide);
  });
  it('media files exist', () => {
    for (const p of published)
      for (const m of p.media ?? [])
        for (const src of [m.src, m.thumb, m.poster].filter(Boolean))
          expect(
            () => readFileSync(new URL(`../../public${src}`, import.meta.url)),
            src,
          ).not.toThrow();
  });
});

describe('releases', () => {
  it('reference existing projects and editions', () => {
    for (const r of releases) {
      const p = projects.find((x) => x.slug === r.project);
      expect(p, r.file).toBeTruthy();
      if (r.edition && !['blackbox', 'blackbox-net'].includes(r.edition))
        expect(
          p.editions.map((e: { id: string }) => e.id),
          r.file,
        ).toContain(r.edition);
    }
  });
  it('have exactly one current release per project edition', () => {
    const keys = releases.filter((r) => r.current).map((r) => `${r.project}/${r.edition ?? ''}`);
    expect(new Set(keys).size).toBe(keys.length);
    for (const p of published)
      expect(
        keys.some((k) => k.startsWith(`${p.slug}/`)),
        p.slug,
      ).toBe(true);
  });
  it('never offer app bundles, insecure URLs or credential-bearing links', () => {
    for (const r of releases.filter((x) => x.artifact)) {
      expect(r.artifact.filename).toMatch(/\.apk$/);
      expect(r.artifact.url).toMatch(/^https:\/\//);
      expect(r.artifact.url).not.toMatch(/[?&](token|sig|X-Amz-)/i);
      expect(r.artifact.url.endsWith(`/${r.artifact.filename}`)).toBe(true);
      expect(r.artifact.sha256).toMatch(/^[0-9a-f]{64}$/);
    }
  });
  it('have unique artifact checksums', () => {
    const shas = releases.filter((r) => r.artifact).map((r) => r.artifact.sha256);
    expect(new Set(shas).size).toBe(shas.length);
  });
});

describe('guides and FAQ', () => {
  it('guide slugs are unique and match file names', () => {
    for (const g of guides) expect(g.file).toBe(`${g.slug}.md`);
  });
  it('FAQ ids are unique and internal links resolve to published guides or known pages', () => {
    const ids = faqs.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    const pages = new Set([
      '/feedback',
      '/privacy',
      '/downloads',
      '/faq',
      '/guides',
      '/projects',
      '/about',
    ]);
    const live = new Set(guides.filter((g) => g.published).map((g) => `/guides/${g.slug}`));
    for (const f of faqs)
      for (const l of f.links ?? [])
        expect(pages.has(l.href) || live.has(l.href), l.href).toBe(true);
  });
  it('finder problems only use tags that exist on a project', () => {
    const tags = new Set(published.flatMap((p) => p.tags));
    for (const pr of problems) for (const t of pr.tags) expect(tags, `${pr.id}: ${t}`).toContain(t);
  });
});
