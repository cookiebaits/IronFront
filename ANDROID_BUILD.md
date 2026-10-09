# Build the Android APK

Iron Front uses Capacitor to package the React game as a native Android app. The APK is
fullscreen and locked to landscape.

You can use GitHub Actions or build locally.

## GitHub Actions

The workflow is stored at `.github/workflows/build-apk.yml`.

1. Push this project to GitHub.
2. Open **Actions** → **Build Android APK**.
3. Select **Run workflow**.
4. Open the completed run and download the **iron-front-debug-apk** artifact.
5. Unzip it and install `iron-front-debug.apk` on the phone.

The workflow runs on pushes to `main` and `master` as well as manual runs. It provisions
Node.js 22, JDK 21, Android SDK 36, Capacitor Android, landscape orientation, and fullscreen
mode before running Gradle.

It is pinned to Ubuntu 24.04 and uses Node 24-compatible action versions, avoiding the Node 20,
`setup-java@v4`, and `ubuntu-latest` migration notices. If GitHub still names those older action
versions, push the latest `.github/workflows/build-apk.yml` and run the workflow from the branch
containing that commit.

`Process completed with exit code 1` is only the summary. Expand the first red workflow step to
see the real error. Gradle failures also attempt to upload an `android-build-diagnostics`
artifact with `gradle-build.log`.

## Local build requirements

## Requirements

- Node.js 22 or newer
- JDK 21
- Android Studio with Android SDK 36 installed
- `ANDROID_HOME` configured

Check the first two requirements:

```bash
node --version
java --version
```

Typical Android SDK locations:

```text
Linux:   $HOME/Android/Sdk
macOS:   $HOME/Library/Android/sdk
Windows: %LOCALAPPDATA%\Android\Sdk
```

## Build on Linux or macOS

From the repository root:

```bash
bash scripts/build-apk.sh
```

The script installs dependencies, builds the web app, creates/synchronizes the Capacitor
Android project, enforces landscape/fullscreen, runs Gradle, and copies the result to:

```text
iron-front-debug.apk
```

Install it with USB debugging:

```bash
adb install -r iron-front-debug.apk
```

You can also copy the APK to the phone and open it. Android may ask you to allow installation
from unknown sources.

## Build on Windows

Open PowerShell in the repository root:

```powershell
npm install
npm run build

# Run this only if the android folder does not exist yet:
npx cap add android

npx cap sync android
cd android
.\gradlew.bat assembleDebug
```

The APK is created at:

```text
android\app\build\outputs\apk\debug\app-debug.apk
```

Install it with:

```powershell
adb install -r .\app\build\outputs\apk\debug\app-debug.apk
```

## Rebuild after code changes

Linux/macOS can run `bash scripts/build-apk.sh` again. For a manual build:

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

Do not run `npx cap add android` again when `android/` already exists.

## Release builds

The generated debug APK is intended for device testing. Publishing to Google Play requires a
signed release bundle or APK and secure management of the signing key.
