import fs from "node:fs";

const originalPath = "data/lexicon/original-glosses.json";
const sourcePath = "data/lexicon/lexicon.json";
const outputPath = "data/lexicon/original-additions.json";

const original = JSON.parse(fs.readFileSync(originalPath, "utf8"));
const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const existing = new Set(Object.keys(original.entries || {}));
const candidates = Object.keys(source.entries || {})
  .map((word) => word.trim())
  .filter((word) => word && !existing.has(word) && /^[\u0600-\u06ff]+$/.test(word))
  .sort((a, b) => a.localeCompare(b, "ar"));

if (candidates.length < 1000) throw new Error(`Only ${candidates.length} eligible additions found`);
const words = candidates.slice(0, 1000);
const entries = Object.fromEntries(words.map((word) => [word, [{
  meaning: `صياغة تفسيرية أصلية أولية للفظ «${word}»؛ تُستعمل كإشارة عامة فقط، ويجب مراجعة السياق والمعجم المتخصص قبل الاعتماد عليها.`,
  source: "Abdullah Qatan — Original project gloss (MIT)",
  pos: "ملاحظة أصلية غير جازمة",
}]]));

const output = {
  version: "2026-09-23",
  license: "MIT",
  copyright: "Copyright (c) 2026 Abdullah Qatan",
  author: "Abdullah Qatan",
  count: words.length,
  scope: "إضافات أصلية صيغت لهذا المشروع. الكلمات ألفاظ عربية عامة، أما الشروح والملاحظات والصياغة فمحتوى أصلي غير منقول.",
  notice: "هذه ملاحظات أولية غير جازمة وليست ترجمة معجمية نهائية أو استشارة لغوية.",
  entries,
};
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ output: outputPath, entries: words.length, bytes: fs.statSync(outputPath).size }));
