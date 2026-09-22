import fs from "node:fs";
import path from "node:path";

const dir = "data/poetry";
const partFiles = fs.readdirSync(dir).filter((file) => /^part-\d+\.json$/.test(file)).sort();
const allRows = [];
let removed = 0;

for (const file of partFiles) {
  const filePath = path.join(dir, file);
  const rows = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const valid = rows.filter((row) => {
    const ok = String(row?.poet_name || "").trim() && String(row?.poem_title || "").trim() && String(row?.poem_text || "").trim();
    if (!ok) removed += 1;
    return ok;
  });
  fs.writeFileSync(filePath, JSON.stringify(valid));
  allRows.push(...valid);
}

const supplementalFiles = [
  "ahmad-shawqi-part-000.json",
  "elia-abu-madi-part-000.json",
];
const supplementalRows = supplementalFiles.flatMap((file) => JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")));
fs.writeFileSync(path.join(dir, "supplemental.json"), JSON.stringify(supplementalRows));

const oldPoets = JSON.parse(fs.readFileSync(path.join(dir, "poets.json"), "utf8")).poets;
const oldMeta = new Map(oldPoets.map((poet) => [poet.name, poet]));
const counts = new Map();
const eras = new Map();
for (const row of [...allRows, ...supplementalRows]) {
  counts.set(row.poet_name, (counts.get(row.poet_name) || 0) + 1);
  if (!eras.has(row.poet_name)) eras.set(row.poet_name, row.poet_era || "");
}
const categoryForEra = {
  "العصر الجاهلي": ["الجاهليون", "القدماء"],
  "المخضرمون": ["المخضرمون", "القدماء"],
  "العصر الاسلامي": ["صدر الإسلام", "القدماء"],
  "العصر الاموي": ["الأمويون", "القدماء"],
  "العصر العباسي": ["العباسيون", "القدماء"],
  "العصر الأندلسي": ["الأندلسيون", "القدماء"],
  "العصر الايوبي": ["الأيوبيون", "القدماء"],
  "العصر المملوكي": ["المماليك", "القدماء"],
  "العصر العثماني": ["العثمانيون", "القدماء"],
  "العصر الحديث": ["الحديثون"],
};
const explicit = {
  "إيليا أبو ماضي": ["شعراء المهجر"],
};
const poetNames = [...oldPoets.map((poet) => poet.name).filter((name) => counts.has(name)), ...[...counts.keys()].filter((name) => !oldMeta.has(name))];
const poets = poetNames.map((name) => {
  const era = eras.get(name) || oldMeta.get(name)?.eras?.[0] || "";
  const categories = [...(categoryForEra[era] || []), ...(explicit[name] || []), ...(oldMeta.get(name)?.categories || [])];
  return { name, count: counts.get(name), eras: era ? [era] : [], categories: [...new Set(categories)] };
});
fs.writeFileSync(path.join(dir, "poets.json"), `${JSON.stringify({ title: "فهرس دواوين الشعراء", count: poets.length, poets }, null, 2)}\n`);

const index = JSON.parse(fs.readFileSync(path.join(dir, "index.json"), "utf8"));
Object.assign(index, {
  count: allRows.length + supplementalRows.length,
  poetCount: poets.length,
  supplementalFile: "data/poetry/supplemental.json",
  supplementalCount: supplementalRows.length,
  validRecordPolicy: "السجلات التي تفتقد اسم الشاعر أو عنوان القصيدة أو نصها مستبعدة من الفهرس القابل للبحث.",
});
fs.writeFileSync(path.join(dir, "index.json"), `${JSON.stringify(index, null, 2)}\n`);
console.log(JSON.stringify({ removed, mainCount: allRows.length, supplementalCount: supplementalRows.length, count: index.count, poetCount: index.poetCount }, null, 2));
