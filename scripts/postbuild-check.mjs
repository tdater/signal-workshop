// Runs after `astro build`. It (1) writes dist/_headers with a Content-Security-Policy that
// includes hashes of the inline scripts actually emitted, (2) scans the generated output for
// anything private, and (3) checks every internal link and anchor. Any problem fails the build.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'yaml';

const dist = new URL('../dist/', import.meta.url).pathname;
const root = new URL('../', import.meta.url).pathname;
const problems = [];

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const files = walk(dist);
const html = files.filter((f) => f.endsWith('.html'));
const text = files.filter((f) => /\.(html|js|css|json|txt|xml)$/.test(f));

// 1. CSP with inline script hashes
const hashes = new Set();
for (const f of html) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(
    /<script(?![^>]*\bsrc=)(?![^>]*type="application\/json")[^>]*>([\s\S]*?)<\/script>/g,
  )) {
    hashes.add(`'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`);
  }
}
const csp = [
  "default-src 'self'",
  `script-src 'self' ${[...hashes].sort().join(' ')}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "media-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');
const template = readFileSync(join(root, 'scripts/headers.template'), 'utf8');
writeFileSync(join(dist, '_headers'), template.replace('__CSP__', csp));

// 2. Privacy scan of generated output
const forbidden = new Set([
  'github.com/tdater/KITT-Launcher.2"',
  'github.com/tdater/KITT-Launcher.2/',
  'github.com/tdater/RetroTV"',
  'github.com/tdater/RetroTV/',
  'tdater-BLACKBOX',
  'KnightRiderLauncher',
  'pbkdf2-sha256$',
  'ADMIN_PASSWORD_HASH=',
  'SESSION_SECRET=',
]);
// Personal terms that must never ship (home town, private addresses...) go one per line in the
// gitignored scripts/private-terms.txt, so the list itself never lands in the repo.
const privateTerms = join(root, 'scripts/private-terms.txt');
if (existsSync(privateTerms))
  for (const t of readFileSync(privateTerms, 'utf8')
    .split('\n')
    .map((l) => l.trim()))
    if (t && !t.startsWith('#')) forbidden.add(t);
const yamlDirs = ['src/content/projects', 'src/content/releases'];
const drafts = [];
for (const d of yamlDirs) {
  for (const f of readdirSync(join(root, d))) {
    const data = parse(readFileSync(join(root, d, f), 'utf8'));
    for (const s of data.internal?.sources ?? []) if (s.length > 12) forbidden.add(s);
    if (data.internal?.notes) forbidden.add(data.internal.notes);
    if (data.published === false) drafts.push(data.slug);
  }
}
for (const f of readdirSync(join(root, 'src/content/guides'))) {
  const fm = readFileSync(join(root, 'src/content/guides', f), 'utf8').split('---')[1];
  const data = parse(fm);
  if (data.internal?.notes) forbidden.add(data.internal.notes);
  if (data.published === false) drafts.push(data.slug);
}
for (const f of text) {
  const src = readFileSync(f, 'utf8');
  for (const s of forbidden)
    if (src.includes(s)) problems.push(`private string in ${relative(dist, f)}: ${s.slice(0, 60)}`);
  for (const d of drafts)
    if (src.includes(`/guides/${d}`) || src.includes(`/projects/${d}`))
      problems.push(`draft "${d}" referenced in ${relative(dist, f)}`);
  const emails =
    src
      .match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)
      ?.filter((e) => !/\.(webp|png|js|css)$/.test(e)) ?? [];
  if (emails.length) problems.push(`email-like string in ${relative(dist, f)}: ${emails[0]}`);
}
for (const d of drafts)
  if (
    existsSync(join(dist, 'guides', `${d}.html`)) ||
    existsSync(join(dist, 'projects', `${d}.html`))
  )
    problems.push(`draft page built: ${d}`);
for (const f of files)
  if (f.endsWith('.map')) problems.push(`source map published: ${relative(dist, f)}`);

// 3. Internal links and anchors
const idsCache = new Map();
const ids = (file) => {
  if (!idsCache.has(file))
    idsCache.set(
      file,
      new Set([...readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])),
    );
  return idsCache.get(file);
};
const resolve = (path) => {
  const clean = decodeURI(path.replace(/^\//, ''));
  if (clean === '') return join(dist, 'index.html');
  for (const c of [clean, `${clean}.html`, join(clean, 'index.html')]) {
    const p = join(dist, c);
    if (existsSync(p) && statSync(p).isFile()) return p;
  }
  return null;
};
const dynamic = /^\/api\//;
let checked = 0;
for (const f of html) {
  const src = readFileSync(f, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
  const page =
    '/' +
    relative(dist, f)
      .replace(/(index)?\.html$/, '')
      .replace(/\/$/, '');
  for (const m of src.matchAll(/\s(?:href|src|poster)="([^"]+)"/g)) {
    const url = m[1]
      .replace(/&amp;/g, '&')
      .replace(/&#(\d+);/g, (_e, n) => String.fromCharCode(Number(n)));
    if (/^(https?:|mailto:|data:|tel:)/.test(url) || dynamic.test(url)) continue;
    const [pathPart, hash] = url.split('#');
    const path = pathPart.split('?')[0] || page || '/';
    const target = resolve(path);
    checked++;
    if (!target) {
      problems.push(`broken link in ${relative(dist, f)}: ${url}`);
      continue;
    }
    if (hash && target.endsWith('.html') && !ids(target).has(hash))
      problems.push(`missing anchor in ${relative(dist, f)}: ${url}`);
  }
}

if (problems.length) {
  console.error(`postbuild-check: ${problems.length} problem(s)\n - ` + problems.join('\n - '));
  process.exit(1);
}
console.log(
  `postbuild-check: CSP written with ${hashes.size} inline script hash(es); ${text.length} files scanned for private data; ${checked} internal links verified.`,
);
