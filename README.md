# Iron Front: Tactics

A mobile-first, turn-based strategy game inspired by classic handheld tactics games. Command
ground, air, artillery, and naval units; capture properties; use terrain and weather; charge CO
Ultimates and tactical skills; and fight through a progressive campaign.

The game runs as a React web app and can be packaged as a fullscreen, landscape Android APK
with Capacitor.

## Highlights

- Turn-based combat with touch and keyboard controls
- Campaign with multiple acts, story dialogue, bosses, and progressive difficulty
- Private online PvP rooms and co-op campaign play
- 19 unit types across infantry, vehicles, artillery, aircraft, and ships
- Cities, factories, airports, ports, HQs, and Radio Towers
- Terrain defense, vehicle roads, weather effects, fog of war, and aircraft fuel
- CO Ultimates plus a separate, slower tactical-skill charge gauge
- CO Pieces and Gold for officer unlocks
- Unit upgrades with power, movement, defense, range, and cost trade-offs
- One Undo per turn
- Battle cutscenes, particles, screen shake, audio, ranks, and high scores
- Campaign auto-save, resumable battles, and three named local save slots
- Fullscreen, landscape Android packaging

## Tech Stack

- React 19 and TypeScript
- Vite
- Tailwind CSS 4
- Canvas 2D game rendering
- PeerJS private online rooms
- Capacitor 8 Android packaging

## Run Locally

Requirements: Node.js 22 or newer and npm.

```bash
npm install
npm run dev
```

Open the URL printed by Vite. The game is designed for landscape displays.

## Production Web Build

```bash
npm run build
npm run preview
```

The production files are written to `dist/`.

## Build the Android APK

You can build the APK with GitHub Actions or locally. Both paths create a fullscreen,
landscape debug APK for phone testing.

### Option A — GitHub Actions (easiest)

The repository includes `.github/workflows/build-apk.yml`.

1. Push the complete project to a GitHub repository.
2. Open the repository on GitHub and select **Actions**.
3. Select **Build Android APK** in the left sidebar.
4. Click **Run workflow**, choose the branch, then click the green **Run workflow** button.
5. Wait for **Build debug APK** to finish with a green check mark.
6. Open the completed workflow run.
7. Scroll to **Artifacts** and download **iron-front-debug-apk**.
8. **Unzip the artifact ZIP**. Do not rename or try to install the artifact ZIP itself.
9. Inside it, install `iron-front-debug.apk`. The other files verify the build:
   - `iron-front-debug.apk.sha256`
   - `apk-signature.txt`
   - `apk-badging.txt`
   - `apk-zipalign.txt`
10. Copy `iron-front-debug.apk` to the Android phone, open it, and allow **Install unknown apps**
    if prompted. Iron Front requires Android 7.0 / API 24 or newer.

The workflow also runs automatically after a push to `main` or `master`. It uses Node 22,
JDK 21, Android SDK 36, and Capacitor 8. The runner is pinned to Ubuntu 24.04 so a future
`ubuntu-latest` migration cannot silently change the toolchain.

The workflow uses Node 24-compatible GitHub actions (`checkout@v5`, `setup-node@v5`,
`setup-java@v5`, and `upload-artifact@v6`) and does not use the deprecated
`android-actions/setup-android@v3` action.

If GitHub only shows `Process completed with exit code 1`, open the failed run and expand the
first red step. The summary message is generic; the real compiler error is inside that step.
Failed Gradle runs also upload an **android-build-diagnostics** artifact when a log was created.

An error that contains only a 32-character value such as
`567bd02882fd56cfb48b4ec02fcbbc33` is a GitHub service reference ID, not an Android error. The
workflow now treats npm, Gradle, and signing-key cache failures as optional. It also writes a
plain-text **Android APK build failed** summary without relying on the cache service. Copy the
first `FAILURE`, `ERROR`, `What went wrong`, or `Caused by` line from that summary when reporting
a problem.

If an older run fails with `chmod: changing permissions of .../sdkmanager: Operation not
permitted`, push the current workflow and start a new run. The hosted Android SDK is read-only;
the current workflow no longer tries to change its permissions.

