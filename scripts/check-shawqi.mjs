import fs from "node:fs";

const index = JSON.parse(fs.readFileSync("data/poetry/ahmad-shawqi.json", "utf8"));
const poems = JSON.parse(fs.readFileSync("data/poetry/ahmad-shawqi-part-000.json", "utf8"));
if (index.count !== poems.length) throw new Error("count mismatch");
if (!index.sourceUrl || !index.license || !index.partPattern) throw new Error("incomplete source metadata");
if (!poems[0]?.source_url || !poems[0]?.attribution || !poems[0]?.poem_text) throw new Error("incomplete poem attribution");
if (poems[0].poet_name !== "أحمد شوقي") throw new Error("wrong poet");
console.log("shawqi source: ok");
