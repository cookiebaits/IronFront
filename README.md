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

Build with **GitHub Actions** or on your own computer. Both paths use
`scripts/build-apk.sh` and produce the same fullscreen, landscape debug APK.

### Option A: GitHub Actions

No local Android installation is needed for this option.

1. Push the project, including `.github/workflows/build-apk.yml`, to your GitHub repository.
2. Open the repository's **Actions** tab. Enable workflows if GitHub asks.
3. Select **Build Android APK**, then **Run workflow**.
4. Wait for the run to finish successfully.
5. Open the completed run and download **iron-front-debug-apk** under **Artifacts**.
6. Unzip the download to find `iron-front-debug.apk` and its SHA-256 checksum.
7. Copy the APK to your phone, open it, and allow **Install unknown apps** if asked.

The workflow also runs automatically when you push to `main` or `master`. Artifacts are kept
for 14 days. The workflow file must be on your default branch for **Run workflow** to appear.

The Android job is pinned to **Ubuntu 24.04** to avoid unexpected runner-image changes. Its
Actions use the supported **Node 24 runtime**; the game still builds with **Node.js 22** and
**JDK 21**. Dependency installation, web build, Android preparation, Capacitor sync, and Gradle
assembly appear as separate steps.

If a build fails, open the **first failed step** and read the error above `exit code 1`. Gradle
errors also produce an **android-build-diagnostics** artifact containing `apk-build.log` and
related logs. The generic exit code and deprecation warnings alone do not identify the cause.
After updating a workflow, start a **new run from the latest commit**; rerunning an old job
uses the old commit and workflow.

To install later APK updates without uninstalling and losing device saves, configure a stable
debug signing key as described in
[`ANDROID_BUILD.md`](ANDROID_BUILD.md#keep-apk-updates-compatible-with-existing-saves).

### Option B: Build on your computer

Requirements:

- Node.js 22+
- JDK 21
- Android Studio / Android SDK 36
- `ANDROID_HOME` configured

A `.sh` file is a Bash script. Run it in a terminal, not by double-clicking it.
Install the requirements above first; the script does not install Java or the Android SDK.

### Run the script on macOS or Linux

1. Download and extract this repository, or clone it with Git.
2. Open **Terminal** and change into the project folder. This is the folder containing
   `package.json`, `capacitor.config.json`, and `scripts/`, not the `scripts/` folder itself.
3. Run the script:

```bash
cd "/path/to/your/iron-front-project"
bash scripts/build-apk.sh
```

Replace the example path with your actual project location. For example, if you extracted the
repository into Downloads:

```bash
cd "$HOME/Downloads/iron-front-project"
bash scripts/build-apk.sh
```

Using `bash` means you do **not** need to make the script executable with `chmod`.

If `ANDROID_HOME` is not already set, set it in that terminal before running the script:

```bash
# macOS default SDK location:
export ANDROID_HOME="$HOME/Library/Android/sdk"

# On Linux, use this instead:
# export ANDROID_HOME="$HOME/Android/Sdk"

bash scripts/build-apk.sh
```

Use the SDK location shown in Android Studio if it differs from these defaults.

### Run the script on Windows

1. Install **Git for Windows**, which includes **Git Bash**.
2. Install Node.js 22+, JDK 21, and Android Studio / SDK 36 as listed above.
3. Open the extracted or cloned project folder in File Explorer.
4. Right-click an empty area and choose **Open Git Bash here**. On Windows 11, it may be under
   **Show more options**.
5. In Git Bash, run:

```bash
bash scripts/build-apk.sh
```

If `ANDROID_HOME` is not already configured, set it first using your Windows SDK location:

```bash
# Replace YOUR_NAME with your Windows account folder name:
export ANDROID_HOME="C:/Users/YOUR_NAME/AppData/Local/Android/Sdk"
bash scripts/build-apk.sh
```

Run these commands in **Git Bash**, not ordinary PowerShell or Command Prompt. For a build
without Bash, follow the PowerShell instructions in [`ANDROID_BUILD.md`](ANDROID_BUILD.md).

### Find and install the APK

Wait for the build to finish. A successful run creates this file in the project folder:

```text
iron-front-debug.apk
```

Install over USB:

```bash
adb install -r iron-front-debug.apk
```

Alternatively, copy the APK to your phone, open it, and allow **Install unknown apps** if asked.

### Common script errors

- **No such file or directory:** you are in the wrong folder. Change into the project root and
  check that `scripts/build-apk.sh` exists.
- **`npm` or `npx` not found:** install Node.js 22+ and reopen your terminal.
- **Java missing or wrong version:** install JDK 21 and configure `JAVA_HOME`.
- **SDK location not found:** set `ANDROID_HOME` or configure the SDK location in Android Studio.
- **Permission denied:** run `bash scripts/build-apk.sh`, rather than executing the file directly.

See [`ANDROID_BUILD.md`](ANDROID_BUILD.md) for manual Gradle steps and Android setup details.

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
scripts/prepare-android.mjs    Repeat-safe Android landscape/fullscreen configuration
scripts/prepare-android.test.mjs Android configuration regression checks
.github/workflows/build-apk.yml GitHub Actions Android debug APK builder
capacitor.config.json          Capacitor configuration
```

## Notes

- Both APK build options create debug builds for testing. Store distribution requires release signing.
- Online synchronization is private and unranked, not competitive anti-cheat infrastructure.
- Portrait assets are in `public/portraits/`.

## License

No license has been specified. Add a `LICENSE` file before redistributing the project.