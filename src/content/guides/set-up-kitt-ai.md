---
slug: set-up-kitt-ai
title: Set up KITT's AI answers with your own API key
summary: Add a Gemini or Perplexity API key, pick a personality, and know what works offline.
published: true
project: kitt-launcher
topics: [AI, API configuration]
appliesTo: KITT Launcher / KITT Launcher.2 1.8–1.9
time: About 10 minutes
prerequisites:
  - A Google Gemini API key or a Perplexity API key, created in that provider's developer console.
  - A data connection for AI answers.
cautions:
  - An API key is a credential. Never paste it into feedback, a forum post or a screenshot.
  - Set things up parked. KITT is designed to answer by voice, so you don't need to read the screen while driving.
steps:
  - title: Understand the subscription catch
    body: >-
      A consumer subscription (Gemini, Claude or Perplexity Pro) isn't the same as API access,
      and apps can't use it through an API. KITT needs an **API key**. If you pay for one of those
      subscriptions, KITT can hand a question to that provider's official app instead.
    expect: You have an API key, not just a subscription login.
  - title: Enter the key
    body: >-
      Open **KITT Config → AI core & personality**, choose Gemini or Perplexity, and paste the key.
      Keys are encrypted on the device with an Android Keystore key. They're left out of backups
      and problem reports, and only sent to the provider you chose.
    expect: The provider shows as configured.
  - title: Pick models (optional)
    body: >-
      Gemini has a fast model for conversation and a smarter one for diagnostics, each
      selectable. Perplexity offers presets from fast to high, and every answer shows what it cost.
    expect: Your choices are saved.
  - title: Pick a personality
    body: >-
      **Classic** is the polite TV KITT. **KARR** is the cold evil twin and doesn't swear.
      **Unfiltered** and **Savage** swear a lot. Savage is the KITT Launcher.2 default. All of
      them follow the same accuracy and safety rules. Switch to Classic if the swearing isn't for
      you, or if you have passengers who'd mind.
    expect: KITT's next reply uses the new personality.
  - title: Ask something
    body: Tap the KITT button, or use the steering-wheel voice button if you've learned it in KITT Config, and ask "how's my coolant?"
    expect: The answer quotes a live reading when an adapter is connected.
result: KITT answers questions using your live vehicle data, through the provider you chose.
verify: >-
  Ask a question that needs the car, like "any fault codes?", and one that doesn't. Then turn off
  data and ask about engine temperature. Since 1.8, common car questions are answered from the car
  itself with no signal.
troubleshooting:
  - symptom: KITT doesn't hear me, or the head unit's own voice app opens
    fix: >-
      Some head units hijack the microphone for their stock voice app. KITT detects this, and
      the **Microphone fix** section in KITT Config explains how to stop it.
  - symptom: Gemini web search answers don't appear
    fix: Google Search grounding is optional, and KITT skips it automatically on free-tier keys.
reviewed: '2026-10-28'
internal:
  sources: [features page KITT AI section, KITT-Launcher.2 README]
  verified: '2026-10-23'
---
