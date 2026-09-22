import fs from "node:fs";

const isArabicMeaning = (value) => {
  const text = String(value ?? "").trim();
  return /[\u0600-\u06ff]/u.test(text)
    && !/[\p{Script=Latin}]/u.test(text)
    && !/https?:\/\/|www\.|\{\{|\}\}|<[^>]+>/u.test(text);
};

const sourcePath = "data/lexicon/lexicon.json";
const data = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
let before = 0;
let after = 0;
let removedKeys = 0;
const entries = {};
for (const [key, values] of Object.entries(data.entries ?? {})) {
  before += values.length;
  const clean = values.filter((value) => {
    const meaning = Array.isArray(value) ? value[0] : value?.meaning;
    return isArabicMeaning(meaning);
  });
  after += clean.length;
  if (clean.length) entries[key] = clean;
  else removedKeys += 1;
}
data.entries = entries;
data.quality = {
  policy: "Arabic definitions only; Latin, URLs, markup, and transliterations excluded",
  removedEntries: before - after,
  removedKeys,
  generated: "2026-09-22",
};
fs.writeFileSync(sourcePath, JSON.stringify(data), "utf8");
console.log(JSON.stringify({ before, after, removedEntries: before - after, removedKeys, bytes: fs.statSync(sourcePath).size }));
