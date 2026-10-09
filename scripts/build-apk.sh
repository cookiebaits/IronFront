#!/usr/bin/env bash
# Build an installable debug APK (landscape + fullscreen) on your own computer.
#
# Requirements: Node 22+, JDK 21, and the Android SDK (easiest: install Android Studio once,
# then set ANDROID_HOME, e.g. ~/Android/Sdk or ~/Library/Android/sdk).
#
# Usage:  bash scripts/build-apk.sh
# Output: iron-front-debug.apk in the project root.
set -euo pipefail
cd "$(dirname "$0")/.."

npm install
npm run build

[ -d android ] || npx cap add android
npx cap sync android
python3 scripts/patch-android.py
(cd android && chmod +x gradlew && ./gradlew assembleDebug)

cp android/app/build/outputs/apk/debug/app-debug.apk iron-front-debug.apk
echo "Done -> iron-front-debug.apk  (install with: adb install -r iron-front-debug.apk)"
