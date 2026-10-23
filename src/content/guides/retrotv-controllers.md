---
slug: retrotv-controllers
title: Play RetroTV with the remote, a controller or your phone
summary: How the remote pointer, controller modes, hotkeys and phone link work.
published: true
project: retrotv
topics: [Controllers, Bluetooth/BLE, Usage]
appliesTo: RetroTV 1.2
time: 5 minutes
prerequisites:
  - RetroTV installed.
  - "Optional: a Bluetooth or USB game controller paired in the TV's settings, or a phone on the same Wi-Fi."
steps:
  - title: Use the remote as a pointer
    body: >-
      The **D-pad** moves the pointer and speeds up while held. Push against an edge to scroll.
      **OK** clicks, and holding OK while moving drags. **Hold OK or Menu** for the quick menu.
      **Back** goes back a page and leaves full screen. **CH+/CH−** scroll a page at a time.
    expect: The pointer moves and clicks on a game site.
  - title: Play with just the remote
    body: Press **Play/Pause** to switch to D-pad keys. Arrows and Enter go straight to the game.
    expect: The game responds to the D-pad.
  - title: Use a controller
    body: >-
      **Auto** mode, the default, makes the pad act as a gamepad while a game reads gamepads, and
      as keys on "press any key" screens, decided press by press. For keyboard-only games, choose
      keyboard mode per site and map each button to a key. Up to four controllers work at once.
      **Select + Start** opens the menu.
    expect: Your controller moves player 1.
  - title: Learn the player hotkeys
    body: In the built-in player, **Select + L1/R1** quick save and load, **Select + L2** rewinds and **Select + R2** fast-forwards.
    expect: Saves appear in the four save slots, each with a screenshot.
  - title: Add your phone as a controller
    body: >-
      Open **Phone link** and scan the QR code on the TV with a phone on the same Wi-Fi. It opens
      in the phone's browser, so there's no app to install. The phone becomes a touch gamepad, and
      up to four phones can join as extra players. You can also send a ROM file from the phone.
    expect: The phone shows a gamepad and its presses reach the game.
result: You can play with whichever input you have, and assign controllers and phones to players.
verify: Open the Players panel in the player and check that each controller or phone is assigned to the player you expect.
troubleshooting:
  - symptom: The controller works in menus but not in the game
    fix: Switch that site between Auto, gamepad and keyboard mode. The choice is remembered per site.
  - symptom: Phone link page won't open on the phone
    fix: The phone and TV must be on the same Wi-Fi network. Guest networks often block devices from seeing each other.
reviewed: '2026-10-23'
internal:
  sources: [RetroTV-releases page Remote & controllers, Built-in player and Phone link sections]
  verified: '2026-10-23'
---
