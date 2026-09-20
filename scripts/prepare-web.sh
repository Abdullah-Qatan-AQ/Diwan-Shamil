#!/usr/bin/env bash
set -euo pipefail

rm -rf www
mkdir -p www
tar \
  --exclude='./.git' \
  --exclude='./node_modules' \
  --exclude='./android' \
  --exclude='./www' \
  --exclude='./scripts' \
  --exclude='./package.json' \
  --exclude='./package-lock.json' \
  --exclude='./capacitor.config.json' \
  -cf - . | tar -xf - -C www

echo "Prepared PWA assets in www/"
