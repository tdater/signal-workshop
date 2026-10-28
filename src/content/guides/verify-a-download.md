---
slug: verify-a-download
title: Check a download's SHA-256 checksum
summary: Confirm the APK you have is byte-for-byte the file that was published, and know what a checksum doesn't prove.
published: true
topics: [Installation, Security]
appliesTo: Every download on this site
time: 2 minutes
prerequisites:
  - The downloaded APK on a computer, or on a phone with a hashing app you trust.
  - The SHA-256 value from the download card on this site.
steps:
  - title: Compute the checksum
    body: >-
      **Windows (PowerShell):** `Get-FileHash .\RetroTV-v1.4.apk -Algorithm SHA256`.
      **macOS:** `shasum -a 256 RetroTV-v1.4.apk`.
      **Linux:** `sha256sum RetroTV-v1.4.apk`.
    expect: A 64-character hexadecimal string.
  - title: Compare it
    body: Compare it with the SHA-256 on the download card. Every character must match. Upper or lower case doesn't matter.
    expect: The two values are identical.
result: You know the file wasn't corrupted or swapped between publication and your device.
verify: If the values differ, delete the file and download it again directly from the download button.
troubleshooting:
  - symptom: The checksum doesn't match
    fix: Re-download. A truncated download is the usual cause. If it still doesn't match, don't install it, and report it through the feedback form as a private report.
reviewed: '2026-10-28'
internal:
  sources: ['Project brief: a checksum is a consistency check, not a malware verdict']
  verified: '2026-10-23'
---

**What a checksum proves:** the file matches the published one. **What it doesn't:** that the
app is free of bugs or malware, or that it will work on your device. It's a consistency check,
not a safety verdict and not a replacement for Android's app signing.
