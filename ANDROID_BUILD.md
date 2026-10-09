# Build the Android APK

Iron Front uses Capacitor to package the React game as a native Android app. The APK is
fullscreen and locked to landscape.

Build on GitHub Actions or on your computer. Both options run the same local build script.

## Option A: GitHub Actions

1. Push the repository, including `.github/workflows/build-apk.yml`, to GitHub.
2. Open **Actions** and select **Build Android APK**.
3. Click **Run workflow** and confirm. Enable Actions if prompted.
4. When the run succeeds, open it and download **iron-front-debug-apk** under **Artifacts**.
5. Unzip the artifact and transfer `iron-front-debug.apk` to your phone.
6. Open the APK and allow installation from unknown apps when asked.

The workflow also starts on pushes to `main` or `master`. It sets up Node.js 22, JDK 21,
Android SDK 36, and build tools, then builds, verifies, and uploads the APK. Artifacts expire
after 14 days.

If **Run workflow** is missing, first commit the workflow to the repository's default branch.
If a run fails, expand the failed step's log in the Actions tab to see the Android build error.

### Troubleshoot a failed Actions run

The workflow uses Ubuntu 24.04 and supported Node 24-based Actions. Node.js 22 remains the
version used for the game's npm/Capacitor commands; it is separate from an Action's runtime.

The job is split into explicit phases:

- Check the APK toolchain
- Install JavaScript dependencies
- Build the web game
- Check shell syntax and test Android configuration
- Generate and configure the Android project
- Sync the game into Android
- Assemble the fullscreen landscape APK
- Verify and upload the APK

To identify an error:

1. Open the failed run and expand its first failed step.
2. Look for the actual error above `Process completed with exit code 1`. For Gradle, copy the
   `What went wrong` section and any `Caused by` lines.
3. Download **android-build-diagnostics** under Artifacts when available. The Android build
   log is `apk-build.log`; dependency, preparation, and sync phases have their own logs.

After committing a pipeline fix, choose **Run workflow** on the updated branch or push a new
commit. **Re-run jobs** on an old run executes the old revision, not the newly committed fix.

Known failure cases handled by the build script:

- Legacy `styles.xml.bak` files: removed automatically; Android resource files must end in
  `.xml`. The new configuration helper writes no backups and can be run repeatedly.
- Empty `android/` folders: the script now generates the Capacitor project instead of skipping
  it just because a directory exists.
- Incomplete native projects: the script stops with an actionable error instead of deleting
  your files. Back up/rename the incomplete folder and generate a new Capacitor Android project.
- Missing SDK, Java, or Node: version/path checks report which requirement is missing.

The warning about a deprecated Action's Node version and the Ubuntu image-migration notice
are not enough to explain a failed Gradle build. Use the failed step's detailed log.

### Keep APK updates compatible with existing saves

Android requires the same application ID and signing key to install an update over an existing
app. The app ID remains `com.ironfront.tactics`. By default, each fresh GitHub runner generates
its own debug key, so APKs from different runs may not update one another.

For repeat device testing without uninstalling and losing saves, use a persistent debug key:

1. Keep the debug keystore used to install your first build. A local Android build normally
   creates it at `~/.android/debug.keystore` (Windows: `%USERPROFILE%\.android\debug.keystore`).
2. Base64-encode that keystore, for example on Linux or macOS:

```bash
base64 < "$HOME/.android/debug.keystore" | tr -d '\r\n'
```

3. In GitHub, open **Settings > Secrets and variables > Actions > New repository secret**.
4. Name the secret `ANDROID_DEBUG_KEYSTORE_BASE64` and paste the encoded value.

The workflow restores that key before building every APK. Use the standard Android debug
credentials (`androiddebugkey`, keystore password `android`, key password `android`). Never
commit the keystore or its encoded contents to the repository. This key is for debug testing,
not Play Store release signing. If you do not already have a local debug key, build locally
once to generate it before configuring this secret.

## Option B: Local builds

### Requirements

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

Open Terminal and change into the repository root (the folder containing `package.json`):

```bash
cd "/path/to/your/iron-front-project"
bash scripts/build-apk.sh
```

Replace the example path with your actual project path. Calling the script with `bash` does not
require `chmod +x`.

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

To run the `.sh` script, install Git for Windows and use **Git Bash**. Open Git Bash in the
project folder and run:

```bash
bash scripts/build-apk.sh
```

For a walkthrough of locating the project folder and setting `ANDROID_HOME`, see
[`README.md`](README.md#run-the-script-on-windows).

### PowerShell alternative

Open PowerShell in the repository root:

```powershell
npm install
npm run build

# Run this only if the android folder does not exist yet:
npx cap add android

node scripts/prepare-android.mjs
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
node scripts/prepare-android.mjs
npx cap sync android
cd android
./gradlew assembleDebug
```

Do not run `npx cap add android` again when `android/` already exists.

## Release builds

The generated debug APK is intended for device testing. Publishing to Google Play requires a
signed release bundle or APK and secure management of the signing key.
