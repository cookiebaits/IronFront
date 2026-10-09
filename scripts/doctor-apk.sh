#!/usr/bin/env bash
# Diagnose the local Android APK toolchain without building the whole app.
# Usage: bash scripts/doctor-apk.sh
# Output: apk-doctor.log
set +e
cd "$(dirname "$0")/.." || exit 1
LOG="$PWD/apk-doctor.log"

{
  echo "Iron Front Android build doctor"
  echo "Generated: $(date)"
  echo "Project: $PWD"
  echo

  echo "== Operating system =="
  uname -a
  echo

  echo "== Executables =="
  for tool in node npm java python3 adb sdkmanager; do
    printf '%-12s' "$tool"
    command -v "$tool" || echo "NOT FOUND"
  done
  echo

  echo "== Versions =="
  node --version 2>&1
  npm --version 2>&1
  java -version 2>&1
  python3 --version 2>&1
  adb --version 2>&1 | head -n 3
  echo

  echo "== Environment =="
  echo "JAVA_HOME=${JAVA_HOME:-<not set>}"
  echo "ANDROID_HOME=${ANDROID_HOME:-<not set>}"
  echo "ANDROID_SDK_ROOT=${ANDROID_SDK_ROOT:-<not set>}"
  SDK_ROOT="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-}}"
  if [ -n "$SDK_ROOT" ]; then
    echo "SDK exists: $([ -d "$SDK_ROOT" ] && echo yes || echo no)"
    echo "Platform 36: $([ -d "$SDK_ROOT/platforms/android-36" ] && echo installed || echo MISSING)"
    echo "Build Tools 36.0.0: $([ -d "$SDK_ROOT/build-tools/36.0.0" ] && echo installed || echo MISSING)"
    echo "Platform tools: $([ -d "$SDK_ROOT/platform-tools" ] && echo installed || echo MISSING)"
  fi
  echo

  echo "== Capacitor packages =="
  npm ls @capacitor/core @capacitor/cli @capacitor/android --depth=0 2>&1
  if [ -x node_modules/.bin/cap ]; then node_modules/.bin/cap --version 2>&1; fi
  echo

  echo "== Generated Android project =="
  echo "android/: $([ -d android ] && echo present || echo absent)"
  if [ -x android/gradlew ]; then
    (cd android && ./gradlew --version) 2>&1
  else
    echo "Gradle wrapper not present yet (the build script creates it with cap add android)."
  fi
  echo

  echo "== Disk =="
  df -h "$PWD"
  echo
  echo "Doctor complete. Share apk-doctor.log plus the first error from apk-build.log."
} 2>&1 | tee "$LOG"