If an older run fails during **Print toolchain versions** with `adb: command not found`, push the
current workflow and start a new run. The current workflow persists `platform-tools` to GitHub's
`PATH`, but also treats ADB as optional because ADB is used for installing an APK onto a phone,
not for compiling the APK.

The APK job allows up to 90 minutes, while the Gradle step has a 55-minute limit. Android SDK
packages are skipped when already installed, npm downloads are cached, and Gradle dependencies
are cached between runs. A newer push cancels an older build on the same branch so they do not
compete for runner and network time. The first completely cold build is still the slowest.

GitHub builds now reuse a cached debug signing key. The first APK built after this change may
conflict with an older test APK that was signed by a one-off key. If Android says **App not
installed**, uninstall the old Iron Front test app once and install the new APK. Later GitHub APKs
will update normally because they use the stable cached key.

If an old run still reports `checkout@v4`, `setup-node@v4`, `setup-java@v4`, or
`setup-android@v3`, GitHub is running the old workflow revision. Commit and push the updated
`.github/workflows/build-apk.yml`, then start a new run from that branch.

### Option B — build locally

Requirements:

- Node.js 22+
- JDK 21
- Android Studio / Android SDK 36
- `ANDROID_HOME` configured

### Run the `.sh` script on macOS or Linux

`build-apk.sh` is a shell script. Run it from a Terminal window, not by double-clicking the
file.

1. Open **Terminal**.
2. Change into the repository folder. Replace the example path with the location where you
   cloned or downloaded Iron Front:

```bash
cd ~/Projects/iron-front-tactics
```

3. Confirm you are in the correct folder. You should see `package.json`, `README.md`, and the
   `scripts` directory:

```bash
ls
```

4. Give the script permission to run. You normally only need to do this once:

```bash
chmod +x scripts/build-apk.sh
```

5. Run the script:

```bash
./scripts/build-apk.sh
```

You can also run it through Bash without changing its permission:

```bash
bash scripts/build-apk.sh
```

The script automatically:

1. Runs `npm install`.
2. Builds the React web game.
3. Creates the `android/` project if it does not exist.
4. Forces landscape and fullscreen Android settings.
5. Synchronizes the web files with Capacitor.
6. Runs the Android Gradle debug build.
7. Copies the completed APK to the repository root.

When it succeeds, the terminal prints `Done` and this file will exist:

```text
iron-front-debug.apk
```

To install it over USB, enable **Developer options** and **USB debugging** on the phone, connect
the phone, and run:

```bash
bash scripts/install-apk.sh
```

The installer verifies the APK, runs `adb install -r`, and explains signature conflicts, an old
Android version, insufficient storage, invalid downloads, and blocked unknown-app installs.

You can instead copy `iron-front-debug.apk` to the phone, open it with the Files app, and allow
**Install unknown apps** if Android asks.

### Run the `.sh` script on Windows

PowerShell and Command Prompt do not run `.sh` files directly. Use one of these options:

- **WSL:** open an Ubuntu/WSL terminal, `cd` to the repository, then run
  `bash scripts/build-apk.sh`.
- **Git Bash:** right-click the repository folder, select **Open Git Bash here**, then run
  `bash scripts/build-apk.sh`.
- **PowerShell:** use the manual Windows/Gradle commands in
  [`ANDROID_BUILD.md`](ANDROID_BUILD.md) instead of the shell script.

### Common errors

- `Permission denied`: run `chmod +x scripts/build-apk.sh`, or use
  `bash scripts/build-apk.sh`.
- `node: command not found`: install Node.js 22+, close Terminal, and open it again.
- `JAVA_HOME is not set`: install JDK 21 and configure `JAVA_HOME`.
- `SDK location not found`: open Android Studio's SDK Manager, install Android SDK 36, and set
  `ANDROID_HOME`.
- `adb: command not found`: add the Android SDK `platform-tools` folder to your `PATH`, or copy
  the APK to the phone manually.
- A local script failure always leaves `apk-build.log` in the repository root. Start with the
  last 60 lines printed by the script, then search upward for the first `FAILURE`, `ERROR`, or
  `Caused by` line.
- `Android SDK Platform 36 is missing`: Android Studio → **Tools → SDK Manager → SDK Platforms**
  → enable **Android API 36**. Under **SDK Tools**, enable **Android SDK Build-Tools 36.0.0** and
  **Android SDK Platform-Tools**.
