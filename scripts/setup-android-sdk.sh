#!/usr/bin/env bash
set -euo pipefail

SDK_ROOT="${ANDROID_SDK_ROOT:-$HOME/android-sdk}"
TOOLS_DIR="$SDK_ROOT/cmdline-tools/latest"
ARCHIVE="$HOME/android-commandline-tools.zip"

mkdir -p "$SDK_ROOT/cmdline-tools"
if [ ! -x "$TOOLS_DIR/bin/sdkmanager" ]; then
  curl -fL --retry 3 -o "$ARCHIVE" \
    https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
  rm -rf "$SDK_ROOT/cmdline-tools/tmp" "$TOOLS_DIR"
  mkdir -p "$SDK_ROOT/cmdline-tools/tmp"
  unzip -q "$ARCHIVE" -d "$SDK_ROOT/cmdline-tools/tmp"
  mv "$SDK_ROOT/cmdline-tools/tmp/cmdline-tools" "$TOOLS_DIR"
  rm -rf "$SDK_ROOT/cmdline-tools/tmp"
fi

export ANDROID_SDK_ROOT="$SDK_ROOT"
export ANDROID_HOME="$SDK_ROOT"
export PATH="$TOOLS_DIR/bin:$SDK_ROOT/platform-tools:$PATH"
yes | sdkmanager --licenses >/dev/null || true
sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"

echo "Android SDK ready at $SDK_ROOT"
