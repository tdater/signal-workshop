# Source and content inventory

Verified 2026-10-23 with the authenticated GitHub account `tdater` (owner confirmed by account,
not by name matching). Everything listed was publicly reachable; no private repositories, Azure
Repos or local workspaces were provided, so none were reviewed.

## Repositories inspected

| Repository                      | What it is                                                   | Used for                                 |
| ------------------------------- | ------------------------------------------------------------ | ---------------------------------------- |
| tdater/KITT-Launcher.2          | KITT Launcher source (both editions build from it since 1.8) | Facts only; **never linked** (see below) |
| tdater/RetroTV                  | RetroTV source                                               | Facts only; **never linked**             |
| tdater/KITT-Launcher-releases   | Public releases + GitHub Pages site for the portrait edition | Releases, notes, screenshots, video      |
| tdater/KITT-Launcher.2-releases | Public releases for the landscape edition                    | Releases, notes                          |
| tdater/RetroTV-releases         | Public releases + Pages site                                 | Releases, banners, icon                  |
| tdater/BLACKBOX-releases        | Public releases + Pages site for BLACKBOX and BLACKBOX Net   | Releases, notes                          |
| tdater/tdater-BLACKBOX          | Empty repository                                             | Nothing                                  |
| tdater/KnightRiderLauncher      | Retired predecessor (last v1.7)                              | Mentioned as history only, no downloads  |

Existing app sites (tdater.github.io/KITT-Launcher-releases, /RetroTV-releases,
/BLACKBOX-releases) were inspected for typography, palette and structure and not modified. They
use Chakra Petch, IBM Plex, Share Tech Mono, Press Start 2P, Space Grotesk and VT323 with
single-page marketing layouts; this site deliberately uses none of those fonts or layouts.

## Projects on the site

| Slug          | Title                        | State              | Platforms                      | Current release          | Media                                                                                     |
| ------------- | ---------------------------- | ------------------ | ------------------------------ | ------------------------ | ----------------------------------------------------------------------------------------- |
| kitt-launcher | KITT Launcher (+ Launcher.2) | released           | Android head units             | 1.8 (both editions)      | Owner's published screenshots + 2 silent clips, captured in emulator demo mode (labelled) |
| retrotv       | RetroTV                      | released           | Android TV, Google TV, Fire TV | 1.2                      | Real banners and icon only; no screenshots published by owner                             |
| blackbox      | BLACKBOX (+ BLACKBOX Net)    | active-development | Android 10+ phones, foldables  | 0.2.1 beta (both builds) | None (honest empty state)                                                                 |

Full capabilities, requirements, permissions, limitations and Decision Trail entries with their
evidence are in each `src/content/projects/*.yaml`; each file's `internal.sources` says where
the facts came from.

## Releases and download verification

15 release records in `src/content/releases/` (5 current, 10 archived). All are existing public
GitHub release assets the owner already published, so `publicationApproved: true`.

On 2026-10-23 all five current APKs were downloaded anonymously (no login) and matched their
recorded size, ZIP/APK magic bytes and the SHA-256 digests GitHub publishes for each asset:

| File                     | Bytes       |
| ------------------------ | ----------- |
| KITT-Launcher-v1.8.apk   | 34,610,630  |
| KITT-Launcher.2-v1.8.apk | 34,610,814  |
| RetroTV-v1.2.apk         | 9,095,173   |
| BLACKBOX-0.2.1.apk       | 131,354,402 |
| BLACKBOX-Net-0.2.1.apk   | 131,354,442 |

Re-check any time with `npm run verify:downloads`. Caveat: the check ran through the build
environment's network proxy; it proves the files served match GitHub's digests, not that the apps
are safe or work on a given device. Signing certificates were not inspected.

## Privacy decisions from the inventory

- The KITT and RetroTV READMEs say the source is not published, yet those source repos are
  public. The site never links source repositories. Travis may want to check those repos'
  visibility (the site does not change it; that's his call).
- The GitHub profile lists a city. It is not used anywhere on the site.
- No email address, phone, employer or location is published. Contact is only via the moderated
  feedback form.

## Gaps

- No real RetroTV or BLACKBOX screenshots exist in published material. Not invented.
- Origin stories are limited to what release notes and READMEs state; anything more personal
  needs Travis (see [owner-review.md](owner-review.md)).
- Whether Travis has registered for Android developer verification is unknown; the guides explain
  the change without claiming either way.
