import fs from "node:fs";

const lexicon = JSON.parse(fs.readFileSync("data/lexicon/lexicon.json", "utf8"));
const wanted = new Set();
const normalize = (value) => String(value ?? "")
  .replace(/[ًٌٍَُِّْـ]/g, "")
  .replace(/[إأآٱ]/g, "ا")
  .replace(/ى/g, "ي")
  .replace(/ة/g, "ه");
for (let i = 0; i < 76; i += 1) {
  const path = `data/poetry/part-${String(i).padStart(3, "0")}.json`;
  if (!fs.existsSync(path)) continue;
  for (const poem of JSON.parse(fs.readFileSync(path, "utf8"))) {
    for (const word of String(poem.poem_text ?? "").match(/[\u0600-\u06ff]+/g) ?? []) {
      const key = normalize(word);
      if (key.length >= 2) wanted.add(key);
    }
  }
}
const entries = {};
for (const [rawKey, values] of Object.entries(lexicon.entries ?? {})) {
  const key = normalize(rawKey);
  if (!wanted.has(key) || entries[key]) continue;
  entries[key] = values.slice(0, 4);
}
const core = { compact: true, generated: "local-poetry-index", sources: lexicon.sources, entries };
fs.writeFileSync("data/lexicon/lexicon-core.json", JSON.stringify(core));
console.log(JSON.stringify({ keys: Object.keys(entries).length, bytes: fs.statSync("data/lexicon/lexicon-core.json").size }));
