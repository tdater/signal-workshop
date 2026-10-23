# Signal Workshop

Travis Dater's personal project site: KITT Launcher, RetroTV and BLACKBOX, with guides, an FAQ,
verifiable downloads and moderated feedback.

- **Frontend:** [Astro 7](https://docs.astro.build/) static pages built from validated content
  files in `src/content/`. No client framework; small vanilla scripts only where they help.
- **Backend:** [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/) in
  `functions/` with a [D1](https://developers.cloudflare.com/d1/) database for feedback and
  moderation. Nothing else is server-side.
- **Downloads:** APKs stay on their public GitHub release assets. The site links to them and shows
  the size and SHA-256 from one release record per version.

Why this stack, and what was rejected, is in [docs/decisions.md](docs/decisions.md).

## Requirements

- Node.js 22.12 or newer (tested on 22.22) and npm.
- For deployment only: a Cloudflare account (the free plan is enough, see
  [docs/deployment.md](docs/deployment.md)).

## Run it locally

```sh
npm ci
cp .dev.vars.example .dev.vars   # then fill in the values, see "Environment variables"
npm run db:migrate:local          # creates the local D1 database under .wrangler/
npm run build                     # content sync + Astro build + privacy/link/CSP checks
npm run preview                   # http://localhost:8788 with the real feedback API
```

`npm run dev` (http://localhost:4321) gives hot reload for pages and content, but has no API, so
the feedback form and moderation only work under `npm run preview`.

## Environment variables

Set these as Cloudflare Pages **secrets** in production and in `.dev.vars` locally. Never commit
values. `.dev.vars.example` lists the names.

| Name                  | What it is                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `ADMIN_PASSWORD_HASH` | PBKDF2 hash of the moderation password. Generate with `npm run admin:hash`.                    |
| `SESSION_SECRET`      | Random string (48+ bytes) that signs the owner session cookie. `openssl rand -base64 48`       |
| `IP_HASH_SALT`        | Random string used to hash visitor IPs for rate limiting. IPs are never stored in plain text.  |
| `ALLOWED_ORIGINS`     | Optional. Comma-separated extra origins allowed to POST, e.g. a custom domain during cutover.  |
| `PUBLIC_SITE_URL`     | Build-time, optional. The canonical `https://` origin. Enables canonical URLs and the sitemap. |

If `ADMIN_PASSWORD_HASH` or `SESSION_SECRET` is missing, moderation fails closed: `/admin` says it
isn't configured and every admin API call is refused.

## Scripts

| Command                     | Does                                                                                                                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run build`             | Syncs project ids for the API, builds, then fails on leaked private data, broken internal links or anchors, and writes the CSP with inline-script hashes to `dist/_headers`. |
| `npm run check`             | `astro check` (pages, content schemas) and TypeScript for `functions/`.                                                                                                      |
| `npm run lint`              | Prettier check.                                                                                                                                                              |
| `npm test`                  | Unit tests, and integration tests against a real local `wrangler pages dev` + D1.                                                                                            |
| `npm run test:e2e`          | Playwright: journeys, axe WCAG 2.2 AA, widths 360 to 1920, 200% zoom, mobile, no-JS. Run `npm run build` first.                                                              |
| `npm run verify:downloads`  | Downloads every current APK and checks size, APK magic bytes and SHA-256 against the release files. Add `-- --all` for old releases too.                                     |
| `npm run admin:hash`        | Prompts for a password on stdin and prints `ADMIN_PASSWORD_HASH`.                                                                                                            |
| `npm run db:migrate:local`  | Applies `migrations/` to the local D1.                                                                                                                                       |
| `npm run db:migrate:remote` | Applies `migrations/` to the production D1.                                                                                                                                  |

Playwright uses the Chromium at `/opt/pw-browsers/...` in the build container. Elsewhere, run
`npx playwright install chromium` once, or set `CHROMIUM` to a Chrome binary.

## Everyday tasks

- Add a project, release, guide or FAQ answer: [docs/content-workflow.md](docs/content-workflow.md)
  (templates in [docs/templates/](docs/templates/)).
- Moderate feedback: [docs/moderation.md](docs/moderation.md).
- Deploy, back up, restore, roll back: [docs/deployment.md](docs/deployment.md).

## Project records

- [docs/requirements-checklist.md](docs/requirements-checklist.md): every brief requirement mapped
  to where it is built and how it is tested, plus what is not verified.
- [docs/decisions.md](docs/decisions.md): architecture and design decisions.
- [docs/inventory.md](docs/inventory.md): verified project and release inventory with sources.
- [docs/research.md](docs/research.md): references and what was taken from them.
- [docs/owner-review.md](docs/owner-review.md): things only Travis can confirm before launch.
- [docs/project-brief.md](docs/project-brief.md): the original brief (authoritative).
