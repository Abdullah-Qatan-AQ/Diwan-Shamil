import fs from "node:fs";

const lexicon = JSON.parse(fs.readFileSync("data/lexicon/lexicon.json", "utf8"));
const coverage = JSON.parse(fs.readFileSync("data/lexicon/poetry-coverage.json", "utf8"));
const arabicKey = /^[\u0600-\u06ff]+$/u;
const normalize = (value) => String(value ?? "")
  .replace(/[ًٌٍَُِّْـ]/g, "")
  .replace(/[إأآٱ]/g, "ا")
  .replace(/ى/g, "ي")
  .replace(/ة/g, "ه");
const entries = {};
for (const [rawKey, values] of Object.entries(lexicon.entries ?? {})) {
  const key = normalize(rawKey);
  if (!arabicKey.test(key) || !key || entries[key]) continue;
  entries[key] = values.slice(0, 4);
}
const core = {
  compact: true,
  generated: "all-arabic-lexicon-index",
  sources: lexicon.sources,
  coverage: [...new Set((coverage.coverage ?? []).map(normalize).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar")),
  entries,
};
fs.writeFileSync("data/lexicon/lexicon-core.json", JSON.stringify(core));
console.log(JSON.stringify({ keys: Object.keys(entries).length, coverage: core.coverage.length, bytes: fs.statSync("data/lexicon/lexicon-core.json").size }));
