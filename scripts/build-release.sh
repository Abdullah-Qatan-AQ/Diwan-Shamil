#!/usr/bin/env bash
set -euo pipefail

: "${DIWAN_RELEASE_STORE_FILE:?Set DIWAN_RELEASE_STORE_FILE to the release keystore path}"
: "${DIWAN_RELEASE_STORE_PASSWORD:?Set DIWAN_RELEASE_STORE_PASSWORD}"
: "${DIWAN_RELEASE_KEY_ALIAS:?Set DIWAN_RELEASE_KEY_ALIAS}"
: "${DIWAN_RELEASE_KEY_PASSWORD:?Set DIWAN_RELEASE_KEY_PASSWORD}"

npm run android:sync
cd android
./gradlew assembleRelease
