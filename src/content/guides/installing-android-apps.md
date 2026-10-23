---
slug: installing-android-apps
title: Installing apps from this site on Android in 2026
summary: What "install unknown apps" actually allows, what Android developer verification changes, and what not to switch off.
published: true
topics: [Installation, Compatibility, Security]
appliesTo: All Android downloads on this site · reviewed against Google's June 2026 announcement
time: 5 minute read
prerequisites:
  - An APK from this site's downloads page.
steps:
  - title: Only APK files are offered here
    body: >-
      Every download on this site is an `.apk`, which Android can install directly. App bundles
      (`.aab`) can't be installed by tapping them, so they're never offered here.
  - title: Allow one app to install, not "everything"
    body: >-
      Since Android 8, installing from outside an app store is a per-app permission. You allow
      your browser, file manager or Downloader to hand APKs to the installer. Find it under
      Settings → Apps → Special app access → Install unknown apps, though the path varies by
      device. Android 7 has a single "Unknown sources" switch under Security instead. You can turn
      the permission back off after installing.
  - title: Leave Play Protect on
    body: >-
      If Google Play Protect shows a warning, read it. You can choose not to install, or to
      install anyway. There's no need to switch Play Protect off to install anything from this
      site, and no guide here will ask you to.
  - title: Know about developer verification
    body: >-
      Google is rolling out Android developer verification. From 30 September 2026, certified
      Android devices in Brazil, Indonesia, Singapore and Thailand require apps to come from a
      registered developer, and Google says verification expands globally from 2027. According to
      Google, unregistered apps can still be installed with adb or an "advanced flow" that has
      extra security checkpoints. Whether these apps are registered hasn't been confirmed yet. Many
      aftermarket head units and some TV boxes aren't certified devices, so how this affects you
      depends on your hardware and region.
  - title: Updates must come from the same signer
    body: >-
      Android only updates an installed app with an APK signed by the same key. Updates from this
      site and from the apps' built-in updaters come from the same release channel. If you built
      an app yourself or installed a test build, you'll need to uninstall once, after backing up,
      before a release APK can install.
result: You know which permission you're granting, why, and what the 2026 verification changes mean.
verify: After installing, revisit Install unknown apps and switch it off for that app if you don't plan to install more.
troubleshooting:
  - symptom: '"App not installed" or "package conflicts with an existing package"'
    fix: Usually a different signing key from the copy you already have. Back up, uninstall the old copy, then install.
  - symptom: '"There was a problem parsing the package"'
    fix: The download is incomplete or isn't for your Android version. Check the SHA-256 (see [verify a download](/guides/verify-a-download)) and the minimum Android version on the download card.
reviewed: '2026-10-23'
internal:
  sources:
    - https://android-developers.googleblog.com/2026/06/android-developer-verification.html (fetched 2026-10-23)
    - https://developer.android.com/studio/publish/app-signing
  verified: '2026-10-23'
---

Google's announcement: [Android developer verification: Building a safer ecosystem together](https://android-developers.googleblog.com/2026/06/android-developer-verification.html). Background on signing: [Android app signing](https://developer.android.com/studio/publish/app-signing).
