---
slug: install-retrotv
title: Install RetroTV on Google TV, Android TV or Fire TV
summary: Sideload the RetroTV APK with the free Downloader app, on Google TV/Android TV or Fire TV.
published: true
project: retrotv
topics: [Installation, TV]
appliesTo: RetroTV 1.2 · Android 7.0+ TV devices
time: About 10 minutes
prerequisites:
  - An Android TV, Google TV or Fire TV device running Android 7.0 or newer.
  - The TV connected to the internet.
steps:
  - title: Install Downloader
    body: On the TV, install the free **Downloader** app (by AFTVnews) from the Play Store, or the Amazon Appstore on Fire TV.
    expect: Downloader opens and shows a URL box.
  - title: 'Fire TV only: allow Downloader to install apps'
    body: >-
      Go to Settings → My Fire TV → Developer options and turn on **Install unknown apps** for
      Downloader. No Developer options? Go to Settings → My Fire TV → About and press OK on the
      device name 7 times. This only lets Downloader install apps. It doesn't switch off anything
      else.
    expect: Downloader is allowed to install apps.
  - title: Download the APK
    body: >-
      In Downloader, type the download link from this site's [RetroTV downloads
      section](/downloads#retrotv). The QR code there lets you open the link on your phone and read
      it off easily. Typing URLs with a remote is everyone's least favourite hobby.
    expect: Downloader downloads `RetroTV-v1.2.apk` and offers to install it.
  - title: Install
    body: On Google TV/Android TV, allow Downloader to install unknown apps when asked. Then press **Install**.
    expect: RetroTV appears in your apps row (Your Apps on Fire TV).
result: RetroTV is installed and opens to the home screen of game sites.
verify: Open RetroTV, pick a built-in site, and move the pointer with the D-pad. Pressing OK should click.
troubleshooting:
  - symptom: Games stutter or don't load
    fix: Games run on the TV's Android System WebView. Update it from the Play Store, then try again.
  - symptom: A game won't start
    fix: >-
      Use **Game not working? Fix it** from the quick menu (hold OK or press Menu). It works
      through the usual fixes, like player choice, desktop or mobile view, ad block and controller
      mode, and remembers what worked for that site.
  - symptom: Install is blocked with a message about the developer not being verified or registered
    fix: See [installing apps from this site](/guides/installing-android-apps).
reviewed: '2026-10-23'
internal:
  sources: [RetroTV-releases README and page Install section]
  verified: '2026-10-23'
---
