#!/usr/bin/env bash
# Usage: bash scripts/build-apk.sh [all|check|install|web|prepare|sync|assemble]
# Default: complete local build. CI runs phases separately to identify the failing command.
# Requires Node 22+, JDK 21, and Android SDK 36. Output: iron-front-debug.apk.
set -Eeuo pipefail
cd "$(dirname "$0")/.."

STAGE="${1:-all}"
fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
report_failure() {
  local status="$1" line="$2"
  printf 'APK build failed during stage "%s" at script line %s (exit %s).\n' "$STAGE" "$line" "$status" >&2
  if [[ "${GITHUB_ACTIONS:-}" == "true" ]]; then
    printf '::error file=scripts/build-apk.sh,line=%s::APK stage %s failed with exit %s. Read this step log above the error.\n' "$line" "$STAGE" "$status"
  fi
}
trap 'report_failure "$?" "$LINENO"' ERR

check_node() {
  command -v node >/dev/null || fail 'Install Node.js 22 or newer, then reopen the terminal.'
  local major
  major="$(node -p 'process.versions.node.split(".")[0]')"
  [[ "$major" -ge 22 ]] || fail "Capacitor 8 needs Node.js 22+. Found $(node --version)."
}

check_toolchain() {
  check_node
  command -v npm >/dev/null || fail 'npm is not available on PATH.'
  command -v java >/dev/null || fail 'Install JDK 21 and set JAVA_HOME.'
  local java_version java_major sdk
  java_version="$(java -version 2>&1 | awk -F '\"' '/version/ { print $2; exit }')"
  java_major="${java_version%%.*}"
  [[ "$java_major" =~ ^[0-9]+$ && "$java_major" -ge 21 ]] || fail "JDK 21+ is required. Found Java ${java_version:-unknown}."
  sdk="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
  [[ -n "$sdk" && -d "$sdk" ]] || fail 'Set ANDROID_HOME to the Android SDK folder shown in Android Studio.'
  printf 'Node: %s\nJava: %s\nAndroid SDK: %s\n' "$(node --version)" "$java_version" "$sdk"
}

install_dependencies() {
  check_node
  if [[ -f package-lock.json || -f npm-shrinkwrap.json ]]; then
    npm ci --no-audit --no-fund
  else
    npm install --no-audit --no-fund
  fi
}

prepare_android() {
  check_node
  local manifest='android/app/src/main/AndroidManifest.xml'
  if [[ ! -f "$manifest" ]]; then
    if [[ -d android ]]; then
      if [[ -n "$(find android -type f -print -quit)" ]]; then
        fail 'android/ contains files but no Capacitor manifest. Back up and rename the incomplete folder, then rerun. No files were deleted.'
      fi
      # An empty scaffold is not a generated Capacitor project; remove only empty directories.
      find android -depth -type d -empty -delete
    fi
    npx --no-install cap add android
  fi
  [[ -f android/gradlew && -f android/gradle/wrapper/gradle-wrapper.jar ]] || fail 'The Android Gradle wrapper is missing. Restore the complete Capacitor android/ project or generate it again.'
  node scripts/prepare-android.mjs
}

assemble_apk() {
  check_toolchain
  [[ -f android/gradlew ]] || fail 'No Gradle wrapper found. Run the prepare stage first.'
  # Do not report an old APK as a successful new build.
  rm -f iron-front-debug.apk android/app/build/outputs/apk/debug/app-debug.apk
  (cd android && chmod +x gradlew && ./gradlew assembleDebug --no-daemon --console=plain --stacktrace) 2>&1 | tee apk-build.log
  [[ -s android/app/build/outputs/apk/debug/app-debug.apk ]] || fail 'Gradle did not produce app-debug.apk. See apk-build.log.'
  cp android/app/build/outputs/apk/debug/app-debug.apk iron-front-debug.apk
  echo 'APK ready: iron-front-debug.apk (install with: adb install -r iron-front-debug.apk)'
}

case "$STAGE" in
  check) check_toolchain ;;
  install) install_dependencies ;;
  web) check_node; npm run build ;;
  prepare) prepare_android ;;
  sync) check_node; npx --no-install cap sync android ;;
  assemble) assemble_apk ;;
  all)
    STAGE=check
    check_toolchain
    STAGE=install
    install_dependencies
    STAGE=web
    npm run build
    STAGE=prepare
    node --test scripts/prepare-android.test.mjs
    prepare_android
    STAGE=sync
    npx --no-install cap sync android
    STAGE=assemble
    assemble_apk
    ;;
  *) fail "Unknown stage: $STAGE. Use all, check, install, web, prepare, sync, or assemble." ;;
esac
