#!/usr/bin/env bash
# Verify and install Iron Front over USB, with clear diagnostics for common failures.
# Usage: bash scripts/install-apk.sh [path/to.apk]
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

APK="${1:-iron-front-debug.apk}"
[ -f "$APK" ] || { echo "APK not found: $APK" >&2; echo "If downloaded from GitHub, unzip the artifact first." >&2; exit 1; }
[ -s "$APK" ] || { echo "APK is empty: $APK" >&2; exit 1; }

echo "APK: $(cd "$(dirname "$APK")" && pwd)/$(basename "$APK")"
ls -lh "$APK"

# APKs are ZIP containers. This catches attempts to install GitHub's artifact ZIP itself.
MAGIC="$(od -An -tx1 -N2 "$APK" 2>/dev/null | tr -d ' \n')"
if [ "$MAGIC" != "504b" ]; then
  echo "This is not an APK/ZIP container. Download and unzip the GitHub artifact, then use iron-front-debug.apk." >&2
  exit 1
fi

SDK_ROOT="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-}}"
if [ -n "$SDK_ROOT" ] && [ -d "$SDK_ROOT/build-tools/36.0.0" ]; then
  TOOLS="$SDK_ROOT/build-tools/36.0.0"
  echo "Verifying APK signature..."
  "$TOOLS/apksigner" verify --verbose --print-certs "$APK" || exit 1
  "$TOOLS/aapt" dump badging "$APK" | grep -E "^package:|^sdkVersion:|^targetSdkVersion:|^application-label:" || true
fi

command -v adb >/dev/null 2>&1 || { echo "adb not found. Install Android Platform Tools or copy the APK to the phone manually." >&2; exit 1; }

echo "Connected Android devices:"
adb devices -l
DEVICE_COUNT="$(adb devices | awk 'NR>1 && $2=="device" {n++} END {print n+0}')"
[ "$DEVICE_COUNT" -eq 1 ] || { echo "Connect exactly one authorized phone with USB debugging enabled." >&2; exit 1; }

echo "Device Android: $(adb shell getprop ro.build.version.release | tr -d '\r') (API $(adb shell getprop ro.build.version.sdk | tr -d '\r'))"
echo "Installing..."
OUTPUT="$(adb install -r "$APK" 2>&1)"
STATUS=$?
echo "$OUTPUT"
[ "$STATUS" -eq 0 ] && { echo "Iron Front installed successfully."; exit 0; }

echo >&2
case "$OUTPUT" in
  *INSTALL_FAILED_UPDATE_INCOMPATIBLE*)
    echo "SIGNATURE CONFLICT: the installed Iron Front was signed by a different debug key." >&2
    echo "Back up anything needed, uninstall the old test app once, then install again:" >&2
    echo "  adb uninstall com.ironfront.tactics" >&2
    echo "  adb install iron-front-debug.apk" >&2
    echo "Future GitHub builds now reuse a stable cached signing key." >&2
    ;;
  *INSTALL_FAILED_OLDER_SDK*)
    echo "ANDROID TOO OLD: Iron Front requires Android 7.0 / API 24 or newer." >&2
    ;;
  *INSTALL_FAILED_VERSION_DOWNGRADE*)
    echo "VERSION DOWNGRADE: uninstall the newer test build, or run: adb install -r -d \"$APK\"" >&2
    ;;
  *INSTALL_PARSE_FAILED*|*INVALID_APK*)
    echo "INVALID APK: make sure you extracted iron-front-debug.apk from the GitHub artifact ZIP." >&2
    echo "Compare its SHA-256 with iron-front-debug.apk.sha256 from the artifact." >&2
    ;;
  *INSTALL_FAILED_INSUFFICIENT_STORAGE*)
    echo "NOT ENOUGH STORAGE: free space on the phone and try again." >&2
    ;;
  *INSTALL_FAILED_USER_RESTRICTED*)
    echo "INSTALL BLOCKED: allow USB installs / Install unknown apps in Android settings." >&2
    ;;
  *)
    echo "Android rejected the APK. The complete adb error is printed above." >&2
    ;;
esac
exit "$STATUS"
