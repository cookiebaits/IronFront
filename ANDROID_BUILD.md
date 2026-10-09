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

The workflow has a 90-minute job limit and a 55-minute Gradle limit. It caches npm downloads and
the Gradle user home, skips Android SDK packages already on the runner, retries transient SDK
downloads, and cancels superseded builds on the same branch. A cold first build may be much
slower than subsequent builds.

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

It also writes all output to `apk-build.log`. If it fails, the script prints the final 60 lines,
the detected Node/JDK/SDK versions, and the exact log location. This makes local failures easier
to diagnose than a generic Gradle exit code.

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

## Local diagnosis checklist

Generate a diagnostic report without running a full build:

```bash
bash scripts/doctor-apk.sh
```

This creates `apk-doctor.log`. Keep it with `apk-build.log` when reporting a problem.

The local script checks these automatically before building:

```bash
node --version        # must be 22+
java --version        # must be JDK 21+
echo "$ANDROID_HOME" # must point to the Android SDK
test -d "$ANDROID_HOME/platforms/android-36"
test -d "$ANDROID_HOME/build-tools/36.0.0"
```

If Gradle fails, inspect:

```bash
tail -n 100 apk-build.log
grep -nE "FAILURE|ERROR|Caused by" apk-build.log | head -n 20
```

Common fixes:

- Install Platform 36 and Build Tools 36.0.0 from Android Studio's SDK Manager.
- Point `JAVA_HOME` at JDK 21, not an older system JDK.
- Set `ANDROID_HOME` (or `ANDROID_SDK_ROOT`) to the actual SDK directory.
- Allow access to `services.gradle.org`, `plugins.gradle.org`, `dl.google.com`, and Maven Central.
- Delete only the generated `android/` folder and rerun the script if Capacitor's native project
  became inconsistent. Do not delete browser/app save data; it is unrelated to the build.

## Release builds

The generated debug APK is intended for device testing. Publishing to Google Play requires a
signed release bundle or APK and secure management of the signing key.
