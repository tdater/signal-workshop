# Decisions log

Newest last. Each entry: decision, why, what was rejected.

## 2026-10-23 Architecture: Astro static + Cloudflare Pages Functions + D1

- **Why:** Content is mostly static and changes when Travis publishes something, so static HTML
  is the fastest and cheapest thing that works. Feedback needs durable storage and real
  server-side auth, which is a few small endpoints. Pages + Functions + D1 covers both on one
  free plan with no servers to patch.
- **Rejected:** a CMS (no concrete need; YAML files in git are portable and reviewable), a
  framework SPA (no interactivity that needs it), hosting on the dev VM (fragile, not free to
  keep online), GitHub Pages alone (no server-side feedback or auth), third-party comment widgets
  (trackers, no control over moderation or privacy).

## 2026-10-23 APKs stay on GitHub releases

Pages caps files at 25 MiB and BLACKBOX is 131 MB. GitHub release assets are public, need no
login and come with SHA-256 digests. The site links to them and never re-hosts or rebuilds
binaries.

## 2026-10-23 Owner auth: password hash in a secret + signed stateless session

PBKDF2-SHA256 (100,000 iterations, the Workers maximum) hash in `ADMIN_PASSWORD_HASH`; HMAC
signed, HttpOnly, Secure, SameSite=Strict `__Host-` cookie for 8 hours; CSRF token required on
every write; Origin checked; login rate-limited. Fails closed when secrets are missing.
**Rejected:** hidden admin URL or client-side password (brief forbids), OAuth provider (extra
account and moving parts for a single owner). Cloudflare Access is a good optional extra layer in
front of `/admin` and `/api/admin/*` if Travis wants it later; it's free for small teams.

## 2026-10-23 Privacy by construction

- Public and private data are separated in the schema (`internal` blocks) and stripped in one
  place (`src/lib/content.ts`). A post-build scan fails the build if internal provenance text,
  email addresses, secret markers, source-repo links, draft slugs, source maps or any term in the
  gitignored `scripts/private-terms.txt` appear in `dist/`.
- Visitor IPs are only stored as salted hashes for rate limiting, deleted after 24 hours.
- No analytics, trackers, third-party fonts or embeds. Fonts are self-hosted.
- Source repositories are never linked, even though some are public (see inventory).

## 2026-10-23 Visual direction "Signal Workshop"

Near-black surfaces, one mint signal colour for the site, a yellow focus ring, and per-project
accents with a motif (KITT red scanner, RetroTV magenta CRT, BLACKBOX orange trace, AIOS blue orbit). Type is
Bricolage Grotesque (display), Atkinson Hyperlegible Next (body, chosen for legibility) and
JetBrains Mono (data such as versions and hashes). A persisted "low glow" toggle and
`prefers-reduced-motion` turn off glow and animation. Chosen to be clearly different from the
existing app pages' retro display fonts.

## 2026-10-23 Distinctive features built (five)

Problem-first Project Finder, Guided Setup Trail, Download Passport, Decision Trail, Workshop
Search. Each works without JavaScript in a reduced form (static lists, plain links, server-side
search page fallback text). Not built: Capability Atlas (three projects don't justify it) and
Idea-to-Release Trail (needs real moderated suggestions first).

**Proposed next original idea (not built):** "What changed since my version". A visitor picks the
version they have installed and sees every release note between it and the current release,
built from the existing release records. Fits the content model with no new data.

## 2026-10-23 Static HTML whitespace kept

`compressHTML: false`. Astro's compression removed spaces between inline elements, which ran
badges and link text together for screen readers (caught by axe). The cost is a few KB.

## 2026-10-23 Middleware scoped to /api

A root Pages middleware also wraps static pages; it was adding `x-robots-tag: noindex` and
`cache-control: no-store` to every page. Moved to `functions/api/_middleware.ts`; an e2e test now
asserts public pages are indexable and cacheable.

## 2026-10-23 Dependencies

Upgraded to Astro 7.3 and Vitest 4.1 to clear all `npm audit` advisories (several Astro XSS
advisories and a critical tinypool issue in the test runner). Astro pinned below 7.4 because 7.4
requires Node 22.23+, newer than the build environment. `npm audit`: 0 vulnerabilities on
2026-10-23.

## Performance budget

Per page, first load: HTML ≤ 120 KB, CSS ≤ 40 KB, JS ≤ 15 KB, fonts ≤ 200 KB (cached after the
first page), no image above the fold larger than needed. Measured 2026-10-23 (lab only, local
`wrangler pages dev`, Lighthouse 12 mobile defaults): home 209 KiB total, LCP 1.1 s, CLS 0.049,
TBT 0 ms; KITT Launcher page 222 KiB, LCP 2.2 s, CLS 0, TBT 0 ms. No field data exists yet.
