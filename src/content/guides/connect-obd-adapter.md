---
slug: connect-obd-adapter
title: Connect an ELM327 OBD-II adapter to KITT Launcher
summary: Pair a Bluetooth Classic, BLE or Wi-Fi ELM327 adapter and get live gauges, fault codes and readiness.
published: true
project: kitt-launcher
topics: [Bluetooth/BLE, OBD-II, Connectivity]
appliesTo: KITT Launcher / KITT Launcher.2 1.8
time: 10 to 15 minutes, car parked
prerequisites:
  - An ELM327-compatible OBD-II adapter (Bluetooth Classic, Bluetooth Low Energy, or Wi-Fi).
  - KITT Launcher installed, with the Nearby devices (Bluetooth) and Location permissions allowed. System check in KITT Config shows both.
  - The car parked somewhere safe, with the ignition on or the engine running.
cautions:
  - Do this parked. Plugging in an adapter, pairing and reading codes are not things to do while driving.
  - The OBD-II port is usually under the dash near the steering column. Don't force the plug, and keep the adapter and cable clear of the pedals.
  - Some cheap adapters draw power all the time. If the car will sit for days, unplug the adapter so it doesn't drain the battery.
  - Clearing fault codes also clears readiness monitors, so the car may not pass an emissions check until it has been driven enough. KITT never clears codes automatically. It's a manual button with a warning.
steps:
  - title: Plug in the adapter and switch on the ignition
    body: Plug the adapter into the OBD-II port. Turn the ignition on, or start the engine. Most adapters light an LED when powered.
    expect: The adapter's power light is on.
  - title: Open Diagnostics → Link
    body: >-
      In KITT, open **Diagnostics** and go to the **Link** tab. This is where adapters are found,
      paired and connected, and where you pick the manufacturer profile and protocol.
    expect: The Link tab lists nearby adapters or offers a scan.
  - title: Connect the adapter
    body: >-
      **Bluetooth Classic:** pick it from the list. Many adapters use PIN 1234 or 0000 if Android
      asks. **BLE:** pick it from the scan. KITT finds the adapter's read and write channels
      automatically. **Wi-Fi:** join the adapter's Wi-Fi network in Android settings first, then
      connect from Link. If a scan finds nothing, Link explains what Android's Bluetooth looks like
      to apps. You can also enter the adapter's address directly as Classic or BLE.
    expect: Link shows the adapter connected, the detected protocol, and a manufacturer profile once the VIN is read.
  - title: Check live data
    body: Open the **Gauges** page. Values like RPM and coolant temperature should move with the engine.
    expect: Gauges update live. Idle RPM changes when you blip the throttle (parked!).
  - title: Read codes and readiness
    body: Open **Diagnostics → Codes** to see stored, pending and permanent codes, freeze frame and emissions readiness.
    expect: Codes are listed in plain English, or the list is empty if there aren't any.
result: KITT reads live data from your car through the adapter, and reconnects to saved adapters automatically.
verify: >-
  Switch the car off and on again. KITT should reconnect to the saved adapter on its own. Saved
  adapters are tried in turn. Then ask KITT "how's my coolant?" if you've set up AI.
troubleshooting:
  - symptom: A scan finds nothing
    fix: >-
      Check the adapter is powered (ignition on). Make sure Bluetooth and Location are on, since
      older Android versions need Location for Bluetooth scans. Then read the explanation on the Link
      tab, which covers apps not being able to see Bluetooth devices on some head units. Entering the
      adapter's address directly often works where a scan doesn't.
  - symptom: It connects but no data appears
    fix: >-
      Try a manual protocol instead of auto-detect on the Link tab, and turn off fast polling.
      The connection log names which layer failed: Bluetooth, adapter, ELM init, ECU or decoding.
      That tells you whether to blame the adapter, the car or the settings.
  - symptom: Values freeze after a while
    fix: >-
      Use Report a problem in KITT Config. It includes the OBD connection log and your settings,
      with keys removed. Review the report before sharing it, and don't post your VIN publicly.
reviewed: '2026-10-23'
internal:
  sources: [features page Car scanner section, v1.5 and v1.7 notes]
  verified: '2026-10-23'
---
