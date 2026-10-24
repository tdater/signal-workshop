---
slug: install-blackbox
title: Install BLACKBOX and start your first investigation
summary: Install BLACKBOX (and optionally BLACKBOX Net), start a project, and update safely from older versions.
published: true
project: blackbox
topics: [Installation, Usage]
appliesTo: BLACKBOX 0.2.1 · Android 10+
time: About 10 minutes
prerequisites:
  - An Android phone or foldable running Android 10 or newer.
  - About 131 MB free for the APK, plus room for your records.
cautions:
  - BLACKBOX is in active development. If you're updating from 0.1.0, export an archive of anything that matters first.
steps:
  - title: Download the APK
    body: >-
      On the phone, use the BLACKBOX download on this site. If you want ping, port check and DNS
      tools, also download **BLACKBOX Net**. It's a separate app, the only edition with internet
      permission, and it keeps its own records.
    expect: '`BLACKBOX-0.2.1.apk` (and optionally `BLACKBOX-Net-0.2.1.apk`) is in Downloads.'
  - title: Install it
    body: >-
      Open the file. When Android asks, allow your browser or file manager to install unknown
      apps. That permission is for that one app only. Then tap **Install**.
    expect: BLACKBOX opens.
  - title: Start a project
    body: >-
      Pick a template (car, home, network, software, making, garden, health, kitchen or custom),
      or open the labelled sample project to look around. Everyday words like Problem, Try and
      Findings are the default, and a Technical switch brings back the stricter vocabulary.
    expect: Your first project is on the home screen.
  - title: Capture something
    body: Add a note, photo or reading. The home-screen widget and the quick-settings tile give you two-tap capture later.
    expect: The item appears on the project's timeline.
  - title: Pick a backup folder
    body: Choose an SD card, a USB stick or a folder your sync app watches. BLACKBOX keeps an archive per project there.
    expect: An archive appears in that folder.
result: BLACKBOX is installed with a project, a captured item and a backup location.
verify: Close BLACKBOX completely, reopen it, and check your note is still there. Saved records should survive a relaunch.
troubleshooting:
  - symptom: Records missing after updating from 0.1.0
    fix: The update is designed to keep records and encrypt them on first launch. If something is missing, import the archive you exported before updating. An import always creates a new project, so nothing gets overwritten.
  - symptom: The network tools are missing
    fix: They live in the separate BLACKBOX Net app, so the regular edition never needs internet permission.
reviewed: '2026-10-23'
internal:
  sources: [BLACKBOX-releases page Install section, v0.2.1 release notes]
  verified: '2026-10-23'
---
