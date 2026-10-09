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
8. Unzip the artifact to get `iron-front-debug.apk`.
9. Copy it to the Android phone, open it, and allow **Install unknown apps** if prompted.

The workflow also runs automatically after a push to `main` or `master`. It uses Node 22,
JDK 21, Android SDK 36, and Capacitor 8. The runner is pinned to Ubuntu 24.04 so a future
`ubuntu-latest` migration cannot silently change the toolchain.

The workflow uses Node 24-compatible GitHub actions (`checkout@v5`, `setup-node@v5`,
`setup-java@v5`, and `upload-artifact@v6`) and does not use the deprecated
`android-actions/setup-android@v3` action.

If GitHub only shows `Process completed with exit code 1`, open the failed run and expand the
first red step. The summary message is generic; the real compiler error is inside that step.
Failed Gradle runs also upload an **android-build-diagnostics** artifact when a log was created.

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
adb install -r iron-front-debug.apk
```

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