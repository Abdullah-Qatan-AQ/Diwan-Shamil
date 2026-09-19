#!/usr/bin/env bash
set -euo pipefail
node --check app.js
node --check sw.js
python3 - <<'PY'
import json
from pathlib import Path
for path in [Path('data/quran.json'),Path('data/surah-meta.json'),Path('data/poetry/index.json'),*Path('data').glob('ara-*.json')]:
    with path.open() as f: json.load(f)
print('json files: ok')
PY
git diff --check
git status --short
