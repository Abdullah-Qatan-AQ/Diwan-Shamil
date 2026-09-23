import fs from "node:fs";

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const basePath = "data/lexicon/original-glosses.json";
const additionsPath = "data/lexicon/original-additions.json";
const lettersPath = "data/lexicon/original-letters.json";
const base = read(basePath);
const additions = read(additionsPath);
const letters = read(lettersPath);
const entries = {};

const add = (sourceFile, sourceEntries) => {
  for (const [key, values] of Object.entries(sourceEntries || {})) {
    if (!entries[key]) entries[key] = [];
    for (const value of values) {
      const duplicate = entries[key].some((item) => item.meaning === value.meaning && item.source === value.source && item.pos === value.pos);
      if (!duplicate) entries[key].push(value);
    }
  }
};

// Preserve the original MIT-authored project glosses, but remove old
// one-letter alphabet explanations: the requested "letters" are attached
// words/phrases, not isolated Arabic letters. Filter values individually so
// a key such as "و" can retain its genuine conjunction gloss without keeping
// the obsolete alphabet-character gloss.
for (const [key, values] of Object.entries(base.entries || {})) {
  const filtered = values.filter((value) => !String(value.pos || "").includes("حرف هجائي"));
  if (filtered.length) add("original-glosses.json", { [key]: filtered });
}
add("original-additions.json", additions.entries);
add("original-letters.json", letters.entries);

const output = {
  version: "2026-09-23",
  license: "MIT",
  copyright: "Copyright (c) 2026 Abdullah Qatan",
  author: "Abdullah Qatan",
  scope: "معانٍ عربية أصلية وملاحظات تفسيرية أولية وعبارات عربية قصيرة ومتلاصقة صيغت لهذا المشروع.",
  notice: "الألفاظ العربية العامة ليست ملكًا للمشروع، والترخيص يخص الصياغة والبنية والاختيار الأصليين فقط. هذه الشروح ليست بديلاً عن المعاجم المتخصصة.",
  entries,
  mergedSources: {
    "original-glosses.json": "محتوى MIT أصلي للمشروع؛ حُفظ مع إزالة تعريفات الحروف المفردة القديمة فقط.",
    "original-additions.json": "محتوى MIT أصلي للمشروع؛ دُمج كما هو مع إزالة التكرارات.",
    "original-letters.json": "محتوى MIT أصلي للمشروع؛ المقصود عبارات وأدوات متلاصقة، لا الحروف الهجائية المفردة.",
    excludedExternalData: ["data/quran.json", "data/ara-*.json", "data/poetry/*.json", "data/lexicon/lexicon.json", "data/lexicon/lexicon-core.json", "data/lexicon/wiktionary*.json"]
  }
};
fs.writeFileSync(basePath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ entries: Object.keys(entries).length, removedAlphabetEntries: Object.keys(base.entries || {}).length - Object.keys(entries).length + Object.keys(additions.entries || {}).length + Object.keys(letters.entries || {}).length }));