- `JDK 21+ is required`: set `JAVA_HOME` to the JDK 21 installation and reopen Terminal.
- Gradle download stalls: verify that Gradle/Maven/Google repositories are not blocked by a VPN,
  firewall, proxy, or corporate network, then rerun the script; downloaded dependencies are
  retained in `~/.gradle/caches`.
- `INSTALL_FAILED_UPDATE_INCOMPATIBLE`: an existing app has the same package ID but a different
  debug signature. Uninstall it once with `adb uninstall com.ironfront.tactics`, then install the
  new APK. Switching between locally signed and GitHub-signed debug APKs can require this.
- `INSTALL_FAILED_OLDER_SDK`: the phone is older than Android 7.0 / API 24.
- `INSTALL_PARSE_FAILED...`: unzip the GitHub artifact and install the inner APK, not the artifact
  ZIP. Verify it against `iron-front-debug.apk.sha256`.

To collect local diagnostics without rebuilding everything:

```bash
bash scripts/doctor-apk.sh
```

It creates `apk-doctor.log`. If Option B still fails, share that file and `apk-build.log`.

See [`ANDROID_BUILD.md`](ANDROID_BUILD.md) for Windows commands, manual Gradle steps, and SDK
paths.

## Controls

### Touch

- Tap a unit to select it
- Tap a highlighted tile to move
- Tap an outlined enemy to attack
- Double-tap a unit to inspect movement, attack range, and fuel
- Drag to pan the battlefield
- Tap a friendly production property to deploy units
- Tap the large bottom panel for full Intel

### Keyboard

- Arrow keys / WASD: move cursor
- Enter / Space / Z: confirm
- Escape / X / Backspace: cancel
- E: end turn
- Q / Tab: next available unit
- V: Ultimate
- I: Intel
- U: Undo
- P: pause
- `+` / `-`: zoom

## Core Rules

- Rout all opposing units or capture the enemy HQ, depending on the mission
- Infantry and Mechs capture properties
- Cities provide income and paid repairs
- Radio Towers provide attack support, free nearby healing, and a periodic movement bonus
- Terrain defense reduces incoming damage
- Indirect units fire over blockers but cannot move and fire in the same turn
- Aircraft spend fuel and refuel on friendly properties
- Eliminating every unit on a side causes immediate defeat
- Ultimate and tactical-skill charge are separate; skills charge more slowly

## Campaign and Saving

Campaign battles auto-save at the beginning of each player turn and when the app is safely
backgrounded between actions. Title and Campaign screens offer **Continue Battle**.

The **Save / Load** menu provides three named slots containing progression, unlocks, upgrades,
high scores, and an active campaign battle. Saves are stored in browser/device local storage and
survive normal game updates. Clearing site/app data removes them.

## Online Play

Online play uses private PeerJS room codes:

- PvP uses a mirrored map, equal resources, identical COs, and no progression upgrades
- Co-op players share campaign units and alternate field orders
- Both devices need an internet connection
- Rooms are private and unranked; there is no public matchmaking

## Project Structure

```text
src/App.tsx                    App routing, progression, and campaign saves
src/components/GameView.tsx   Canvas battlefield, controls, HUD, and turn flow
src/components/Menus.tsx      Title, campaign, skirmish, help, and save/load
src/components/Shop.tsx       CO, skill, and unit upgrades
src/components/OnlineRoom.tsx Private PvP and co-op rooms
src/game/engine.ts             Movement, combat, capture, skills, and objectives
src/game/data.ts               Units, COs, terrain, weather, and upgrades
src/game/campaign.ts           Missions, acts, story, bosses, and tutorial
src/game/save.ts               Progress, resume, high scores, and named slots
scripts/build-apk.sh           Local Android debug APK builder
capacitor.config.json          Capacitor configuration
```

## Notes

- The local APK script creates a debug build for testing. Store distribution requires signing.
- Online synchronization is private and unranked, not competitive anti-cheat infrastructure.
- Portrait assets are in `public/portraits/`.

## License

No license has been specified. Add a `LICENSE` file before redistributing the project.