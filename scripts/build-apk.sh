#!/usr/bin/env bash
# Build an installable debug APK (landscape + fullscreen) on your own computer.
#
# Requirements: Node 24+, JDK 21, and the Android SDK (easiest: install Android Studio once,
# then set ANDROID_HOME, e.g. ~/Android/Sdk or ~/Library/Android/sdk).
#
# Usage:  bash scripts/build-apk.sh
# Output: iron-front-debug.apk in the project root.
set -euo pipefail
cd "$(dirname "$0")/.."

npm install
npm run build

[ -d android ] || npx cap add android

MANIFEST=android/app/src/main/AndroidManifest.xml
STYLES=android/app/src/main/res/values/styles.xml
grep -q screenOrientation "$MANIFEST" || sed -i.bak 's|<activity|<activity android:screenOrientation="sensorLandscape"|' "$MANIFEST"
grep -q windowFullscreen "$STYLES" || sed -i.bak 's|<style name="AppTheme.NoActionBar"[^>]*>|&\
        <item name="android:windowFullscreen">true</item>\
        <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>|' "$STYLES"

npx cap sync android
(cd android && chmod +x gradlew && ./gradlew assembleDebug)

cp android/app/build/outputs/apk/debug/app-debug.apk iron-front-debug.apk
echo "Done -> iron-front-debug.apk  (install with: adb install -r iron-front-debug.apk)"
