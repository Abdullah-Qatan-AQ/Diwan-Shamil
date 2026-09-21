#!/usr/bin/env python3
"""Import all Arabic QuranLab Hadith configurations as offline JSON files."""
from __future__ import annotations

import hashlib
import json
import urllib.request
from pathlib import Path

import pyarrow.parquet as pq

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
BASE = "https://huggingface.co/datasets/quranlab/hadith/resolve/main"
DATASET_URL = "https://huggingface.co/datasets/quranlab/hadith"
CONFIGS = {
    "bukhari-ar": ("ara-bukhari.json", "صحيح البخاري", "ODbL-1.0 + DbCL-1.0", "Arabic matn from QuranLab Hadith, based on mhashim6/Open-Hadith-Data"),
    "muslim-ar": ("ara-muslim.json", "صحيح مسلم", "ODbL-1.0 + DbCL-1.0", "Arabic matn from QuranLab Hadith, based on mhashim6/Open-Hadith-Data"),
    "tirmidhi-ar": ("ara-tirmidhi.json", "سنن الترمذي", "ODbL-1.0 + DbCL-1.0", "Arabic matn from QuranLab Hadith, based on mhashim6/Open-Hadith-Data"),
    "abudawud-ar": ("ara-abudawud.json", "سنن أبي داود", "ODbL-1.0 + DbCL-1.0", "Arabic matn from QuranLab Hadith, based on mhashim6/Open-Hadith-Data"),
    "nasai-ar": ("ara-nasai.json", "سنن النسائي", "ODbL-1.0 + DbCL-1.0", "Arabic matn from QuranLab Hadith, based on mhashim6/Open-Hadith-Data"),
    "ibnmajah-ar": ("ara-ibnmajah.json", "سنن ابن ماجه", "ODbL-1.0 + DbCL-1.0", "Arabic matn from QuranLab Hadith, based on mhashim6/Open-Hadith-Data"),
    "malik-ar": ("ara-malik.json", "موطأ مالك", "ODbL-1.0 + DbCL-1.0", "Arabic matn from QuranLab Hadith, based on mhashim6/Open-Hadith-Data"),
    "ahmad-ar": ("ara-ahmad.json", "مسند أحمد", "ODbL-1.0 + DbCL-1.0", "Arabic matn from QuranLab Hadith, based on mhashim6/Open-Hadith-Data"),
    "darimi-ar": ("ara-darimi.json", "سنن الدارمي", "ODbL-1.0 + DbCL-1.0", "Arabic matn from QuranLab Hadith, based on mhashim6/Open-Hadith-Data"),
    "dehlawi-ar": ("ara-dehlawi.json", "الأربعون للشاه ولي الله الدهلوي", "ODbL-1.0 + DbCL-1.0", "Arabic matn from QuranLab Hadith, based on mhashim6/Open-Hadith-Data"),
    "nawawi-ar": ("ara-nawawi.json", "الأربعون النووية", "ODbL-1.0 + DbCL-1.0", "Arabic matn from QuranLab Hadith, based on mhashim6/Open-Hadith-Data"),
    "qudsi-ar": ("ara-qudsi.json", "الأربعون القدسية", "ODbL-1.0 + DbCL-1.0", "Arabic matn from QuranLab Hadith, based on mhashim6/Open-Hadith-Data"),
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


def value(row: dict, *keys):
    for key in keys:
        candidate = row.get(key)
        if candidate is not None and str(candidate).strip():
            return candidate
    return None


def main() -> None:
    cache = ROOT / ".cache" / "quranlab"
    cache.mkdir(parents=True, exist_ok=True)
    for config, (filename, arabic_name, license_name, attribution) in CONFIGS.items():
        source_url = f"{BASE}/{config}/train-00000-of-00001.parquet?download=true"
        parquet = cache / f"{config}.parquet"
        print(f"Downloading {config}...", flush=True)
        download(source_url, parquet)
        table = pq.read_table(parquet)
        rows = table.to_pylist()
        columns = sorted(table.column_names)
        items = []
        chapter_map: dict[str, str] = {}
        target = DATA / filename
        if target.exists():
            previous = json.loads(target.read_text(encoding="utf-8"))
            chapter_map.update({
                str(chapter["id"]): str(chapter.get("arabic") or chapter.get("name"))
                for chapter in previous.get("chapters", [])
                if chapter.get("id") is not None and (chapter.get("arabic") or chapter.get("name"))
            })
        for row in rows:
            text = str(row.get("text") or "").strip()
            if not text:
                continue
            chapter_id = value(row, "book_number")
            if chapter_id is None:
                chapter_id = "collection"
            chapter_id = str(chapter_id) if chapter_id is not None else ""
            number = value(row, "hadith_number", "in_book_number", "hadeethenc_id", "urn")
            item = {
                "id": value(row, "hadith_key", "hadith_uid", "urn") or number,
                "hadithnumber": str(number) if number is not None else "",
                "arabicText": text,
                "text": text,
                "chapterId": chapter_id,
                "chapter": chapter_map.get(chapter_id, ""),
                "source": attribution,
                "sourceUrl": DATASET_URL,
                "license": license_name,
            }
            for field in ("grade", "grader", "grade_source", "grades", "grade_summary", "sunnah_url", "attribution_text", "title", "intro", "explanation"):
                if row.get(field) is not None:
                    item[field] = row[field]
            items.append(item)
        chapter_ids = sorted({item["chapterId"] for item in items if item["chapterId"]}, key=lambda v: int(v) if v.isdigit() else v)
        for chapter_id in chapter_ids:
            if chapter_id == "collection":
                chapter_map.setdefault(chapter_id, "الموسوعة كاملة")
            else:
                chapter_map.setdefault(chapter_id, "أبواب غير مصنفة")
        for item in items:
            item["chapter"] = chapter_map.get(item["chapterId"], "")
        payload = {
            "metadata": {
                "name": arabic_name,
                "source": "QuranLab Hadith",
                "sourceUrl": DATASET_URL,
                "config": config,
                "license": license_name,
                "attribution": attribution,
                "download": source_url,
                "originalFormat": "Parquet",
                "convertedFormat": "JSON",
                "hadithCount": len(items),
                "columnsRead": columns,
                "sourceSha256": sha256(parquet),
            },
            "chapters": [{"id": key, "arabic": value} for key, value in sorted(chapter_map.items(), key=lambda pair: int(pair[0]) if pair[0].isdigit() else pair[0])],
            "hadiths": items,
        }
        target.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Wrote {target.name}: {len(items)} rows, sha256={sha256(target)}", flush=True)


if __name__ == "__main__":
    main()
