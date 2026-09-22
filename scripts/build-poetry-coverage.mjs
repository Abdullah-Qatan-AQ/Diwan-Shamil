import fs from "node:fs";
const normalize = (value) => String(value ?? "").replace(/[ًٌٍَُِّْـ]/g, "").replace(/[إأآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").trim();
const words = new Set();
for (let i = 0; i < 76; i += 1) {
  const path = `data/poetry/part-${String(i).padStart(3, "0")}.json`;
  if (!fs.existsSync(path)) continue;
  for (const poem of JSON.parse(fs.readFileSync(path, "utf8"))) {
    for (const word of String(poem.poem_text ?? "").match(/[\u0600-\u06ff]+/g) ?? []) {
      const key = normalize(word);
      if (key) words.add(key);
    }
  }
}
const coverage = [...words].sort();
fs.writeFileSync("data/lexicon/poetry-coverage.json", JSON.stringify({ version: "2026-09-22", coverage }));
console.log(JSON.stringify({ words: coverage.length, bytes: fs.statSync("data/lexicon/poetry-coverage.json").size }));
