---
slug: install-kitt-launcher
title: Install KITT Launcher and make it your home screen
summary: Pick the right edition for your head unit, install the APK and set it as the default home app.
published: true
project: kitt-launcher
topics: [Installation, Head units]
appliesTo: KITT Launcher and KITT Launcher.2 1.8–1.9 · Android 7.0+
time: About 10 minutes
prerequisites:
  - An Android head unit running Android 7.0 or newer.
  - A way to get the APK onto it, either its own browser over Wi-Fi or hotspot, or a USB stick.
  - The car parked. Head units are much easier to set up when you aren't driving, shockingly.
steps:
  - title: Pick your edition
    body: >-
      **KITT Launcher** is laid out for big portrait screens (11 to 13 inch, Tesla-style). **KITT
      Launcher.2** is for 7 to 10 inch landscape screens (1024×600, 1280×720, 1280×800) and turns on
      Lite mode by itself on budget units with 3 GB of RAM or less, or four CPU cores or fewer.
      They have different app IDs, so you can install both and keep the one you like.
    expect: You know which APK to download.
  - title: Download the APK
    body: >-
      On the head unit, open this site's [downloads page](/downloads) and tap the download button
      for your edition. Or download it on a computer, check the SHA-256 (see [verify a
      download](/guides/verify-a-download)) and copy it over on a USB stick.
    expect: A file named like `KITT-Launcher.2-v1.9.apk` is in Downloads or on the stick.
  - title: Open it and allow the install
    body: >-
      Open the file from the browser's downloads or a file manager. Android asks you to allow
      *that app* (the browser or file manager) to install unknown apps. This permission only lets
      that one app hand APKs to the installer. You can switch it back off afterwards under
      Settings → Apps → Special app access → Install unknown apps. The exact path varies by head
      unit. On Android 7, the switch is a single "Unknown sources" setting under Security.
    expect: The installer screen shows KITT Launcher with an Install button.
  - title: Install
    body: Tap **Install**, then **Open**.
    expect: The KITT home screen appears with the red scanner sweeping across the top.
  - title: Make it the home screen
    body: >-
      Press the head unit's Home button. When Android asks which home app to use, choose **KITT
      Launcher** (or **KITT Launcher.2**), then **Always**. If it never asks, look for Default apps
      → Home app in Android Settings. Some head units bury this in a manufacturer settings app.
    expect: Pressing Home always returns to KITT's Drive page.
  - title: Run System check
    body: >-
      Open **KITT Config**. **System check** at the top lists every permission and setting KITT
      needs, each with a fix button. It also warns you if another launcher has taken over the home
      screen.
    expect: System check shows nothing left to fix, or only features you've chosen not to use.
result: KITT Launcher is installed, set as the home app, and has the permissions it needs.
verify: >-
  Restart the head unit. It should boot straight into KITT. If it boots into the stock launcher,
  repeat the "make it the home screen" step. Some units reset the default home app after a reboot.
troubleshooting:
  - symptom: '"App not installed" when updating over an existing copy'
    fix: >-
      Android only updates an app with an APK signed by the same key. If you built it yourself or
      installed a test build, use Backup in KITT Config, uninstall once, install the release APK,
      then restore. Updates work normally from then on.
  - symptom: The head unit keeps going back to its stock launcher
    fix: >-
      Re-run System check in KITT Config. It tells you when another launcher has taken over. On
      some units the manufacturer's settings app has its own home-app setting that overrides
      Android's.
  - symptom: Install is blocked with a message about the developer not being verified or registered
    fix: See [installing apps from this site](/guides/installing-android-apps) for what Android developer verification means for sideloaded apps.
reviewed: '2026-10-28'
internal:
  sources: [KITT-Launcher-releases README and features page Install section]
  verified: '2026-10-23'
---
