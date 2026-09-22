import gzip
import json
import os
import re
import xml.etree.ElementTree as ET
from collections import defaultdict

OUT = "data/lexicon"
SOURCE_DIR = os.environ.get("LEXICON_SOURCE_DIR", "lexicon-sources")
os.makedirs(OUT, exist_ok=True)


def key(value):
    return (re.sub(r"[ًٌٍَُِّْـ]", "", str(value or ""))
            .replace("إ", "ا").replace("أ", "ا").replace("آ", "ا")
            .replace("ٱ", "ا").replace("ى", "ي").replace("ة", "ه").strip())


def valid_arabic_meaning(value):
    meaning = re.sub(r"\s+", " ", str(value or "")).strip()
    if not meaning or not re.search(r"[\u0600-\u06ff]", meaning):
        return False
    # لا نخلط الترجمة الإنجليزية أو النقل الصوتي بالتعريف العربي.
    if re.search(r"[A-Za-zʔāīūĀĪŪ]", meaning):
        return False
    if re.search(r"https?://|www\.|\{\{|\}\}|<[^>]+>", meaning):
        return False
    return True


def add(index, word, meaning, source, license_url, pos=""):
    k = key(word)
    meaning = re.sub(r"\s+", " ", str(meaning or "")).strip()
    if not k or not valid_arabic_meaning(meaning):
        return
    item = {"text": str(word).strip(), "meaning": meaning, "source": source, "license": license_url}
    if pos:
        item["pos"] = pos
    if not any(x.get("meaning") == meaning and x.get("source") == source for x in index[k]):
        index[k].append(item)


index = defaultdict(list)
awn = os.path.join(SOURCE_DIR, "awn4.xml.gz")
if os.path.exists(awn):
    synsets = {}
    for _, elem in ET.iterparse(gzip.open(awn, "rb"), events=("end",)):
        if elem.tag.endswith("Synset"):
            synsets[elem.attrib.get("id")] = elem.findtext("Definition") or ""
            elem.clear()
    for _, elem in ET.iterparse(gzip.open(awn, "rb"), events=("end",)):
        if elem.tag.endswith("LexicalEntry"):
            lemma = elem.find("Lemma")
            if lemma is not None:
                for sense in elem.findall("Sense"):
                    meaning = synsets.get(sense.attrib.get("synset"), "")
                    if meaning:
                        add(index, lemma.attrib.get("writtenForm"), meaning, "Arabic WordNet 4.1", "https://creativecommons.org/licenses/by/4.0/", lemma.attrib.get("partOfSpeech", ""))
            elem.clear()

kaikki = os.path.join(SOURCE_DIR, "kaikki-arabic.jsonl")
if os.path.exists(kaikki):
    with open(kaikki, encoding="utf-8") as stream:
        for line in stream:
            try:
                data = json.loads(line)
            except Exception:
                continue
            word = data.get("word", "")
            if not re.search(r"[\u0600-\u06ff]", word):
                continue
            glosses = ["؛ ".join(str(x) for x in sense.get("glosses", []) if x) for sense in data.get("senses", [])[:8]]
            glosses = [x for x in glosses if x]
            for gloss in glosses:
                add(index, word, gloss, "Kaikki / Wiktionary العربية", "https://creativecommons.org/licenses/by-sa/4.0/", data.get("pos", ""))
            for form in data.get("forms", []):
                variant = form.get("form", "") if isinstance(form, dict) else ""
                if variant and not re.search(r"[A-Za-zʔāīū]", variant) and re.search(r"[\u0600-\u06ff]", variant):
                    for gloss in glosses[:3]:
                        add(index, variant, gloss, "Kaikki / Wiktionary العربية", "https://creativecommons.org/licenses/by-sa/4.0/", data.get("pos", ""))

result = {k: values[:12] for k, values in index.items() if values}
source_ids = {}
sources = []
compact = {}
for key_name, values in result.items():
    compact[key_name] = []
    for item in values:
        source_key = (item["source"], item["license"])
        if source_key not in source_ids:
            source_ids[source_key] = len(sources)
            sources.append(list(source_key))
        compact[key_name].append([item["meaning"], source_ids[source_key], item.get("pos", "")])
with open(os.path.join(OUT, "lexicon.json"), "w", encoding="utf-8") as stream:
    json.dump({"version": "2026-09-22", "sources": sources, "compact": True, "entries": compact}, stream, ensure_ascii=False, separators=(",", ":"))
print(f"keys={len(result)} entries={sum(map(len, result.values()))}")
