# Adding and updating content

All public content is YAML or Markdown in `src/content/`. No layout code needs touching. Every
file is validated when you build (`npm run build`) and by `npm test`; errors name the file and
field. Templates are in [templates/](templates/).

Anything under an `internal:` key is provenance for you. It is never rendered, indexed or shipped,
and the build fails if it leaks into `dist/`.

## Publish a new release (most common)

1. Publish the APK as a GitHub release asset as usual (public release repo).
2. Get the size and hash. Either from the release page (GitHub shows a `sha256:` digest per
   asset), or locally: `stat -c %s MyApp-1.3.apk` and `sha256sum MyApp-1.3.apk`.
3. Copy [templates/release.yaml](templates/release.yaml) to
   `src/content/releases/<project>-<version-with-dashes>.yaml` (e.g. `retrotv-1-3.yaml`) and fill
   it in.
4. In the previous release file for the same project and edition, set `current: false` and
   `channel: archived`.
5. Run:

   ```sh
   npm run verify:downloads   # downloads the APK and checks size + SHA-256 against your file
   npm run build && npm test
   ```

6. Commit, push, deploy (see [deployment.md](deployment.md)).

The project page, downloads page, quick-download panels, QR code and search index all read that
one file. Rules the build enforces: https only, `.apk` only (never `.aab`), no token or signed
URLs, a 64-character SHA-256, and exactly one current release per project edition.

Don't label a release "stable", "signed" or "verified safe" in notes unless you can back it up.
Use `channel: beta` for early builds; the site shows it as "Early release".

## Add a guide

Copy [templates/guide.md](templates/guide.md) to `src/content/guides/<slug>.md`. Steps, expected
results, troubleshooting and cautions are separate fields so every guide renders the same way.
Inline Markdown only (bold, code, links to site paths or https). Set `published: true` when it's
ready; drafts (`published: false`) never appear anywhere, including search.

To link a guide from a project's Guided Setup Trail, add a step to the project's `setupTrail`
with `guide: <slug>`.

## Add an FAQ answer

Append [templates/faq-entry.yaml](templates/faq-entry.yaml) to `src/content/faqs.yaml`. The `id`
is the permanent `#anchor` people will share, so don't rename it later. Links must point at
published guides, known pages or https.

## Add a project

1. Copy [templates/project.yaml](templates/project.yaml) to `src/content/projects/<slug>.yaml`.
2. Leave `published: false` while you fill it in. Build to check it.
3. Add at least one release file (or none, and the page shows an honest "no release yet" state).
4. Reuse existing `tags` where they fit, so the Project Finder on the home page can match it. To
   add a new problem to the finder, edit `src/data/finder.ts`.
5. Set `published: true`, build, test, deploy.

The build regenerates `functions/_lib/project-ids.ts` so the feedback form accepts the new
project automatically.

## Media

Put files in `public/media/<project>/` and list them under the project's `media`:

```yaml
media:
  - kind: screenshot # screenshot | video | banner
    src: /media/my-project/home.webp
    thumb: /media/my-project/home-thumb.webp # optional, ~480px wide
    width: 1280 # real pixel size of src (prevents layout shift)
    height: 800
    alt: What the screenshot shows, for someone who can't see it
    caption: One sentence shown under it
    group: Screens # gallery section heading
    evidence: Captured on a Pixel 7, real data # how it was made, shown to visitors
```

Videos also take `poster:` and never autoplay. Use real captures only, and say in `evidence` if a
screen was a demo mode or emulator. Prefer WebP for images and keep each file under a few MB.
Check screenshots for personal data (notifications, account names, locations) before adding.

To replace a picture, overwrite the file with the same name and update `width`/`height` if the
size changed.

## Change site-wide text

- About page: `src/pages/about.astro`.
- Privacy, community guidelines: `src/pages/privacy.astro`, `src/pages/community-guidelines.astro`.
  The moderation disclaimer text lives once in `src/components/Disclaimer.astro`; keep its wording.
- Navigation: `src/layouts/Base.astro`.
- Feedback limits (lengths, rate limits, retention): `functions/_lib/rules.ts`.
