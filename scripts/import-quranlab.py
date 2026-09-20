#!/usr/bin/env python3
"""Import the Arabic QuranLab Hadith configurations as offline JSON files."""
from __future__ import annotations

import hashlib
import json
import sys
import urllib.request
from pathlib import Path

import pyarrow.parquet as pq

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
BASE = "https://huggingface.co/datasets/quranlab/hadith/resolve/main"
CONFIGS = {
    "bukhari-ar": ("ara-bukhari.json", "صحيح البخاري"),
    "muslim-ar": ("ara-muslim.json", "صحيح مسلم"),
    "tirmidhi-ar": ("ara-tirmidhi.json", "سنن الترمذي"),
    "abudawud-ar": ("ara-abudawud.json", "سنن أبي داود"),
    "nasai-ar": ("ara-nasai.json", "سنن النسائي"),
    "ibnmajah-ar": ("ara-ibnmajah.json", "سنن ابن ماجه"),
    "malik-ar": ("ara-malik.json", "موطأ مالك"),
}


def download(url: str, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(url, headers={"User-Agent": "Diwan-Shamil QuranLab importer"})
    with urllib.request.urlopen(request) as response, target.open("wb") as output:
        while chunk := response.read(1024 * 1024):
            output.write(chunk)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    cache = ROOT / ".cache" / "quranlab"
    cache.mkdir(parents=True, exist_ok=True)
    for config, (filename, arabic_name) in CONFIGS.items():
        source_url = f"{BASE}/{config}/train-00000-of-00001.parquet?download=true"
        parquet = cache / f"{config}.parquet"
        print(f"Downloading {config}...", flush=True)
        download(source_url, parquet)
        table = pq.read_table(parquet)
        rows = table.to_pylist()
        columns = sorted(table.column_names)
        items = []
        chapter_map: dict[str, str] = {}
        for row in rows:
            text = str(row.get("text") or "").strip()
            if not text:
                continue
            chapter_id = row.get("book_number")
            chapter_name = ""
            if chapter_id is not None and chapter_name:
                chapter_map[str(chapter_id)] = chapter_name
            number = row.get("hadith_number") or row.get("in_book_number") or row.get("urn")
            items.append({
                "id": row.get("hadith_uid"),
                "hadithnumber": str(number) if number is not None else "",
                "arabicText": text,
                "text": text,
                "chapterId": str(chapter_id) if chapter_id is not None else "",
                "chapter": chapter_name,
                "source": "QuranLab Hadith / Open-Hadith-Data",
                "sourceUrl": "https://huggingface.co/datasets/quranlab/hadith",
                "license": "ODbL-1.0 + DbCL-1.0",
            })
        payload = {
            "metadata": {
                "name": arabic_name,
                "source": "QuranLab Hadith",
                "sourceUrl": "https://huggingface.co/datasets/quranlab/hadith",
                "config": config,
                "license": "ODbL-1.0 + DbCL-1.0",
                "attribution": "Arabic matn from QuranLab Hadith, based on mhashim6/Open-Hadith-Data",
                "download": source_url,
                "originalFormat": "Parquet",
                "convertedFormat": "JSON",
                "hadithCount": len(items),
                "columnsRead": columns,
                "sourceSha256": sha256(parquet),
            },
            "chapters": [
                {"id": key, "arabic": value}
                for key, value in sorted(chapter_map.items(), key=lambda pair: int(pair[0]) if pair[0].isdigit() else pair[0])
            ],
            "hadiths": items,
        }
        target = DATA / filename
        target.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Wrote {target.name}: {len(items)} rows, sha256={sha256(target)}", flush=True)


if __name__ == "__main__":
    main()
