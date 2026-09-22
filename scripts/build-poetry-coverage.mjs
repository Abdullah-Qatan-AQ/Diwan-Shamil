import fs from "node:fs";
import path from "node:path";

const ROOT = "data";
const OUTPUT = "data/lexicon/poetry-coverage.json";
const ARABIC_WORD = /[\u0621-\u063A\u0641-\u064A]+/gu;
const normalize = (value) => String(value ?? "")
  .replace(/[ًٌٍَُِّْـ]/gu, "")
  .replace(/[إأآٱ]/gu, "ا")
  .replace(/ى/gu, "ي")
  .replace(/ة/gu, "ه")
  .trim();

const files = [];
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (fullPath === "data/lexicon") continue;
      walk(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(fullPath);
    }
  }
};
walk(ROOT);

const words = new Set();
let sourceFiles = 0;
for (const file of files) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    continue;
  }
  const text = JSON.stringify(data);
  const matches = text.match(ARABIC_WORD) ?? [];
  for (const word of matches) {
    const key = normalize(word);
    if (key) words.add(key);
  }
  sourceFiles += 1;
}

const coverage = [...words].sort((a, b) => a.localeCompare(b, "ar"));
fs.writeFileSync(
  OUTPUT,
  JSON.stringify({
    version: "2026-09-22",
    source: "local Quran, hadith, and poetry JSON corpora",
    sourceFiles,
    coverage,
  }),
);
console.log(JSON.stringify({ words: coverage.length, sourceFiles, bytes: fs.statSync(OUTPUT).size }));
