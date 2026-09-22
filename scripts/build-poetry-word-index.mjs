// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Abdullah Qatan
// The generated word list is a mechanical index of the separately licensed poetry database.
import fs from "node:fs";
import path from "node:path";

const arabicWord = /[\u0621-\u063A\u0641-\u064A]+/gu;
const normalize = (value) => String(value ?? "")
  .replace(/[ًٌٍَُِّْـٰۖۗۚۛۜۙۘ۝۞]/gu, "")
  .replace(/[إأآٱ]/gu, "ا")
  .replace(/ى/gu, "ي")
  .replace(/ة/gu, "ه")
  .trim();
const words = new Set();
let sourceFiles = 0;
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (entry.isFile() && entry.name.endsWith(".json")) {
      const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
      const rows = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
      for (const row of rows) {
        for (const token of String(row.poem_text ?? "").match(arabicWord) ?? []) {
          const word = normalize(token);
          if (word.length >= 2) words.add(word);
        }
      }
      sourceFiles += 1;
    }
  }
};
walk("data/poetry");
const output = {
  version: "2026-09-22",
  source: "local Arabic poetry database",
  sourceFiles,
  databaseLicense: "ODbL 1.0",
  contentsLicense: "DbCL 1.0",
  attribution: "Arabic Poetry Dataset / mdanok; see data/POETRY-LICENSE",
  words: [...words].sort((a, b) => a.localeCompare(b, "ar")),
};
fs.writeFileSync("data/lexicon/poetry-words.json", `${JSON.stringify(output)}\n`);
console.log(JSON.stringify({ words: output.words.length, sourceFiles, bytes: fs.statSync("data/lexicon/poetry-words.json").size }));
