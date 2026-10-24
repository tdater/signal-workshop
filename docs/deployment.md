# Deployment, backups and rollback

Status on 2026-10-23: **not deployed.** Nothing has been created in any Cloudflare account. First
public deployment needs Travis's go-ahead (brief: "First public deployment ... without release
approval" is an escalation boundary).

## Target

Cloudflare Pages (static `dist/` plus `functions/`) with one D1 database. Checked 2026-10-23
against Cloudflare's published free-plan limits: Pages Functions share the Workers free allowance
(100,000 requests/day); D1 free daily limits are enforced since 2026-09-01 (see
[research.md](research.md)). Pages caps a single file at 25 MiB, which is why APKs stay on GitHub
releases. Only `/api/*` requests run a Function; static pages don't count against the request
quota.

Expected cost at personal-site traffic: $0. If the daily Functions or D1 limit is hit on the free
plan, the API returns errors until the daily reset; static pages and downloads keep working.

## Current setup (2026-10-24)

- D1 database `signal-workshop` was created in the dashboard and `migrations/0001_init.sql` was
  run by hand in the D1 console, so wrangler's migration history doesn't know about it. Before the
  first `npm run db:migrate:remote` for a future migration, mark 0001 as applied by running this
  once in the D1 console:
  `CREATE TABLE IF NOT EXISTS d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL); INSERT INTO d1_migrations (name) VALUES ('0001_init.sql');`
- The site deploys through the Pages Git integration (Workers & Pages → signal-workshop), because
  the build sandbox can't reach the Cloudflare API. Preview builds come from non-production
  branches; `main` is the production branch. Pushing to a branch starts its build (the Pages
  dashboard has no manual "create deployment" for Git projects). When creating the project, use
  the **Pages** flow ("Looking to deploy Pages? Get started"), not the Workers "Create an app" flow,
  whose `wrangler deploy` command doesn't fit this project.

## First deployment (one time, about 15 minutes)

Run from the repo root on a machine with Node 22.12+. Each step is copy and paste.

```sh
npm ci
npx wrangler login                                  # opens the browser to authorize wrangler
npx wrangler d1 create signal-workshop              # prints a database_id
```

Paste the printed `database_id` into `wrangler.toml` (replacing the zeros) and commit it. The id
is not a secret.

```sh
npm run db:migrate:remote
npx wrangler pages project create signal-workshop --production-branch main
npm run admin:hash                                  # type the moderation password, copy the output
npx wrangler pages secret put ADMIN_PASSWORD_HASH --project-name signal-workshop
openssl rand -base64 48 | npx wrangler pages secret put SESSION_SECRET --project-name signal-workshop
openssl rand -base64 32 | npx wrangler pages secret put IP_HASH_SALT --project-name signal-workshop
PUBLIC_SITE_URL=https://signal-workshop.pages.dev npm run build
npx wrangler pages deploy dist --project-name signal-workshop --branch main
```

Replace `PUBLIC_SITE_URL` with the real domain once there is one. Then:

1. Open the site, submit a test comment on `/feedback`, sign in at `/admin`, approve it and check
   it appears on the project page. Remove it afterwards.
2. Run `npm run verify:downloads` (checks every download link the site shows).

### Optional: deploy on every push

In the Cloudflare dashboard: Workers & Pages → signal-workshop → Settings → Builds → Connect to
Git, pick the repo, build command `npm run build`, output directory `dist`, and add
`PUBLIC_SITE_URL` as a build environment variable. Secrets set above carry over. Branch pushes
get preview URLs (`<hash>.signal-workshop.pages.dev`), which `_headers` marks `noindex`.

### Custom domain

Workers & Pages → signal-workshop → Custom domains → Set up a domain. Changing DNS on an existing
domain is a production change; do it deliberately. After it works, rebuild with
`PUBLIC_SITE_URL=https://<domain>` so canonical URLs and the sitemap use it.

## Backups

Everything except feedback is in git. Feedback lives only in D1.

```sh
# Full export to a dated SQL file (keep these somewhere private: they contain reply emails)
npx wrangler d1 export signal-workshop --remote --output "backup-$(date +%F).sql"
```

Suggested rhythm: weekly, and before any migration. D1 also has
[Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/) point-in-time restore
(30 days on paid plans, 7 days on free):

```sh
npx wrangler d1 time-travel info signal-workshop
npx wrangler d1 time-travel restore signal-workshop --timestamp <ISO-8601 time>
```

Restore from an export into a fresh database:

```sh
npx wrangler d1 create signal-workshop-restore
npx wrangler d1 execute signal-workshop-restore --remote --file backup-YYYY-MM-DD.sql
```

then point `database_id` in `wrangler.toml` at it and redeploy.

## Rollback

- **Site code or content:** Workers & Pages → signal-workshop → Deployments → pick the last good
  deployment → "Rollback to this deployment". Instant, no rebuild. Or `git revert` and redeploy.
- **Database migration:** migrations only add things. If one goes wrong, restore with Time Travel
  to just before it (above), then roll back the deployment that needed it.
- **Bad release record (wrong checksum or link):** fix or revert the file in
  `src/content/releases/`, run `npm run verify:downloads`, rebuild, deploy.

## Monitoring

No analytics or trackers by design. To see API errors: Workers & Pages → signal-workshop →
Functions → Real-time logs. Logs never contain submission text, emails or passwords.
