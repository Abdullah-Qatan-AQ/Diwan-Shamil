#!/usr/bin/env bash
set -euo pipefail

: "${DIWAN_RELEASE_STORE_FILE:?Set DIWAN_RELEASE_STORE_FILE}"
: "${DIWAN_RELEASE_STORE_PASSWORD:?Set DIWAN_RELEASE_STORE_PASSWORD}"
: "${DIWAN_RELEASE_KEY_ALIAS:?Set DIWAN_RELEASE_KEY_ALIAS}"
: "${DIWAN_RELEASE_KEY_PASSWORD:?Set DIWAN_RELEASE_KEY_PASSWORD}"

INPUT_APK="${1:?Usage: sign-release-apk.sh input.apk output.apk}"
OUTPUT_APK="${2:?Usage: sign-release-apk.sh input.apk output.apk}"
APKSIGNER="${ANDROID_SDK_ROOT:-$HOME/android-sdk}/build-tools/35.0.0/apksigner"
TEMP_APK="${OUTPUT_APK}.unsigned-repacked"
TEMP_IDS="${TEMP_APK}.idsig"
OUTPUT_IDS="${OUTPUT_APK}.idsig"

rm -f "$TEMP_APK" "$TEMP_IDS" "$OUTPUT_APK" "$OUTPUT_IDS"
"$APKSIGNER" sign \
  --ks "$DIWAN_RELEASE_STORE_FILE" \
  --ks-key-alias "$DIWAN_RELEASE_KEY_ALIAS" \
  --ks-pass env:DIWAN_RELEASE_STORE_PASSWORD \
  --key-pass env:DIWAN_RELEASE_KEY_PASSWORD \
  --v1-signing-enabled true \
  --v2-signing-enabled true \
  --v3-signing-enabled true \
  --v4-signing-enabled true \
  --out "$TEMP_APK" \
  "$INPUT_APK"
mv "$TEMP_APK" "$OUTPUT_APK"
if [ -f "$TEMP_IDS" ]; then
  mv "$TEMP_IDS" "$OUTPUT_IDS"
fi
"$APKSIGNER" verify --verbose "$OUTPUT_APK"
