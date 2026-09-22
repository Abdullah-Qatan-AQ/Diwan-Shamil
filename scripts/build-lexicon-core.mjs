import fs from "node:fs";

const lexicon = JSON.parse(fs.readFileSync("data/lexicon/lexicon.json", "utf8"));
const coverage = JSON.parse(fs.readFileSync("data/lexicon/poetry-coverage.json", "utf8"));
const normalize = (value) => String(value ?? "")
  .replace(/[ًٌٍَُِّْـ]/g, "")
  .replace(/[إأآٱ]/g, "ا")
  .replace(/ى/g, "ي")
  .replace(/ة/g, "ه");
const wanted = new Set((coverage.coverage ?? []).map(normalize).filter((word) => word.length >= 2));
const entries = {};
for (const [rawKey, values] of Object.entries(lexicon.entries ?? {})) {
  const key = normalize(rawKey);
  if (!wanted.has(key) || entries[key]) continue;
  entries[key] = values.slice(0, 4);
}
const core = {
  compact: true,
  generated: "local-quran-hadith-poetry-index",
  sources: lexicon.sources,
  coverage: [...wanted].sort((a, b) => a.localeCompare(b, "ar")),
  entries,
};
fs.writeFileSync("data/lexicon/lexicon-core.json", JSON.stringify(core));
console.log(JSON.stringify({ keys: Object.keys(entries).length, coverage: core.coverage.length, bytes: fs.statSync("data/lexicon/lexicon-core.json").size }));
