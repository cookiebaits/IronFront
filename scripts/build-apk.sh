#!/usr/bin/env bash
# Build an installable debug APK (landscape + immersive fullscreen) locally.
# Usage: bash scripts/build-apk.sh
# Output: iron-front-debug.apk and apk-build.log in the project root.
set -Eeuo pipefail
cd "$(dirname "$0")/.."

LOG="$PWD/apk-build.log"
: > "$LOG"

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*" | tee -a "$LOG"; }
die() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" | tee -a "$LOG" >&2; exit 1; }

on_error() {
  code=$?
  printf '\n\033[1;31mAPK build failed (exit %s).\033[0m\n' "$code" >&2
  echo "Full output: $LOG" >&2
  echo "Last 60 log lines:" >&2
  tail -n 60 "$LOG" >&2 || true
  if [ -d android ]; then (cd android && ./gradlew --stop >/dev/null 2>&1 || true); fi
  exit "$code"
}
trap on_error ERR

say "Preflight checks"
for tool in node npm java python3; do
  command -v "$tool" >/dev/null 2>&1 || die "$tool is not installed or not in PATH"
done

NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
[ "$NODE_MAJOR" -ge 22 ] || die "Node.js 22+ is required (found $(node --version))"

JAVA_MAJOR="$(java -version 2>&1 | awk -F '[\".]' '/version/ {print $2; exit}')"
[ "${JAVA_MAJOR:-0}" -ge 21 ] || die "JDK 21+ is required (found: $(java -version 2>&1 | head -n 1))"

SDK_ROOT="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-}}"
[ -n "$SDK_ROOT" ] || die "Set ANDROID_HOME (or ANDROID_SDK_ROOT) to your Android SDK folder"
[ -d "$SDK_ROOT" ] || die "Android SDK folder does not exist: $SDK_ROOT"
[ -d "$SDK_ROOT/platforms/android-36" ] || die "Android SDK Platform 36 is missing. Install it in Android Studio > SDK Manager"
[ -d "$SDK_ROOT/build-tools/36.0.0" ] || die "Android Build Tools 36.0.0 is missing. Install it in Android Studio > SDK Manager > SDK Tools"

{
  echo "Project: $PWD"
  echo "Node: $(node --version)"
  echo "npm: $(npm --version)"
  java -version
  echo "JAVA_HOME=${JAVA_HOME:-<not set>}"
  echo "Android SDK: $SDK_ROOT"
  df -h "$PWD" | tail -n 1
} 2>&1 | tee -a "$LOG"

say "Install JavaScript dependencies"
npm install --no-audit --no-fund --prefer-offline 2>&1 | tee -a "$LOG"

say "Build React game"
npm run build 2>&1 | tee -a "$LOG"

say "Create / sync Capacitor Android project"
if [ ! -d android ]; then npx cap add android 2>&1 | tee -a "$LOG"; fi
npx cap sync android 2>&1 | tee -a "$LOG"
npx cap doctor 2>&1 | tee -a "$LOG" || echo "Capacitor doctor reported a warning; continuing to Gradle." | tee -a "$LOG"

say "Prepare stable local debug signing key"
mkdir -p "$HOME/.android"
if [ ! -s "$HOME/.android/debug.keystore" ]; then
  keytool -genkeypair -noprompt \
    -keystore "$HOME/.android/debug.keystore" \
    -storepass android -alias androiddebugkey -keypass android \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=Android Debug,O=Iron Front,C=US" 2>&1 | tee -a "$LOG"
fi
printf 'sdk.dir=%s\n' "$SDK_ROOT" > android/local.properties

say "Apply landscape + immersive Android settings"
python3 scripts/patch-android.py 2>&1 | tee -a "$LOG"

say "Gradle toolchain"
chmod +x android/gradlew
(cd android && ./gradlew --version) 2>&1 | tee -a "$LOG"

say "Assemble debug APK"
export GRADLE_OPTS="${GRADLE_OPTS:--Dorg.gradle.daemon=false -Dorg.gradle.workers.max=2 -Dorg.gradle.jvmargs=-Xmx3g}"
(cd android && ./gradlew :app:assembleDebug --no-daemon --max-workers=2 --stacktrace --warning-mode all) 2>&1 | tee -a "$LOG"

APK="android/app/build/outputs/apk/debug/app-debug.apk"
[ -f "$APK" ] || die "Gradle finished but APK was not found at $APK"
cp "$APK" iron-front-debug.apk

say "Sign and verify APK alignment, signature, and package metadata"
BUILD_TOOLS="$SDK_ROOT/build-tools/36.0.0"
"$BUILD_TOOLS/apksigner" sign --ks "$HOME/.android/debug.keystore" \
  --ks-pass pass:android --ks-key-alias androiddebugkey --key-pass pass:android \
  --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true \
  iron-front-debug.apk 2>&1 | tee -a "$LOG"

"$BUILD_TOOLS/zipalign" -c -v 4 iron-front-debug.apk 2>&1 | tee apk-zipalign.txt | tee -a "$LOG"
"$BUILD_TOOLS/apksigner" verify --verbose --print-certs iron-front-debug.apk 2>&1 | tee apk-signature.txt | tee -a "$LOG"
"$BUILD_TOOLS/aapt" dump badging iron-front-debug.apk 2>&1 | tee apk-badging.txt | tee -a "$LOG"
grep -q "package: name='com.ironfront.tactics'" apk-badging.txt || die "Unexpected Android package id"
grep -q "sdkVersion:'24'" apk-badging.txt || die "Unexpected minimum Android SDK"
if command -v sha256sum >/dev/null 2>&1; then sha256sum iron-front-debug.apk > iron-front-debug.apk.sha256; else shasum -a 256 iron-front-debug.apk > iron-front-debug.apk.sha256; fi

trap - ERR
say "Build complete"
echo "APK: $PWD/iron-front-debug.apk"
echo "Log: $LOG"
echo "Install: adb install -r iron-front-debug.apk"
