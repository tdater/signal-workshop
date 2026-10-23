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

## Media wanted (optional)

- Real RetroTV screenshots or a short silent clip (TV capture, no personal accounts visible).
- Real BLACKBOX screenshots with demo data. The page currently says honestly that there are none.
- KITT screenshots on the site are your published emulator demo-mode captures and are labelled
  that way. Real head-unit photos would be better if you have them.

## Approvals needed to go live

- Create the GitHub repository for this site (the build session can't create repos).
- Go-ahead for the first public deployment, and a Cloudflare account to deploy into (free plan).
  Steps: [deployment.md](deployment.md).
- A domain, if you want one other than `*.pages.dev`. Buying one is a spending decision.
