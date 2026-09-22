import fs from "node:fs";

const inputPath = "data/lexicon/poetry-coverage.json";
const outputDir = "data/lexicon/coverage";
const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const words = [...new Set((input.coverage ?? []).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar"));
const shardCount = 8;

fs.mkdirSync(outputDir, { recursive: true });
for (let index = 0; index < shardCount; index += 1) {
  const start = Math.floor((index * words.length) / shardCount);
  const end = Math.floor(((index + 1) * words.length) / shardCount);
  const filename = `part-${String(index + 1).padStart(2, "0")}.json`;
  fs.writeFileSync(
    `${outputDir}/${filename}`,
    JSON.stringify({
      version: input.version ?? "2026-09-22",
      part: index + 1,
      totalParts: shardCount,
      coverage: words.slice(start, end),
    }),
  );
}

fs.writeFileSync(
  `${outputDir}/index.json`,
  JSON.stringify({
    version: input.version ?? "2026-09-22",
    total: words.length,
    totalParts: shardCount,
    shards: Array.from(
      { length: shardCount },
      (_, index) => `./data/lexicon/coverage/part-${String(index + 1).padStart(2, "0")}.json`,
    ),
  }),
);
console.log(JSON.stringify({ total: words.length, shards: shardCount }));
