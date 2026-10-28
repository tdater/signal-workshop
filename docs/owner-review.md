# Owner review before launch

Things only Travis can confirm. The site is built so each is a small text edit.

## Needs a yes/no or a fact

1. **About page** (`src/pages/about.astro`). Written in first person from the brief's interests
   list. Check every sentence sounds like you and is true, especially "test it on real hardware"
   and the "Where it's heading" paragraph.
2. **Origin stories** (`problem` / `why` in each project file). Built only from release notes and
   READMEs. Add the real "this annoyed me" story if you want one; keep it factual.
3. **Source repositories.** The KITT Launcher and RetroTV READMEs say source isn't published, but
   `tdater/KITT-Launcher.2` and `tdater/RetroTV` are public on GitHub. The site never links them.
   Whether to change their visibility is your call; nothing was changed.
4. **Android developer verification.** Do you plan to register? The install guide currently
   explains the change and the adb/advanced-flow route without saying either way. If you
   register, add one line to `src/content/guides/installing-android-apps.md`.
5. **Hosting statement on the privacy page** (`src/pages/privacy.astro`) names Cloudflare as host
   and processor. Confirm once the deployment target is final.
6. **Microphone fix guide** (`src/content/guides/kitt-microphone-fix.md`) is a draft
   (`published: false`) because the fix steps weren't verifiable from published material.
   Confirm or delete.
7. **AIOS page (added 2026-10-28)** (`src/content/projects/aios.yaml`). `tdater/aios` is public
   and MIT-licensed, but it's the source repo, so the site doesn't link it, and its releases are
   debug-signed APKs attached to that repo, so the site offers no download. Is AIOS OK to show
   publicly at all? If you want a download, publish a release-signed APK in a separate public
   release repo (like the other apps) and add a release file. The screenshots are the repo's own
   sample-data renders of interface v0.2.0; newer captures would be better.
8. **"Holo" KITT launchers.** I read this as the film editions (Hill Valley 2015 shows HOLO and
   uses the holographic café host character). If you meant something separate, it isn't in any
   GitHub repo this session could see.
9. **About and home copy** got small additions for AIOS ("plus an AI workspace for the PC", and
   the "Where it's heading" paragraph). Check they sound like you.

## Media wanted (optional)

- Real RetroTV screenshots or a short silent clip (TV capture, no personal accounts visible).
- Real BLACKBOX screenshots with demo data. The page currently says honestly that there are none.
  (BLACKBOX had no new releases or commits as of 2026-10-28.)
- AIOS captures of the newer screens (life missions, ambient display, computer check results).
- KITT screenshots on the site are your published emulator demo-mode captures and are labelled
  that way. Real head-unit photos would be better if you have them.

## Approvals needed to go live

- Create the GitHub repository for this site (the build session can't create repos).
- Go-ahead for the first public deployment, and a Cloudflare account to deploy into (free plan).
  Steps: [deployment.md](deployment.md).
- A domain, if you want one other than `*.pages.dev`. Buying one is a spending decision.
