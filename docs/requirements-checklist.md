# Requirement-to-test checklist

Status on 2026-10-23. Test evidence: `npm test` (unit + integration, 72 passing) and
`npm run test:e2e` (Playwright on Chromium, 45 passing), `npm run check` (0 errors),
`npm run lint` (clean), `npm run build` (postbuild privacy/link/CSP checks pass),
`npm run verify:downloads` (5/5 match), `npm audit` (0 vulnerabilities). Unit = `tests/unit`,
Int = `tests/integration/api.test.ts`, E2E = `tests/e2e`.

Legend: ✅ built and tested · 🟡 built, partly verified · ⛔ blocked on owner · ➖ not applicable

## Information architecture and journeys

| Requirement                                                                                                                                        | Where                                             | Evidence                                                                                                        | Status                                                                  |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Routes: /, /projects, /projects/{slug}, /guides, /guides/{slug}, /faq, /about, /downloads, /feedback, /privacy, /community-guidelines, /admin, 404 | `src/pages/`                                      | E2E "every public area is reachable from navigation and reloads directly", "unknown project gives a useful 404" | ✅                                                                      |
| Find a project by problem without knowing repo names                                                                                               | ProjectFinder, /projects filters, /search         | E2E finder, library filters + empty state, workshop search + no results                                         | ✅                                                                      |
| Project pages: purpose, motivation, functionality, integrations, compatibility, limitations, install                                               | `projects/[slug].astro`, project YAML             | Schema requires the fields; axe + journeys load each page                                                       | ✅                                                                      |
| Distinguish released / development / experimental / unavailable                                                                                    | `state`, `channel`, `availability` fields; badges | Unit release tests; E2E passport; BLACKBOX shows "Early release"                                                | ✅ (no unavailable release exists today; the state renders from schema) |
| Guides with prerequisites, steps, expected result, verify, troubleshooting                                                                         | `guides/[slug].astro`                             | axe on a guide; links checked at build                                                                          | ✅                                                                      |
| FAQ search, filter, deep links                                                                                                                     | `faq.astro`                                       | E2E "FAQ search, filter and deep links work"                                                                    | ✅                                                                      |

## Distinctive features (brief asks for 3+)

| Feature                                                                  | Evidence                                                  | Status |
| ------------------------------------------------------------------------ | --------------------------------------------------------- | ------ |
| Problem-first Project Finder                                             | E2E deterministic matching; unit: finder tags exist       | ✅     |
| Guided Setup Trail (local progress, reset, storage fallback)             | E2E saves + resets; low-glow test covers blocked storage  | ✅     |
| Download Passport (one record → version, notes, size, SHA-256, QR, copy) | E2E passport + clipboard; unit one current per edition    | ✅     |
| Decision Trail with evidence                                             | Content schema requires `evidence` per entry              | ✅     |
| Workshop Search                                                          | E2E finds guides, handles no results; no-JS fallback text | ✅     |

## Downloads and release integrity

| Requirement                                                     | Evidence                                                                                    | Status                                                              |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Links work without login and return the expected artifact       | `npm run verify:downloads`: 5/5 size + magic + SHA-256 match                                | 🟡 verified through the build environment's proxy; not from a phone |
| Single canonical release record                                 | Unit: unique checksums, one current per edition; passport/QR/downloads read the same record | ✅                                                                  |
| Never offer .aab, insecure or token URLs; never "verified safe" | Schema refine + unit test                                                                   | ✅                                                                  |
| Invalid external metadata rejected                              | Schema errors fail the build (template check run 2026-10-23)                                | ✅                                                                  |

## Feedback and moderation

| Requirement                                            | Evidence                                                                                                             | Status                                   |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Durable storage, truthful status                       | Int: stored as pending, receipt says so; no-JS 303 receipt                                                           | ✅ (local D1; production D1 not created) |
| Verbatim disclaimer near submit and on guidelines page | `Disclaimer.astro`; axe on both pages                                                                                | ✅                                       |
| Unapproved never public; private never public          | Int: pending hidden, private can never be approved (DB CHECK + API)                                                  | ✅                                       |
| Server-enforced admin auth                             | Int: unauthenticated, forged cookie, wrong password, cross-origin login all rejected; unit requireAdmin fails closed | ✅                                       |
| CSRF, validation, spam limits, XSS                     | Int: CSRF/origin, malformed, honeypot, duplicates, rate limits, XSS stored as text; E2E XSS rendered as text         | ✅                                       |
| Failure cases: network failure, malformed input        | E2E network failure keeps text; Int malformed                                                                        | ✅                                       |

## Privacy and security

| Requirement                                                                | Evidence                                                                         | Status                                                 |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| No private data, drafts, internal metadata, secrets, source maps in output | `scripts/postbuild-check.mjs` on every build                                     | ✅                                                     |
| CSP tested with the real site                                              | Hash-based CSP in `_headers`; E2E no console errors/CSP violations; headers test | ✅ (local `wrangler pages dev`; not yet on Cloudflare) |
| Public pages indexable, admin/API noindex                                  | E2E headers test                                                                 | ✅                                                     |
| No trackers or third-party requests                                        | Self-hosted fonts; CSP `default-src 'self'` would block others                   | ✅                                                     |

## Accessibility, responsive, performance

| Requirement                                             | Evidence                                                                                  | Status                                          |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------- |
| WCAG 2.2 AA automated checks                            | axe on 15 pages, 0 violations                                                             | ✅ automated only; no manual screen-reader pass |
| 360, 390, 768, 1024, 1440, 1920 px, 200% zoom           | E2E overflow at each width + 640 px zoom equivalent; screenshots reviewed at 360 and 1440 | ✅                                              |
| Keyboard, focus, skip link, lightbox focus trap, Escape | E2E keyboard, lightbox, mobile menu                                                       | ✅                                              |
| Touch targets ≈ 44 px                                   | E2E on key controls (Pixel 7 emulation)                                                   | ✅ emulated, not a real device                  |
| Reduced motion                                          | E2E scanner animation stops                                                               | ✅                                              |
| Works without JavaScript                                | E2E core content without JS                                                               | ✅                                              |
| Core Web Vitals targets                                 | Lighthouse lab: LCP 1.1–2.2 s, CLS ≤ 0.049, TBT 0 ms                                      | 🟡 lab only; no field data                      |

## Handoff

| Requirement                                     | Where                                     | Status                                                                 |
| ----------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------- |
| Install/run/build, env var names without values | README                                    | ✅                                                                     |
| Content templates and release-update steps      | docs/content-workflow.md, docs/templates/ | ✅ templates validated against the schema                              |
| Moderation instructions                         | docs/moderation.md                        | ✅                                                                     |
| Deployment, backup/restore, rollback            | docs/deployment.md                        | ✅ written; ⛔ not executed (no Cloudflare account access or approval) |
| Source repository                               | —                                         | ⛔ needs Travis to create the repo                                     |
| Deployed                                        | —                                         | ⛔ not deployed                                                        |

## Not verified

- Browsers other than Chromium (Firefox and WebKit were not run).
- Real Android phones, TVs or head units opening the site or installing from it.
- Manual screen-reader testing (NVDA, VoiceOver, TalkBack).
- Anything on Cloudflare itself: production D1, secrets, headers on the real edge, free-plan
  limits under load.
- Real-user performance data.
