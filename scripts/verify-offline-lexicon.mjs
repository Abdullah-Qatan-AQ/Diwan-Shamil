import fs from "node:fs";

const normalize = (value) => String(value ?? "")
  .replace(/[ًٌٍَُِّْـ]/gu, "")
  .replace(/[إأآٱ]/gu, "ا")
  .replace(/ى/gu, "ي")
  .replace(/ة/gu, "ه")
  .trim();
const arabicWord = /^[\u0621-\u063A\u0641-\u064A]+$/u;
const coverage = JSON.parse(fs.readFileSync("data/lexicon/poetry-coverage.json", "utf8"));
const words = coverage.coverage ?? [];
const invalid = words.filter((word) => !arabicWord.test(word) || !normalize(word));
const unique = new Set(words);
if (invalid.length) throw new Error(`Invalid Arabic coverage words: ${invalid.slice(0, 10).join(", ")}`);
if (unique.size !== words.length) throw new Error("Coverage contains duplicate words");

const manifest = JSON.parse(fs.readFileSync("data/lexicon/coverage/index.json", "utf8"));
const shardWords = [];
for (const shardPath of manifest.shards ?? []) {
  const shard = JSON.parse(fs.readFileSync(shardPath.replace(/^\.\//, ""), "utf8"));
  shardWords.push(...(shard.coverage ?? []));
}
if (shardWords.length !== words.length) {
  throw new Error(`Shard count ${shardWords.length} does not match coverage count ${words.length}`);
}
if (new Set(shardWords).size !== words.length) throw new Error("Shards contain duplicate words");
const expected = [...words].sort((a, b) => a.localeCompare(b, "ar")).join("\n");
const actual = [...shardWords].sort((a, b) => a.localeCompare(b, "ar")).join("\n");
if (expected !== actual) throw new Error("Shards do not contain exactly the coverage words");

const lexicon = JSON.parse(fs.readFileSync("data/lexicon/lexicon-core.json", "utf8"));
const defined = Object.keys(lexicon.entries ?? []).filter((key) => words.includes(key));
console.log(JSON.stringify({ words: words.length, shards: shardWords.length, definedCoreKeys: defined.length, invalid: 0 }));
