const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>\"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const cleanText = (value) =>
  String(value ?? "")
    .replace(/<br\s*\/?>(?=\s*\[|\s*$)/gi, "\n")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
const lexicalWord = (value) => String(value ?? "")
  .replace(/[ًٌٍَُِّْـٰۖۗۚۛۜۙۘ۝۞ۣ۟۠ۡۢۤۥۦۧۨ۩۪ۭ۫۬]/gu, "")
  .trim();
const normalizeLexiconKey = (value) => lexicalWord(value)
  .replace(/[إأآٱ]/g, "ا")
  .replace(/ى/g, "ي")
  .replace(/ة/g, "ه");
const isArabicDefinition = (value) => {
  const text = String(value ?? "").trim();
  return /[\u0600-\u06ff]/u.test(text) && !/[\p{Script=Latin}]/u.test(text);
};
function renderLexicalText(value) {
  return cleanText(value).split(/(\s+)/).map((token) => {
    const match = token.match(/^([^\u0600-\u06ff]*)([\u0600-\u06ff]+)([^\u0600-\u06ff]*)$/i);
    if (!match) return esc(token);
    const word = lexicalWord(match[2]);
    return `${esc(match[1])}<button type="button" class="lexical-word" data-word="${esc(word)}" aria-label="شرح كلمة ${esc(word)}">${esc(match[2])}</button>${esc(match[3])}`;
  }).join("");
}
const renderPoemText = renderLexicalText;

const collections = [
  ["القرآن الكريم", "قرآن", "data/quran.json", "quran"],
  ["صحيح البخاري", "حديث", "data/ara-bukhari.json", "hadith"],
  ["صحيح مسلم", "حديث", "data/ara-muslim.json", "hadith"],
  ["جامع الترمذي", "حديث", "data/ara-tirmidhi.json", "hadith"],
  ["سنن أبي داود", "حديث", "data/ara-abudawud.json", "hadith"],
  ["سنن النسائي", "حديث", "data/ara-nasai.json", "hadith"],
  ["سنن ابن ماجه", "حديث", "data/ara-ibnmajah.json", "hadith"],
  ["موطأ مالك", "حديث", "data/ara-malik.json", "hadith"],
  ["مسند أحمد", "حديث", "data/ara-ahmad.json", "hadith"],
  ["سنن الدارمي", "حديث", "data/ara-darimi.json", "hadith"],
  ["الأربعون للشاه ولي الله الدهلوي", "حديث", "data/ara-dehlawi.json", "hadith"],
  ["الأربعون النووية", "حديث", "data/ara-nawawi.json", "hadith"],
  ["الأربعون القدسية", "حديث", "data/ara-qudsi.json", "hadith"],
  ["موسوعة الشعر العربي", "شعر", "data/poetry/index.json", "poetry"],
];
const defaults = { font: 24, theme: "sand", remember: true };
const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};
const settings = { ...defaults, ...readJson("diwan-settings", {}) };
const state = {
  view: "home",
  routeHistory: [],
  font: Number(settings.font) || 24,
  surahs: [],
  surah: Number(localStorage.getItem("diwan-surah")) || 1,
  q: "",
  catalogFilter: "الكل",
  bookmarks: Array.isArray(readJson("diwan-bookmarks", []))
    ? readJson("diwan-bookmarks", [])
    : [],
  poetryIndex: null,
  poetryParts: [],
  poetryLoaded: 0,
  poetryQuery: "",
  poetryEra: "الكل",
  poetryLoading: false,
  poetryReady: false,
  poetryPoets: [],
  poetryPoet: "الكل",
  poetryPoetSearch: "",
  poetryCategory: "الكل",
  poetryLimit: 60,
  poetryShowAll: false,
  poetryAllLoading: false,
  poetryLoadPromise: null,
  poetryPartPromise: null,
  poetrySupplementalLoaded: false,
  poetryLoadError: "",
  poetrySearchToken: 0,
  hadithData: null,
  hadithLoading: false,
  renderToken: 0,
  settingsModalOpen: false,
  readingPositions: Array.isArray(readJson("diwan-positions", []))
    ? readJson("diwan-positions", [])
    : [],
  resumePosition: null,
  wordMeaningCache: {},
  lexicon: {},
  lexiconCoverage: new Set(),
  lexiconPromise: null,
};

function persist() {
  localStorage.setItem(
    "diwan-settings",
    JSON.stringify({ ...settings, font: state.font }),
  );
  localStorage.setItem("diwan-bookmarks", JSON.stringify(state.bookmarks));
  localStorage.setItem("diwan-surah", String(state.surah));
  localStorage.setItem("diwan-positions", JSON.stringify(state.readingPositions));
}
async function fetchJson(url, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: "default" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    // A service-worker/cache response keeps the reader usable when the network stalls.
    try {
      const cached = await caches.match(url);
      if (cached) return await cached.json();
    } catch {
      // Continue to the user-facing error below.
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function showStatus(message, kind = "ok") {
  let element = $("#app-status");
  if (!element) {
    element = document.createElement("div");
    element.id = "app-status";
    document.body.appendChild(element);
  }
  element.className = kind;
  element.textContent = message;
  clearTimeout(showStatus.timer);
  showStatus.timer = setTimeout(() => element.remove(), 5000);
}
function closeWordMeaning() {
  $("#word-meaning-modal")?.remove();
}
function lexiconCandidates(word) {
  const normalized = normalizeLexiconKey(word);
  const candidates = new Set([normalized]);
  const prefixes = ["وال", "فال", "بال", "كال", "لل", "ال", "و", "ف", "ب", "ك", "ل", "س"];
  for (const prefix of prefixes) {
    if (normalized.startsWith(prefix) && normalized.length - prefix.length >= 3) candidates.add(normalized.slice(prefix.length));
  }
  for (const candidate of [...candidates]) {
    for (const suffix of ["هما", "كما", "كم", "كن", "هم", "هن", "ها", "نا", "ني", "يه", "ية", "ات", "ون", "ين", "ان", "وا", "ه", "ي", "ك"]) {
      if (candidate.endsWith(suffix) && candidate.length - suffix.length >= 3) candidates.add(candidate.slice(0, -suffix.length));
    }
  }
  return [...candidates];
}
function renderWordMeaning(word, body, loading = false) {
  closeWordMeaning();
  const sourceUrl = `https://ar.wiktionary.org/wiki/${encodeURIComponent(word)}`;
  const modal = document.createElement("div");
  modal.id = "word-meaning-modal";
  modal.className = "settings-backdrop lexical-modal";
  modal.innerHTML = `<section class="settings-modal lexical-card" role="dialog" aria-modal="true" aria-labelledby="word-meaning-title"><button class="modal-close" type="button" aria-label="إغلاق">×</button><span class="kicker">الترجمة الحرفية ومعنى الكلمة</span><h2 id="word-meaning-title">${esc(word)}</h2><div class="lexical-body">${loading ? '<div class="loading-more">جاري قراءة الترجمة المحلية…</div>' : body}</div><p class="lexical-source">المصدر المحلي: <a href="${esc(sourceUrl)}" target="_blank" rel="noopener noreferrer">ويكاموس العربي</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.ar" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a></p></section>`;
  document.body.appendChild(modal);
  const close = () => modal.remove();
  $(".modal-close", modal).addEventListener("click", close);
  modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
  document.addEventListener("keydown", function escape(event) {
    if (event.key === "Escape") { close(); document.removeEventListener("keydown", escape); }
  }, { once: true });
}
async function showWordMeaning(rawWord) {
  const word = lexicalWord(rawWord);
  if (!word) return;
  const cached = state.wordMeaningCache[word];
  if (cached) {
    renderWordMeaning(word, cached);
    return;
  }
  // افتح النافذة فورًا؛ لا ننتظر قراءة ملف المعجم الكبير قبل إعطاء المستخدم استجابة.
  renderWordMeaning(word, "", true);
  if (state.lexiconPromise) await state.lexiconPromise;
  const candidates = lexiconCandidates(word);
  const entries = candidates.flatMap((candidate) => state.lexicon[candidate] || [])
    .filter((entry) => isArabicDefinition(entry?.meaning))
    .filter((entry, index, all) => all.findIndex((item) => `${item.source}|${item.meaning}` === `${entry.source}|${entry.meaning}`) === index);
  const hasContextualCoverage = !entries.length && candidates.some((candidate) => state.lexiconCoverage.has(candidate));
  const body = entries.length
    ? `<p class="literal-translation"><b>الترجمة الحرفية:</b> ${esc(entries[0].meaning || "")}</p>${entries.slice(0, 8).map((entry, index) => `<p><b>${index + 1}.</b> ${esc(entry.meaning || "")} <small class="muted">— ${esc(entry.source || "مصدر محلي")}${entry.pos ? ` · ${esc(entry.pos)}` : ""}</small></p>`).join("")}`
    : hasContextualCoverage
      ? '<p class="muted">هذه الكلمة موجودة في نصوص القرآن أو الحديث أو الشعر، لكن لا توجد لها ترجمة حرفية موثقة في الملفات المحلية الحالية؛ لم يتم اختلاق معنى.</p>'
      : '<p class="muted">لا توجد ترجمة حرفية موثقة لهذه الكلمة في المعجم المحلي المضمّن.</p>';
  state.wordMeaningCache[word] = body;
  renderWordMeaning(word, body);
}
function bindLexicalWords(root) {
  $$(".lexical-word", root).forEach((button) => button.addEventListener("click", () => showWordMeaning(button.dataset.word)));
}
function wiktionaryPlainText(source) {
  return String(source || "")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/^={2,6}[^\n]+={2,6}$/gm, "")
    .replace(/^\s*\[?\[?تصنيف:[^\n]+$/gim, "")
    .replace(/[\t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
async function loadLexicon() {
  const decode = (data) => {
    if (!data?.entries || typeof data.entries !== "object") return {};
    const result = {};
    for (const [rawKey, values] of Object.entries(data.entries)) {
      const key = normalizeLexiconKey(rawKey);
      if (!key) continue;
      const decoded = data.compact && Array.isArray(data.sources)
        ? (Array.isArray(values) ? values.map(([meaning, sourceId, pos]) => ({
            meaning,
            pos,
            source: data.sources[sourceId]?.[0] || "مصدر محلي",
            license: data.sources[sourceId]?.[1] || "",
          })) : [])
        : (Array.isArray(values) ? values : []);
      if (!result[key]) result[key] = [];
      for (const entry of decoded) {
        if (entry?.meaning && isArabicDefinition(entry.meaning) && !result[key].some((item) => item.meaning === entry.meaning && item.source === entry.source)) {
          result[key].push(entry);
        }
      }
    }
    return {
      entries: result,
      coverage: new Set(Array.isArray(data.coverage) ? data.coverage.map(normalizeLexiconKey) : []),
    };
  };
  try {
    // هذا الملف الصغير مبني من نفس JSON المحلي ويضمن تعريفًا سريعًا أثناء القراءة دون نت.
    const core = decode(await fetchJson("./data/lexicon/lexicon-core.json", 12000));
    state.lexicon = core.entries;
    state.lexiconCoverage = core.coverage;
  } catch {
    state.lexicon = {};
    state.lexiconCoverage = new Set();
  }
  try {
    const original = decode(await fetchJson("./data/lexicon/original-glosses.json", 12000));
    for (const [key, values] of Object.entries(original.entries)) {
      state.lexicon[key] = [...values, ...(state.lexicon[key] || [])];
    }
  } catch {
    // المعاني الأصلية اختيارية عند تشغيل نسخة قديمة من الحزمة.
  }
  for (const path of ["./data/lexicon/original-additions.json", "./data/lexicon/original-letters.json"]) {
    try {
      const additions = decode(await fetchJson(path, 12000));
      for (const [key, values] of Object.entries(additions.entries)) {
        state.lexicon[key] = [...values, ...(state.lexicon[key] || [])];
      }
    } catch {
      // تبقى النسخ القديمة قابلة للتشغيل قبل تحديث ملفات المعجم.
    }
  }
  // حمّل الفهرس الكامل لاحقًا لتحسين التغطية، من دون تعطيل النافذة أو استبدال الفهرس السريع.
  void (async () => {
    try {
      const full = decode(await fetchJson("./data/lexicon/lexicon.json", 45000));
      for (const [key, values] of Object.entries(full.entries)) {
        if (!state.lexicon[key]) state.lexicon[key] = values;
        else for (const entry of values) {
          if (!state.lexicon[key].some((item) => item.meaning === entry.meaning && item.source === entry.source)) state.lexicon[key].push(entry);
        }
      }
      for (const key of full.coverage || []) state.lexiconCoverage.add(key);
    } catch {
      // يبقى الفهرس المحلي السريع صالحًا حتى إن تعذر تحليل الملف الكامل.
    }
  })();
  try {
    const manifest = await fetchJson("./data/lexicon/coverage/index.json", 12000);
    const shards = await Promise.all((manifest.shards || []).map((path) => fetchJson(path, 12000)));
    state.lexiconCoverage = new Set(
      shards.flatMap((shard) => shard.coverage || []).map(normalizeLexiconKey),
    );
  } catch {
    // التغطية الإضافية اختيارية؛ يبقى المعجم الأساسي صالحًا دونها.
  }
}
async function copyText(text, label = "النص") {
  const value = String(text || "").trim();
  if (!value) return;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      throw new Error("Clipboard API unavailable");
    }
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) throw new Error("Copy failed");
  }
  showStatus(`تم نسخ ${label}`);
}
function setTheme(theme) {
  if (!["sand", "night", "green", "paper"].includes(theme)) return;
  settings.theme = theme;
  document.documentElement.dataset.theme = theme;
  persist();
}
function navigate(view) {
  if (view === state.view) return;
  state.routeHistory.push(state.view);
  state.view = view;
  state.hadithData = view === "hadith" ? state.hadithData : null;
  if (view !== "poetry") {
    state.poetryIndex = null;
    state.poetryParts = [];
    state.poetrySupplementalLoaded = false;
  }
  render();
}
function resetTransientViews() {
  state.hadithData = null;
  state.hadithLoading = false;
  state.poetryIndex = null;
  state.poetryParts = [];
  state.poetryLoading = false;
  state.poetryReady = false;
}
function goBack() {
  const previous = state.routeHistory.pop();
  const destination = previous && previous !== state.view ? previous : "home";
  state.renderToken += 1;
  state.view = destination;
  $("#app")?.replaceChildren();
  if (destination === "home") {
    state.routeHistory = [];
    resetTransientViews();
    applyReadingStyle();
    document.documentElement.dataset.theme = settings.theme;
    // Render the destination directly; do not route through a stale async view.
    home();
    return;
  }
  state.hadithData = destination === "hadith" ? state.hadithData : null;
  if (destination !== "poetry") {
    state.poetryIndex = null;
    state.poetryParts = [];
    state.poetryLoading = false;
    state.poetryReady = false;
  }
  render();
}

function applyReadingStyle() {
  state.font = Math.max(16, Math.min(40, Number(state.font) || 24));
  document.documentElement.style.setProperty(
    "--reading-size",
    `${state.font}px`,
  );
  document.documentElement.style.setProperty(
    "--reading-line-height",
    `${Math.max(1.7, state.font / 10)}`,
  );
}

function shell(content) {
  const app = $("#app");
  if (!app) throw new Error("العنصر #app غير موجود");
  app.innerHTML = `<div class="app-shell"><header class="topbar"><button id="app-back" class="app-back" type="button" aria-label="رجوع">‹ رجوع</button><a class="brand" href="#"><span class="brand-mark">۞</span><b>الديوان الشامل</b></a><nav aria-label="التنقل الرئيسي"><button type="button" data-view="home">الرئيسية</button><button type="button" data-view="reader">القرآن</button><button type="button" data-view="catalog">الفهرس</button><button type="button" data-view="favorites">المفضلة</button><button type="button" data-view="sources">المصادر</button><button type="button" data-view="settings">الإعدادات</button></nav><button type="button" class="top-search" data-view="catalog" aria-label="بحث">⌕ بحث</button></header><main>${content}</main><footer>الديوان الشامل · مكتبة عربية للقراءة والبحث · <b>من صنع Abdullah Qatan</b></footer></div>`;
  bindShell();
}
function bindShell() {
  $$("[data-view]").forEach((button) =>
    button.addEventListener("click", (event) => {
      event.preventDefault();
      if (button.dataset.view === "settings") {
        openSettingsModal();
        return;
      }
      navigate(button.dataset.view);
    }),
  );
  $("#app-back")?.addEventListener("click", goBack);
  $("#app-back")?.toggleAttribute(
    "hidden",
    state.view === "home" && state.routeHistory.length === 0,
  );
  $(".brand")?.addEventListener("click", (event) => {
    event.preventDefault();
    state.routeHistory = [];
    state.view = "home";
    render();
  });
}

function home() {
  shell(
    `<section class="home"><div class="home-copy"><span class="kicker">مكتبتك العربية</span><h1>المعرفة العربية<br><em>في موضعها.</em></h1><div class="quick-search"><input id="quick-q" type="search" autocomplete="off" placeholder="ابحث في القرآن والحديث والشعر"><button id="quick-go" type="button">بحث</button></div><div class="home-actions"><button type="button" data-view="settings">تخصيص القراءة</button><button id="offline-home" type="button">تنزيل المكتبة</button></div></div><div class="home-mark">۞</div></section><section class="home-grid"><button type="button" data-view="reader"><b>القرآن الكريم</b><span>السور والآيات والبحث داخل السورة</span></button><button type="button" data-view="catalog"><b>الحديث الشريف</b><span>اثنا عشر كتابًا مع بحث وفلاتر</span></button><button type="button" data-view="catalog"><b>الشعر العربي</b><span>75,024 قصيدة مع تحميل تدريجي</span></button><button type="button" data-view="favorites"><b>المفضلة والمواضع</b><span>اجمع نصوصك وواصل القراءة من آخر موضع</span></button><button type="button" data-view="settings"><b>إعدادات وتجربة شخصية</b><span>ثيمات، خط، محفوظات، ونسخ احتياطي</span></button></section>`,
  );
  $("#quick-go").addEventListener("click", () => {
    state.q = $("#quick-q").value.trim();
    navigate("catalog");
  });
  $("#quick-q").addEventListener("keydown", (event) => {
    if (event.key === "Enter") $("#quick-go").click();
  });
  $("#quick-q").addEventListener("focus", focusWithinViewport);
  $("#offline-home").addEventListener("click", downloadLibrary);
}

function focusWithinViewport(event) {
  window.setTimeout(() => {
    event.target.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: "smooth",
    });
  }, 250);
}

async function reader() {
  shell(
    `<div class="page-head"><div><span class="kicker">المصحف</span><h1>القرآن الكريم</h1></div><div class="reader-actions"><button id="minus" type="button">A−</button><button id="plus" type="button">A+</button><button id="save" type="button">☆ حفظ السورة</button><button id="download" type="button">⇩ تنزيل السورة</button></div></div><div class="reader-grid"><aside class="surah-panel"><input id="surah-q" type="search" placeholder="بحث باسم السورة"><div id="surahs" class="surahs">جاري التحميل</div></aside><article class="quran-paper"><div class="paper-head"><div><span id="surah-label" class="kicker">السورة</span><h2 id="surah-title">القرآن الكريم</h2></div><input id="ayah-q" class="inline-search" type="search" placeholder="بحث داخل السورة"><div class="font-readout">${state.font}px</div></div><div id="ayahs" class="ayahs">جاري القراءة…</div></article></div>`,
  );
  $("#minus").addEventListener("click", () => setFont(-2));
  $("#plus").addEventListener("click", () => setFont(2));
  $("#download").addEventListener("click", downloadQuran);
  $("#save").addEventListener("click", () => {
    const added = toggleBookmark({
      id: `surah-${state.surah}`,
      type: "surah",
      title:
        state.surahs.find((item) => item.number === state.surah)?.name ||
        `سورة ${state.surah}`,
    });
    $("#save").textContent = added ? "★ محفوظ" : "☆ حفظ";
  });
  $("#surah-q").addEventListener("input", (event) =>
    drawSurahs(event.target.value),
  );
  $("#ayah-q").addEventListener("input", (event) =>
    drawAyahs(event.target.value),
  );
  const token = ++state.renderToken;
  try {
    const [quranResponse, metaResponse] = await Promise.all([
      fetch("data/quran.json"),
      fetch("data/surah-meta.json"),
    ]);
    if (token !== state.renderToken || state.view !== "reader") return;
    const all = await quranResponse.json();
    const meta = (await metaResponse.json()).data || [];
    state.surahs = Object.keys(all).map((number) => ({
      number: Number(number),
      name: meta[Number(number) - 1]?.name || `سورة ${number}`,
      ayahs: all[number],
    }));
    drawSurahs();
    drawAyahs();
    if (state.resumePosition?.surah === state.surah) restoreSavedPosition();
  } catch {
    if (token === state.renderToken)
      $("#ayahs").textContent = "تعذر فتح ملف القرآن المحلي";
  }
}
function drawSurahs(query = "") {
  const box = $("#surahs");
  if (!box) return;
  box.innerHTML = state.surahs
    .filter((item) => item.name.includes(query))
    .map(
      (item) =>
        `<button type="button" class="surah ${item.number === state.surah ? "active" : ""}" data-n="${item.number}"><i>${String(item.number).padStart(3, "٠")}</i><b>${esc(item.name)}</b><small>${item.ayahs.length} آية</small></button>`,
    )
    .join("");
  $$(".surah", box).forEach((button) =>
    button.addEventListener("click", () => {
      state.surah = Number(button.dataset.n);
      persist();
      drawSurahs($("#surah-q").value);
      drawAyahs($("#ayah-q").value);
    }),
  );
}
function drawAyahs(query = "") {
  const surah = state.surahs.find((item) => item.number === state.surah);
  if (!surah) return;
  $("#surah-title").textContent = surah.name;
  $("#surah-label").textContent = `سورة ${surah.number}`;
  const rows = surah.ayahs.filter(
    (ayah) => !query || ayah.text.includes(query),
  );
  const basmala =
    surah.number === 9
      ? ""
      : `<div class="basmala">${esc("بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ")}</div>`;
  $("#ayahs").innerHTML =
    basmala +
    (rows
      .map(
        (ayah) =>
          `<p class="ayah" data-entry-id="quran-${state.surah}-${ayah.verse}"><span>${esc(ayah.text)}</span><b>${ayah.verse}</b><span class="entry-actions"><button class="mini-copy" type="button" data-copy="${esc(ayah.text)}" aria-label="نسخ الآية">نسخ النص</button><button class="mini-position" type="button" data-save-position='${esc(JSON.stringify({ id: `quran-${state.surah}-${ayah.verse}`, type: "quran", title: `${surah.name} · الآية ${ayah.verse}`, collection: "القرآن الكريم", surah: state.surah, targetId: `quran-${state.surah}-${ayah.verse}`, verse: ayah.verse, scrollY: Math.round(window.scrollY) }))}' aria-label="حفظ موضع الآية">⌖</button></span></p>`,
      )
      .join("") || '<div class="empty">لا توجد آيات مطابقة</div>');
  $(".font-readout").textContent = `${state.font}px`;
  $$(`[data-copy]`, $("#ayahs")).forEach((button) => button.addEventListener("click", () => copyText(button.dataset.copy, "الآية").catch(() => showStatus("تعذر نسخ النص", "error"))));
  bindPositionButtons($("#ayahs"));
}
function setFont(delta) {
  state.font = Math.max(16, Math.min(40, state.font + delta));
  settings.font = state.font;
  persist();
  applyReadingStyle();
  if (state.view === "reader") drawAyahs($("#ayah-q")?.value || "");
}
function toggleBookmark(item) {
  const index = state.bookmarks.findIndex((saved) => saved.id === item.id);
  if (index >= 0) state.bookmarks.splice(index, 1);
  else state.bookmarks.unshift({ ...item, at: Date.now() });
  persist();
  return index < 0;
}
function saveReadingPosition(item) {
  state.readingPositions = [item, ...state.readingPositions.filter((saved) => saved.id !== item.id)].slice(0, 100);
  persist();
}
function bindPositionButtons(root = document) {
  $$('[data-save-position]', root).forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    const position = JSON.parse(button.dataset.savePosition);
    position.scrollY = Math.round(window.scrollY);
    saveReadingPosition(position);
    button.textContent = "✓ محفوظ";
    button.setAttribute("aria-label", "تم حفظ موضع القراءة");
  }));
}
function removeSaved(id, kind) {
  if (kind === "position") state.readingPositions = state.readingPositions.filter((item) => item.id !== id);
  else state.bookmarks = state.bookmarks.filter((item) => item.id !== id);
  persist();
}
function restoreSavedPosition() {
  const item = state.resumePosition;
  if (!item) return;
  state.resumePosition = null;
  window.setTimeout(() => {
    const target = item.targetId && document.querySelector(`[data-entry-id="${CSS.escape(item.targetId)}"]`);
    if (target) target.scrollIntoView({ block: "center", behavior: "smooth" });
    else if (Number(item.scrollY) > 0) window.scrollTo({ top: Number(item.scrollY), behavior: "smooth" });
  }, 100);
}
function openSavedItem(item, kind) {
  const shouldResume = kind === "position" || item.type !== "quran" || item.scrollY != null;
  if (item.type === "quran" || item.type === "surah") {
    state.surah = Number(item.surah) || Number(String(item.id).match(/(?:surah|quran)-([0-9]+)/)?.[1]) || 1;
    state.resumePosition = item.type === "quran" && shouldResume ? item : null;
    persist();
    navigate("reader");
    return;
  }
  const collection = collections.find((entry) => entry[0] === item.collection) ||
    collections.find((entry) => item.type === "hadith" && item.id.startsWith(`hadith-${entry[0]}-`)) ||
    (item.type === "poem" ? collections.find((entry) => entry[3] === "poetry") : null);
  if (!collection) {
    showStatus("تعذر تحديد مصدر هذا المحفوظ.", "error");
    return;
  }
  state.resumePosition = item.targetId ? item : { ...item, targetId: item.id };
  openCollection({ file: collection[2], kind: collection[3], name: collection[0] });
}
function favorites() {
  const bookmarks = state.bookmarks;
  const positions = state.readingPositions;
  shell(`<div class="page-head"><div><span class="kicker">مكتبتي</span><h1>المفضلة والمواضع</h1></div><strong class="count">${bookmarks.length + positions.length}<small> عناصر</small></strong></div><div class="advanced-hint">لكل آية وحديث وقصيدة زر موضع مستقل ⌖ بجانب النص؛ احفظ المكان الذي توقفت عنده بدقة.</div><div class="favorites-grid"><section class="settings-card"><h2>المفضلة</h2><p class="muted">النصوص والسور التي اخترت الاحتفاظ بها. اضغط على العنوان لفتحه مباشرة.</p><div class="bookmark-list">${bookmarks.map((item) => `<div class="bookmark-row"><button class="saved-link" type="button" data-open-favorite="${esc(item.id)}">★ ${esc(item.title || item.id)}</button><button type="button" data-remove-favorite="${esc(item.id)}" data-remove-kind="bookmark">حذف</button></div>`).join("") || '<p class="muted">لا توجد مفضلات بعد. استخدم زر «حفظ» داخل القارئ.</p>'}</div></section><section class="settings-card"><h2>مواضع القراءة</h2><p class="muted">كل موضع محفوظ مرتبط بعنصر محدد في القرآن أو الحديث أو الشعر.</p><div class="bookmark-list">${positions.map((item) => `<div class="bookmark-row"><button class="saved-link" type="button" data-open-position="${esc(item.id)}">⌖ ${esc(item.title || item.id)}</button><button type="button" data-remove-favorite="${esc(item.id)}" data-remove-kind="position">حذف</button></div>`).join("") || '<p class="muted">لم تحفظ موضعًا بعد. استخدم رمز ⌖ بجانب أي نص.</p>'}</div></section></div>`);
  $$('[data-open-favorite]').forEach((button) => button.addEventListener("click", () => { const item = state.bookmarks.find((saved) => saved.id === button.dataset.openFavorite); if (item) openSavedItem(item, "bookmark"); }));
  $$('[data-open-position]').forEach((button) => button.addEventListener("click", () => { const item = positions.find((saved) => saved.id === button.dataset.openPosition); if (item) openSavedItem(item, "position"); }));
  $$('[data-remove-favorite]').forEach((button) => button.addEventListener("click", () => { removeSaved(button.dataset.removeFavorite, button.dataset.removeKind); favorites(); }));
}

function catalog() {
  const query = state.q.toLowerCase();
  const filters = ["الكل", "قرآن", "حديث", "شعر"];
  const rows = collections.filter(
    (item) =>
      (state.catalogFilter === "الكل" || item[1] === state.catalogFilter) &&
      (!query || item.join(" ").toLowerCase().includes(query)),
  );
  shell(
    `<div class="page-head"><div><span class="kicker">الخزانة</span><h1>الفهرس والبحث</h1></div><strong class="count">${rows.length}<small> مجموعات</small></strong></div><div class="catalog-tools"><div class="catalog-search"><span>⌕</span><input id="catalog-q" type="search" value="${esc(state.q)}" placeholder="ابحث باسم كتاب أو موضوع"></div><div class="filters">${filters.map((filter) => `<button type="button" class="filter ${filter === state.catalogFilter ? "active" : ""}" data-filter="${filter}">${filter}</button>`).join("")}</div></div><div class="advanced-hint">افتح أي مجموعة لاستخدام البحث التفصيلي والفلتر الخاص بها.</div><div class="collection-grid">${rows.map((item) => `<button type="button" class="collection" data-file="${esc(item[2])}" data-kind="${item[3]}" data-name="${esc(item[0])}"><span>${item[1]}</span><b>${esc(item[0])}</b><small>فتح المجموعة والبحث المتقدم</small><i>↗</i></button>`).join("") || '<div class="empty">لا توجد نتائج</div>'}</div>`,
  );
  $("#catalog-q").addEventListener("input", (event) => {
    state.q = event.target.value;
    catalog();
  });
  $$("[data-filter]").forEach((button) =>
    button.addEventListener("click", () => {
      state.catalogFilter = button.dataset.filter;
      catalog();
    }),
  );
  $$(".collection").forEach((button) =>
    button.addEventListener("click", () => openCollection(button.dataset)),
  );
}
function normalizeHadithList(data) {
  return Array.isArray(data) ? data : data.hadiths || data.data || [];
}
function normalizeArabic(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ـ/g, "")
    .trim();
}
function getHadithText(item) {
  return cleanText(item.text || item.arabic || item.arabicText || item.hadith || "");
}
function getHadithNumber(item) {
  return item.hadithnumber || item.idInBook || item.id || "";
}
function arabizeSectionName(name) {
  const raw = String(name || "").trim();
  if (!raw) return "";
  const dictionary = [
    [/revelation|belief|faith/i, "الإيمان والوحي"],
    [/knowledge|learn/i, "العلم"],
    [/ablution|wudu|purification|bathing|ghusl/i, "الطهارة"],
    [/prayer|salat|mosque|friday|eids|witr|eclipse/i, "الصلاة"],
    [/charity|zakat/i, "الزكاة والصدقة"],
    [/fasting|ramadan/i, "الصيام"],
    [/hajj|pilgrimage|umrah/i, "الحج والعمرة"],
    [/marriage|divorce|suckling/i, "الأسرة والزواج"],
    [/manners|ethics|virtue|greetings|kinship/i, "الأخلاق والآداب"],
    [/supplication|remembrance|repentance|forgiveness/i, "الذكر والدعاء"],
    [/paradise|hell|judgment|tribulations/i, "الآخرة والفتن"],
    [/commerce|transactions|sales|gifts|wills|inheritance/i, "المعاملات"],
    [/funeral|death/i, "الجنائز"],
    [/jihad|government|rulings|punishments/i, "الأحكام والسير"],
  ];
  const match = dictionary.find(([pattern]) => pattern.test(raw));
  return match ? match[1] : (/^[A-Za-z]/.test(raw) ? "أبواب متنوعة" : raw);
}
function getHadithSections(data, list) {
  const chapters = Array.isArray(data.chapters) ? data.chapters : [];
  if (chapters.length) {
    return chapters
      .filter((chapter) => chapter.id != null && (chapter.arabic || chapter.name))
      .map((chapter) => ({ id: String(chapter.id), name: arabizeSectionName(chapter.arabic || chapter.name) }));
  }
  const sections = data.metadata?.sections || data.sections || {};
  const names = Object.entries(sections)
    .filter(([, name]) => name)
    .map(([id, name]) => ({ id: String(id), name: arabizeSectionName(name) }));
  if (names.length) {
    const seen = new Set();
    return names.filter((section) => {
      const key = normalizeArabic(section.name);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  return [...new Set(list.map((item) => item.chapterId ?? item.chapter ?? item.bookId).filter((value) => value != null))]
    .map((id) => ({ id: String(id), name: `القسم ${id}` }));
}
const hadithTopics = {
  "الكل": [],
  "الصلاة": ["صلاه", "الصلاه", "المسجد", "السجود", "الركوع"],
  "الصدقة والزكاة": ["صدقه", "الصدقه", "زكاه", "الزكاه", "انفق", "المال"],
  "الرزق والمعاش": ["رزق", "الرزق", "المال", "الفقر", "الغنى", "الكسب"],
  "الصيام": ["صيام", "الصيام", "صوم", "رمضان", "افطر"],
  "الدعاء والذكر": ["دعاء", "الدعاء", "ذكر", "الذكر", "استغفار", "توبه"],
  "الأخلاق والبر": ["بر", "البر", "خلق", "الصدق", "الرحمه", "صلة"],
  "العلم والهداية": ["علم", "العلم", "تعلم", "هدي", "الايمان", "الاسلام"],
};
function getHadithQuality(item, sourceName) {
  const raw = normalizeArabic([item.grade, item.grades, item.hukm, item.authenticity, item.status]
    .flat(Infinity)
    .map((value) => typeof value === "object" ? JSON.stringify(value) : value)
    .filter(Boolean)
    .join(" "));
  if (/ضعيف|موضوع|منكر|متروك/.test(raw)) return "ضعيف";
  if (/صحيح|حسن|قوي/.test(raw) || /صحيح البخاري|صحيح مسلم/.test(sourceName)) return "قوي / صحيح";
  return "غير محدد";
}
function getHadithSectionId(item) {
  return String(
    item.chapterId ?? item.chapter ?? item.bookId ?? item.book?.id ?? item.reference?.book ?? "",
  );
}

async function openCollection(collection) {
  const parentView = state.view;
  if (collection.kind === "quran") {
    navigate("reader");
    return;
  }
  state.routeHistory.push(parentView);
  state.view = collection.kind === "poetry" ? "poetry" : "hadith";
  state.renderToken += 1;
  const token = state.renderToken;
  if (collection.kind === "poetry") {
    state.poetryIndex = null;
    state.poetryParts = [];
    state.poetryLoaded = 0;
    state.poetryLoading = true;
    state.poetryAllLoading = false;
    state.poetryLoadError = "";
    state.poetryPoets = [];
    state.poetryPartPromise = null;
    state.poetrySupplementalLoaded = false;
    state.poetryPoet = "الكل";
    state.poetryPoetSearch = "";
    state.poetryCategory = "الكل";
    state.poetryLimit = 60;
    state.poetryShowAll = false;
    state.poetryAllLoading = false;
    renderPoetryLoading(collection.name);
    try {
      const index = await fetchJson(collection.file);
      if (token !== state.renderToken || state.view !== "poetry") return;
      state.poetryIndex = index;
      const poetIndex = await fetchJson("./data/poetry/poets.json");
      const allPoets = Array.isArray(poetIndex?.poets) ? poetIndex.poets : [];
      state.poetryPoets = allPoets;
      state.poetryLoading = false;
      await loadPoetryPart();
      await loadPoetrySupplemental();
      if (state.resumePosition?.type === "poem" && state.resumePosition.targetId) {
        await ensureAllPoetryLoaded();
      }
      if (token !== state.renderToken || state.view !== "poetry") return;
      state.poetryReady = true;
      renderPoetryControls();
      if (state.resumePosition?.type === "poem") restoreSavedPosition();
    } catch (error) {
      if (token === state.renderToken) {
        state.poetryLoading = false;
        state.poetryReady = false;
        showStatus("تعذر تحميل فهرس الشعر.", "error");
        renderPoetryLoading(collection.name, "تعذر تحميل فهرس الشعر");
      }
    }
    return;
  }
  state.hadithData = { list: [], index: [], name: collection.name, query: "", section: "all", quality: "all", topic: "الكل", length: "all", limit: 60, sections: [], loading: true, focusId: state.resumePosition?.type === "hadith" ? (state.resumePosition.targetId || state.resumePosition.id) : "" };
  state.hadithLoading = true;
  renderHadith();
  try {
    const data = await fetchJson(collection.file);
    const list = normalizeHadithList(data);
    if (token !== state.renderToken || state.view !== "hadith") return;
    state.hadithData.list = list;
    state.hadithData.index = list.map((item) => {
      const text = getHadithText(item);
      const number = String(getHadithNumber(item));
      const section = getHadithSectionId(item);
      const searchable = normalizeArabic([text, number, JSON.stringify(item)].join(" "));
      return { item, text, number, section, quality: getHadithQuality(item, collection.name), searchable };
    });
    state.hadithData.sections = getHadithSections(data, list);
    state.hadithData.loading = false;
    state.hadithLoading = false;
    renderHadith();
    if (state.resumePosition?.type === "hadith") restoreSavedPosition();
  } catch {
    if (token === state.renderToken) {
      state.hadithLoading = false;
      showStatus("تعذر تحميل هذه المجموعة. تحقق من الاتصال ثم أعد المحاولة.", "error");
      renderHadithError();
    }
  }
}
function renderHadithError() {
  const list = $("#hadith-list");
  if (list) list.innerHTML = '<div class="empty">تعذر تحميل المجموعة. يمكنك العودة والمحاولة مرة أخرى.</div>';
  $("#hadith-status")?.replaceChildren();
  $("#hadith-more")?.toggleAttribute("hidden", true);
}
function renderPoetryLoading(name, message = "جاري فتح موسوعة الشعر…") {
  shell(`<div class="book-overview"><div><span class="kicker">شعر</span><h2>${esc(name || "موسوعة الشعر العربي")}</h2><p>${esc(message)}</p></div><div class="book-seal">شعر</div></div><div id="poem-status" class="loading-more">${esc(message)}</div>`);
}
function renderPoetryControls() {
  const index = state.poetryIndex;
  const categories = ["الكل", ...new Set(state.poetryPoets.flatMap((poet) => poet.categories || []))];
  shell(`<div class="book-overview"><div><span class="kicker">شعر</span><h2>${esc(index.title || "موسوعة الشعر العربي")}</h2><p>${Number(index.count).toLocaleString("ar-EG")} قصيدة · ${Number(index.poetCount || 0).toLocaleString("ar-EG")} شاعرًا · تحميل تدريجي كامل</p></div><div class="book-seal">شعر</div></div><div class="reading-toolbar"><input id="poetry-poet-search" type="search" placeholder="ابحث عن اسم الشاعر…" aria-label="البحث عن شاعر"><select id="poetry-category" aria-label="فلتر تصنيف الشعراء">${categories.map((category) => `<option value="${esc(category)}">${esc(category === "الكل" ? "كل التصنيفات" : category)}</option>`).join("")}</select><select id="poetry-poet" aria-label="اختر ديوان الشاعر"><option value="الكل">كل الشعراء</option>${state.poetryPoets.map((poet) => `<option value="${esc(poet.name)}">${esc(poet.name)} · ${Number(poet.count).toLocaleString("ar-EG")} قصيدة</option>`).join("")}</select><input id="poetry-q" type="search" placeholder="بحث في ديوان الشاعر أو كامل الموسوعة"><select id="poetry-era"><option>الكل</option></select><button id="poetry-all" class="toggle-all" type="button" aria-pressed="false">إظهار الكل</button><span id="poem-count"></span></div><div id="poet-search-results" class="poet-search-results" aria-live="polite"></div><div class="advanced-hint">فلتر الشعراء حسب العصر أو المدرسة، ثم اكتب الاسم واضغط على النتيجة لفتح ديوانه.</div><div id="poems"></div><button id="load-more" class="load-more" type="button" hidden>تحميل المزيد</button><div id="poem-status" class="loading-more"></div>`);
  const poetSearch = $("#poetry-poet-search");
  const categorySelect = $("#poetry-category");
  const poetSelect = $("#poetry-poet");
  const poetResults = $("#poet-search-results");
  const selectPoet = (name) => {
    state.poetryPoet = name;
    state.poetryQuery = "";
    state.poetryLimit = 60;
    state.poetryShowAll = false;
    poetSelect.value = name;
    drawPoems();
    if (state.poetryLoaded < state.poetryIndex.parts) {
      ensureAllPoetryLoaded().then(drawPoems).catch(drawPoems);
    }
  };
  const updatePoetOptions = () => {
    const query = normalizeArabic(state.poetryPoetSearch);
    const current = state.poetryPoet;
    const matches = state.poetryPoets.filter((poet) =>
      (state.poetryCategory === "الكل" || (poet.categories || []).includes(state.poetryCategory)) &&
      (!query || normalizeArabic(poet.name).includes(query)),
    );
    poetSelect.innerHTML = '<option value="الكل">كل الشعراء</option>' + matches.map((poet) => `<option value="${esc(poet.name)}">${esc(poet.name)} · ${Number(poet.count).toLocaleString("ar-EG")} قصيدة</option>`).join("");
    poetSelect.value = matches.some((poet) => poet.name === current) ? current : "الكل";
    if (current !== "الكل" && poetSelect.value === "الكل") state.poetryPoet = "الكل";
    if (!query) {
      poetResults.innerHTML = "";
      return;
    }
    poetResults.innerHTML = matches.length
      ? `<span>نتائج الشعراء:</span>${matches.slice(0, 24).map((poet) => `<button type="button" data-poet-result="${esc(poet.name)}">${esc(poet.name)} <small>(${Number(poet.count).toLocaleString("ar-EG")})</small></button>`).join("")}${matches.length > 24 ? `<em>أظهر أول 24 من ${matches.length.toLocaleString("ar-EG")} نتيجة</em>` : ""}`
      : "<span>لا يوجد شاعر بهذا الاسم.</span>";
    $$('[data-poet-result]', poetResults).forEach((button) => button.addEventListener("click", () => {
      poetSearch.value = button.dataset.poetResult;
      state.poetryPoetSearch = poetSearch.value;
      selectPoet(button.dataset.poetResult);
      updatePoetOptions();
    }));
  };
  poetSearch.value = state.poetryPoetSearch;
  categorySelect.value = state.poetryCategory;
  categorySelect.addEventListener("change", (event) => {
    state.poetryCategory = event.target.value;
    state.poetryPoet = "الكل";
    updatePoetOptions();
    drawPoems();
  });
  poetSearch.addEventListener("input", (event) => {
    state.poetryPoetSearch = event.target.value;
    updatePoetOptions();
  });
  poetSelect.value = state.poetryPoet;
  poetSelect.addEventListener("change", async (event) => {
    const poetSearchToken = ++state.poetrySearchToken;
    state.poetryPoet = event.target.value;
    state.poetryQuery = "";
    state.poetryLimit = 60;
    state.poetryShowAll = false;
    drawPoems();
    if (state.poetryLoaded < state.poetryIndex.parts) {
      ensureAllPoetryLoaded().then(() => {
        if (poetSearchToken === state.poetrySearchToken) drawPoems();
      }).catch(() => drawPoems());
    }
  });
  $("#poetry-q").addEventListener("focus", focusWithinViewport);
  $("#poetry-q").addEventListener("input", async (event) => {
    state.poetryQuery = event.target.value;
    state.poetryLimit = 60;
    const searchToken = ++state.poetrySearchToken;
    const needsFullSearch = state.poetryQuery.trim() && state.poetryLoaded < state.poetryIndex.parts;
    if (needsFullSearch) {
      ensureAllPoetryLoaded().then(() => {
        if (searchToken === state.poetrySearchToken) drawPoems();
      }).catch(() => {
        if (searchToken === state.poetrySearchToken) drawPoems();
      });
    }
    drawPoems();
  });
  $("#poetry-era").addEventListener("change", (event) => { state.poetryEra = event.target.value; state.poetryLimit = 60; drawPoems(); });
  $("#poetry-all").addEventListener("click", async () => {
    state.poetryShowAll = !state.poetryShowAll;
    const searchToken = ++state.poetrySearchToken;
    if (state.poetryShowAll && state.poetryLoaded < state.poetryIndex.parts) {
      $("#poems").innerHTML = '<div class="loading-more">جاري تحميل كامل موسوعة الشعر لإظهار كل النصوص…</div>';
      $("#poem-count").textContent = "يتم تحميل جميع القصائد…";
      try {
        await ensureAllPoetryLoaded();
      } catch {
        showStatus("تعذر تحميل بقية القصائد. يمكنك متابعة قراءة الأجزاء المتاحة.", "error");
      }
    }
    if (searchToken === state.poetrySearchToken) drawPoems();
  });
  $("#load-more").addEventListener("click", async () => { state.poetryLimit += 60; await loadPoetryPart(); fillEras(); drawPoems(); });
  fillEras();
  drawPoems();
}

function renderHadith() {
  const info = state.hadithData;
  shell(
    `<div class="book-overview"><div><span class="kicker">حديث</span><h2>${esc(info.name)}</h2><p>${info.list.length.toLocaleString("ar-EG")} نص · بحث وفلاتر متقدمة</p></div><div class="book-seal">حديث</div></div><div class="reading-toolbar"><input id="hadith-q" type="search" placeholder="بحث في النص أو الرقم"><select id="hadith-section"><option value="all">كل الأقسام</option>${info.sections.map((section) => `<option value="${esc(section.id)}">${esc(section.name)}</option>`).join("")}</select><select id="hadith-quality"><option value="all">كل الدرجات</option><option value="قوي / صحيح">قوي / صحيح</option><option value="ضعيف">ضعيف</option><option value="غير محدد">غير محدد</option></select><select id="hadith-topic">${Object.keys(hadithTopics).map((topic) => `<option value="${esc(topic)}">${esc(topic === "الكل" ? "كل الموضوعات" : topic)}</option>`).join("")}</select><select id="hadith-len"><option value="all">كل الأطوال</option><option value="short">مختصر</option><option value="long">مطول</option></select><button id="hadith-all" class="toggle-all" type="button" aria-pressed="false">إظهار الكل</button><span id="hadith-count"></span></div><div id="hadith-list">${info.loading ? '<div class="loading-more">جاري تحميل الكتاب…</div>' : ''}</div><button id="hadith-more" class="load-more" type="button" ${info.loading ? 'hidden' : ''}>عرض المزيد</button><div id="hadith-status" class="loading-more">${info.loading ? 'يتم تجهيز البحث…' : ''}</div>`,
  );
  $("#hadith-q").addEventListener("input", (event) => {
    info.query = event.target.value.trim().toLowerCase();
    info.limit = 60;
    drawHadith();
  });
  $("#hadith-section").addEventListener("change", (event) => {
    info.section = event.target.value;
    info.limit = 60;
    drawHadith();
  });
  $("#hadith-len").addEventListener("change", (event) => {
    info.length = event.target.value;
    info.limit = 60;
    drawHadith();
  });
  $("#hadith-quality").addEventListener("change", (event) => { info.quality = event.target.value; info.limit = 60; drawHadith(); });
  $("#hadith-topic").addEventListener("change", (event) => { info.topic = event.target.value; info.limit = 60; drawHadith(); });
  $("#hadith-all").addEventListener("click", () => { info.showAll = !info.showAll; drawHadith(); });
  $("#hadith-more").addEventListener("click", () => { info.limit += 60; drawHadith(); });
  drawHadith();
}
function drawHadith() {
  const info = state.hadithData;
  if (!info || !(info.index || info.list) || !$("#hadith-list") || info.loading) return;
  const topicTerms = (hadithTopics[info.topic] || []).map(normalizeArabic);
  const matches = info.index.filter((entry) => entry.text && (!info.query || entry.searchable.includes(normalizeArabic(info.query))) && (info.section === "all" || entry.section === info.section) && (info.quality === "all" || entry.quality === info.quality) && (!topicTerms.length || topicTerms.some((term) => entry.searchable.includes(term))) && (info.length === "all" || (info.length === "short" ? entry.text.length < 350 : entry.text.length >= 350)));
  const focused = info.focusId
    ? matches.filter((entry) => `hadith-${info.name}-${entry.number}` === info.focusId)
    : [];
  const visible = focused.length ? focused : (info.showAll ? matches : matches.slice(0, info.limit));
  const allButton = $("#hadith-all");
  if (allButton) { allButton.textContent = info.showAll ? "إظهار المختصر" : "إظهار الكل"; allButton.setAttribute("aria-pressed", String(info.showAll)); }
  $("#hadith-list").innerHTML = visible.map(({ item, text, number }) => {
    const id = `hadith-${info.name}-${number}`;
    const position = { id: `hadith-position-${info.name}-${number}`, type: "hadith", title: `${info.name} · حديث ${number}`, collection: info.name, targetId: id, scrollY: Math.round(window.scrollY) };
    return `<article class="hadith" data-entry-id="${esc(id)}"><div class="hadith-meta"><b>حديث ${esc(number)}</b><span>${esc(info.name)}</span><span class="entry-actions"><button type="button" class="mini-save" data-save="${esc(id)}" data-title="${esc(text.slice(0, 80))}">${state.bookmarks.some((saved) => saved.id === id) ? "★" : "☆"}</button><button type="button" class="mini-copy" data-copy="${esc(text)}" aria-label="نسخ الحديث">نسخ النص</button><button type="button" class="mini-position" data-save-position='${esc(JSON.stringify(position))}' aria-label="حفظ موضع الحديث">⌖</button></span></div><p>${esc(text)}</p></article>`;
  }).join("") || '<div class="empty">لا توجد نتائج مطابقة</div>';
  $("#hadith-count").textContent = `${matches.length.toLocaleString("ar-EG")} حديث`;
  $("#hadith-status").textContent = matches.length > visible.length ? `عرض ${visible.length.toLocaleString("ar-EG")} من ${matches.length.toLocaleString("ar-EG")} حديث` : "اكتملت النتائج";
  $("#hadith-more").hidden = matches.length <= visible.length;
  $$('[data-save]').forEach((button) => button.addEventListener("click", () => { toggleBookmark({ id: button.dataset.save, type: "hadith", title: button.dataset.title, collection: info.name, targetId: button.dataset.save, scrollY: Math.round(window.scrollY) }); drawHadith(); }));
  $$(`[data-copy]`, $("#hadith-list")).forEach((button) => button.addEventListener("click", () => copyText(button.dataset.copy, "الحديث").catch(() => showStatus("تعذر نسخ النص", "error"))));
  bindPositionButtons($("#hadith-list"));
}

async function openPoetry(collection) {
  if (state.poetryIndex) renderPoetryControls();
}

async function ensureAllPoetryLoaded() {
  if (!state.poetryIndex) return;
  if (state.poetryLoadPromise) return state.poetryLoadPromise;
  state.poetryAllLoading = true;
  state.poetryLoadPromise = (async () => {
    updatePoetryStatus("جاري تجهيز البحث في كامل موسوعة الشعر…");
    try {
      while (state.poetryLoaded < state.poetryIndex.parts) await loadPoetryPart();
      fillEras();
    } catch (error) {
      state.poetryLoadError = error?.message || "تعذر تحميل جزء من الموسوعة";
      throw error;
    } finally {
      state.poetryAllLoading = false;
      state.poetryLoadPromise = null;
      updatePoetryStatus();
    }
  })();
  return state.poetryLoadPromise;
}

async function loadPoetryPart() {
  if (!state.poetryIndex || state.poetryLoaded >= state.poetryIndex.parts) return;
  if (state.poetryPartPromise) return state.poetryPartPromise;
  state.poetryLoading = true;
  state.poetryPartPromise = (async () => {
    try {
      const pattern = state.poetryIndex.partPattern || "data/poetry/part-{index}.json";
      const partUrl = pattern.replace("{index}", String(state.poetryLoaded).padStart(3, "0"));
      const part = await fetchJson(partUrl);
      const rows = Array.isArray(part) ? part : (Array.isArray(part?.data) ? part.data : []);
      if (!rows.length) throw new Error(`الجزء ${state.poetryLoaded + 1} فارغ`);
      state.poetryParts.push(...rows);
      state.poetryLoaded += 1;
      state.poetryLoadError = "";
    } finally {
      state.poetryLoading = false;
      state.poetryPartPromise = null;
      updatePoetryStatus();
    }
  })();
  return state.poetryPartPromise;
}
async function loadPoetrySupplemental() {
  if (state.poetrySupplementalLoaded || !state.poetryIndex?.supplementalFile) return;
  const data = await fetchJson(state.poetryIndex.supplementalFile);
  const rows = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
  state.poetryParts.push(...rows);
  state.poetrySupplementalLoaded = true;
}
function fillEras() {
  const select = $("#poetry-era");
  if (!select) return;
  const eras = [
    ...new Set(state.poetryParts.map((item) => item.poet_era).filter(Boolean)),
  ];
  select.innerHTML =
    '<option value="الكل">الكل</option>' +
    eras
      .map((era) => `<option value="${esc(era)}">${esc(era)}</option>`)
      .join("");
  select.value = state.poetryEra;
}
function updatePoetryStatus(message = "") {
  const element = $("#poem-status");
  const complete = state.poetryLoaded >= (state.poetryIndex?.parts || 0);
  if (element) {
    const total = Number(state.poetryIndex?.count || 0);
    const loaded = state.poetryParts.length;
    element.textContent = message || (state.poetryLoadError
      ? `تعذر تحميل بقية الموسوعة بعد ${loaded.toLocaleString("ar-EG")} قصيدة — يمكنك متابعة الأجزاء المتاحة أو إعادة المحاولة`
      : complete
      ? `اكتمل تحميل الديوان: ${total.toLocaleString("ar-EG")} قصيدة`
      : `المحمّل الآن: ${loaded.toLocaleString("ar-EG")} من ${total.toLocaleString("ar-EG")} قصيدة — اضغط «إظهار الكل» للبحث في الموسوعة كاملة`);
  }
  $("#load-more")?.toggleAttribute("hidden", complete);
}
function drawPoems() {
  if (!state.poetryReady) {
    $("#poems").innerHTML =
      '<div class="loading-more">جاري تحميل القصائد…</div>';
    return;
  }
  const query = normalizeArabic(state.poetryQuery);
  const poetMeta = new Map(state.poetryPoets.map((poet) => [poet.name, poet]));
  const rows = state.poetryParts.filter(
    (item) =>
      (state.poetryPoet === "الكل" || normalizeArabic(item.poet_name) === normalizeArabic(state.poetryPoet)) &&
      (state.poetryCategory === "الكل" || (poetMeta.get(item.poet_name)?.categories || []).includes(state.poetryCategory)) &&
      (state.poetryEra === "الكل" || item.poet_era === state.poetryEra) &&
      (!query ||
        normalizeArabic(`${item.poet_name || ""} ${item.poem_title || ""} ${cleanText(item.poem_text || "")} ${item.poem_tags || ""}`)
          .includes(query)),
  );
  const focused = state.resumePosition?.targetId
    ? rows.filter((item) => `poem-${item.poem_title}-${item.poet_name}` === state.resumePosition.targetId)
    : [];
  const visible = focused.length ? focused : (state.poetryShowAll ? rows : rows.slice(0, state.poetryLimit));
  const allButton = $("#poetry-all");
  const complete = state.poetryLoaded >= (state.poetryIndex?.parts || 0);
  if (allButton) {
    allButton.textContent = state.poetryShowAll ? "إظهار المختصر" : (complete ? "إظهار الكل" : "إظهار الكل وتحميل الموسوعة");
    allButton.setAttribute("aria-pressed", String(state.poetryShowAll));
  }
  $("#poems").innerHTML =
    visible
      .map((item) => {
        const id = `poem-${item.poem_title}-${item.poet_name}`;
        const position = { id: `poem-position-${item.poem_title}-${item.poet_name}`, type: "poem", title: `${item.poem_title || "قصيدة"} · ${item.poet_name || "شاعر"}`, collection: "موسوعة الشعر العربي", targetId: id, scrollY: Math.round(window.scrollY) };
        const poemText = cleanText(item.poem_text || "");
        return `<article class="poem" data-entry-id="${esc(id)}"><header><b>${esc(item.poem_title || "قصيدة")}</b><span>${esc(item.poet_name || "شاعر")} · ${esc(item.poet_era || "")} <span class="entry-actions"><button type="button" class="mini-save" data-save="${esc(id)}" data-title="${esc(item.poem_title || "قصيدة")}">${state.bookmarks.some((saved) => saved.id === id) ? "★" : "☆"}</button><button type="button" class="mini-copy" data-copy="${esc(poemText)}" aria-label="نسخ القصيدة">نسخ النص</button><button type="button" class="mini-position" data-save-position='${esc(JSON.stringify(position))}' aria-label="حفظ موضع القصيدة">⌖</button></span></span></header><p>${renderPoemText(poemText)}</p></article>`;
      })
      .join("") || '<div class="empty">لا توجد نتائج في الأجزاء المحملة</div>';
  const total = Number(state.poetryIndex?.count || 0);
  const poetTotal = state.poetryPoet === "الكل" ? total : Number(state.poetryPoets.find((poet) => poet.name === state.poetryPoet)?.count || rows.length);
  const scope = complete ? poetTotal : state.poetryParts.length;
  $("#poem-count").textContent = complete
    ? `${rows.length.toLocaleString("ar-EG")} قصيدة في ${state.poetryPoet === "الكل" ? "الموسوعة" : `ديوان ${state.poetryPoet}`} من أصل ${scope.toLocaleString("ar-EG")} قصيدة`
    : `${rows.length.toLocaleString("ar-EG")} نتيجة في الجزء المحمّل (${scope.toLocaleString("ar-EG")} قصيدة)`;
  updatePoetryStatus();
  $$("[data-save]").forEach((button) =>
    button.addEventListener("click", () => {
      toggleBookmark({
        id: button.dataset.save,
        type: "poem",
        title: button.dataset.title,
        collection: "موسوعة الشعر العربي",
        targetId: button.dataset.save,
        scrollY: Math.round(window.scrollY),
      });
      drawPoems();
    }),
  );
  bindPositionButtons($("#poems"));
  bindLexicalWords($("#poems"));
  $$(`[data-copy]`, $("#poems")).forEach((button) => button.addEventListener("click", () => copyText(button.dataset.copy, "القصيدة").catch(() => showStatus("تعذر نسخ النص", "error"))));
}

function sourcesView() {
  shell(`<div class="page-head"><div><span class="kicker">شفافية وإسناد</span><h1>التراخيص والمصادر</h1><p class="muted">كود التطبيق مرخص MIT، أما البيانات الخارجية فتحتفظ برخص مصادرها.</p></div><strong class="count">74,011<small> إدخالًا شعريًا · 750 شاعرًا</small></strong></div><div class="settings-grid"><article class="settings-card"><h2>كود التطبيق</h2><p>كود الديوان الشامل مرخص وفق <b>MIT License</b>. يجب إبقاء إشعار حقوق النشر ونص الرخصة الموجودين في المستودع.</p><p><a href="https://github.com/Abdullah-Qatan-AQ/Diwan-Shamil/blob/main/LICENSE" target="_blank" rel="noopener">قراءة رخصة الكود</a></p></article><article class="settings-card"><h2>بيانات الحديث</h2><p>المجموعات الاثنتا عشرة العربية مأخوذة من QuranLab/Open-Hadith-Data. قاعدة البيانات تحت <b>ODbL 1.0</b> ومحتوى قاعدة البيانات تحت <b>DbCL 1.0</b> وفق بطاقة المصدر.</p><p>يجب إبقاء الإسناد وروابط الرخصة، وقد تنطبق شروط Share-Alike على قاعدة البيانات المشتقة. هذه الرخصة لا تعيد ترخيص كود التطبيق.</p><p><a href="https://huggingface.co/datasets/quranlab/hadith" target="_blank" rel="noopener">مصدر QuranLab</a> · <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener">ODbL</a> · <a href="https://opendatacommons.org/licenses/dbcl/1-0/" target="_blank" rel="noopener">DbCL</a></p></article><article class="settings-card"><h2>الشعر العربي — ODbL</h2><p>موسوعة الشعر العربي الحالية من Kaggle / mdanok، مع تطبيق شروط <b>ODbL 1.0</b> على قاعدة البيانات. لا تفترض هذه الرخصة أن كل نص شعري ملك عام.</p><p><a href="https://github.com/Abdullah-Qatan-AQ/Diwan-Shamil/blob/main/data/POETRY-LICENSE" target="_blank" rel="noopener">ترخيص المصدر الحالي</a> · <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener">نص ODbL</a></p></article><article class="settings-card"><h2>موسوعة الشعر العربي</h2><p>تضم الموسوعة <b>74,008 قصائد من 748 شاعرًا</b> من المصدر الأساسي بعد استبعاد 1,014 سجلًا بلا نص أو عنوان، موزعة على 76 جزءًا للتحميل التدريجي، ومعها 3 قصائد موثقة إضافية لشوقي وإيليا؛ أي 74,011 إدخالًا و750 شاعرًا. لا يدّعي هذا الرقم اكتمال الأعمال الكاملة لأي شاعر.</p><p>المجموعة الأساسية منسوبة إلى <b>Arabic Poetry Dataset</b> (الناشر: mdanok)، وتذكر بطاقة المصدر أنها جُمعت من موقع الديوان. يحتفظ التطبيق بإسناد المصدر وروابط الرخص، ولا يقدّم ضمانًا بأن كل نص شعري ملك عام أو قابل لإعادة الاستخدام في كل دولة.</p><p><b>الرخصة:</b> قاعدة البيانات موزعة وفق <b>ODbL 1.0</b> مع إبقاء النسبة ورابط المصدر وإشعار الرخصة عند إعادة التوزيع. هذه الرخصة تخص قاعدة البيانات، ولا تُنشئ تلقائيًا ترخيصًا جديدًا للنصوص الشعرية المفردة؛ لذلك لا يقدّم التطبيق ادعاءً بأن كل قصيدة ملك عام أو أن كل نص قابل لإعادة الاستخدام في كل بلد.</p><p><a href="https://www.kaggle.com/datasets/mdanok/arabic-poetry-dataset" target="_blank" rel="noopener">صفحة مجموعة البيانات</a> · <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener">نص ODbL 1.0</a> · <a href="https://github.com/Abdullah-Qatan-AQ/Diwan-Shamil/blob/main/data/POETRY-LICENSE" target="_blank" rel="noopener">بيان الترخيص المحلي</a></p><p class="muted">للاستخدام التجاري أو إعادة النشر خارج التطبيق، راجع حالة حقوق النصوص في بلدك واحفظ إشعارات المصدر المطلوبة.</p></article><article class="settings-card"><h2>إيليا أبو ماضي — مصدر إضافي</h2><p>تظهر قصيدتان موثقتان لإيليا أبي ماضي داخل الموسوعة الموحدة من صفحات ويكي مصدر، مع إبقاء النسبة وروابط المصدر. صفحات المصدر تعرض النصوص وتتضمن ملاحظات عن وضع الحقوق بحسب قانون المصدر، بينما تنشر ويكي مصدر محتواها وفق CC BY-SA 4.0. يجب التحقق من الحقوق في الدولة والاستخدام المقصود قبل إعادة التوزيع.</p><p><a href="https://ar.wikisource.org/wiki/جئت_لا_أعلم_من_أين_ولكني_أتيت" target="_blank" rel="noopener">جئت لا أعلم من أين</a> · <a href="https://ar.wikisource.org/wiki/أيلول_الشاعر" target="_blank" rel="noopener">أيلول الشاعر</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a></p></article><article class="settings-card"><h2>أحمد شوقي — مصدر إضافي</h2><p>تظهر قصيدة «قم للمعلم» داخل الموسوعة الموحدة من مصدر مستقل من ويكي مصدر. تذكر صفحة المؤلف أن أعمال أحمد شوقي (1868–1932) آلت إلى الملك العام في مصر. يحتفظ التطبيق بنسبة المؤلف ورابط النص، ولا يخلط هذا المصدر بقاعدة ODbL.</p><p><a href="https://ar.wikisource.org/wiki/%D9%82%D9%85_%D9%84%D9%84%D9%85%D8%B9%D9%84%D9%85" target="_blank" rel="noopener">النص في ويكي مصدر</a> · <a href="https://github.com/Abdullah-Qatan-AQ/Diwan-Shamil/blob/main/data/poetry/POETRY-LICENSE-SHAWQI" target="_blank" rel="noopener">بيان الترخيص المحلي</a></p><p class="muted">قد تختلف حالة الملكية العامة بحسب الدولة. راجع سياسة المصدر قبل إعادة التوزيع.</p></article><article class="settings-card"><h2>شرح الكلمات دون اتصال</h2><p>عند النقر على كلمة في القصيدة، يبحث التطبيق أولًا في ملفات المعجم JSON المضمّنة داخل المستودع. لا يعتمد هذا الجزء على طلبات خارجية، وتظل النتيجة متاحة بعد تنزيل المكتبة للعمل دون إنترنت.</p><p>الفهرس يجمع Arabic WordNet وفق <b>CC BY 4.0</b> وKaikki/Wiktionary العربية وفق <b>CC BY-SA 4.0</b>، مع حفظ مصدر كل تعريف داخل JSON. قد لا يتوفر تعريف لكل كلمة؛ عندها يوضح التطبيق أن المدخل غير موجود بدل فتح خدمة خارجية. يضم <code>original-glosses.json</code> الآن 1867 معنى عربيًا أصليًا صاغها عبدالله قطان لهذا المشروع بترخيص MIT؛ لا يدّعي أنه ترجمة وحيدة أو بديل عن المعجم المتخصص، وقد يختلف المعنى بحسب السياق. <b>تنبيه:</b> قد لا تكون ترجمة أو معنى أي كلمة صحيحًا أو كاملًا في جميع السياقات، ولا سيما الملاحظات الأولية غير الجازمة؛ راجع سياق النص والمعاجم المتخصصة قبل الاعتماد عليها.</p><p><a href="https://github.com/Salah-Sal/arabic-wordnet-v4" target="_blank" rel="noopener">Arabic WordNet</a> · <a href="https://kaikki.org/dictionary/Arabic/index.html" target="_blank" rel="noopener">Kaikki/Wiktionary</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.ar" target="_blank" rel="noopener">CC BY-SA 4.0</a> · <a href="https://github.com/Abdullah-Qatan-AQ/Diwan-Shamil/tree/main/data/lexicon" target="_blank" rel="noopener">الفهرس المحلي</a> · <a href="https://github.com/Abdullah-Qatan-AQ/Diwan-Shamil/blob/main/data/lexicon/ORIGINAL-GLOSSES-LICENSE.md" target="_blank" rel="noopener">إشعار الترخيص</a></p></article><article class="settings-card"><h2>مصادر القرآن</h2><p>للقرآن ومصادره المستقلة ملفات توثيق منفصلة داخل المستودع. لا تعني رخصة MIT للكود أن هذه البيانات أصبحت MIT.</p><p><a href="https://github.com/Abdullah-Qatan-AQ/Diwan-Shamil/tree/main/data" target="_blank" rel="noopener">ملفات المصادر والتراخيص</a></p></article><article class="settings-card"><h2>تنبيه مهم</h2><p>تغيير صيغة البيانات إلى JavaScript أو SQLite أو APK لا يجعل النصوص ملكًا للمشروع ولا يزيل شروط المصدر. لا يثبت التطبيق صحة الأحاديث ولا يقدم فتوى.</p><p class="muted">هذا توثيق عملي وليس استشارة قانونية.</p></article></div>`);
}
function settingsMarkup() {
  return `<div class="settings-backdrop" id="settings-modal" role="presentation"><section class="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title"><button class="modal-close" id="settings-close" type="button" aria-label="إغلاق">×</button><div class="page-head"><div><span class="kicker">تخصيص</span><h1 id="settings-title">الإعدادات</h1></div></div><section class="settings-grid"><article class="settings-card"><h2>المظهر والقراءة</h2><label>الثيم</label><div class="theme-choices"><button type="button" data-theme="sand">رملي</button><button type="button" data-theme="night">ليلي</button><button type="button" data-theme="green">أخضر</button><button type="button" data-theme="paper">ورقي</button></div><label>حجم الخط <b id="settings-font">${state.font}px</b></label><input id="settings-font-range" type="range" min="16" max="40" value="${state.font}"><label class="check"><input id="remember" type="checkbox" ${settings.remember ? "checked" : ""}> تذكر آخر سورة</label></article><article class="settings-card"><h2>المحفوظات والنسخ الاحتياطي</h2><p>لديك <b>${state.bookmarks.length}</b> مفضلة و<b>${state.readingPositions.length}</b> موضع قراءة.</p><button id="export-data" type="button">تصدير نسخة احتياطية</button><button id="import-data" type="button">استيراد نسخة احتياطية</button><input id="import-file" type="file" accept="application/json" hidden><div class="bookmark-list">${state.bookmarks.slice(0, 12).map((item) => `<div class="bookmark-row"><span>${esc(item.title || item.id)}</span><button type="button" data-remove="${esc(item.id)}">حذف</button></div>`).join("") || '<p class="muted">لا توجد مفضلات بعد.</p>'}</div></article><article class="settings-card"><h2>القراءة دون إنترنت</h2><p>بيانات القرآن والحديث والشعر مضمّنة في نسخة التطبيق ويمكن تنزيلها كاملة.</p><button id="download-library" type="button">تنزيل المكتبة الأساسية</button><button id="clear-cache" type="button">مسح التنزيلات</button><button id="open-sources" type="button">التراخيص والمصادر</button></article><article class="settings-card"><h2>أحدث نسخة للتطبيق</h2><p>افتح صفحة الإصدارات لاختيار ملف التطبيق المناسب لجهازك.</p><button id="latest-release" type="button">تنزيل أحدث نسخة للتطبيق</button></article><article class="settings-card danger-card"><h2>إعادة ضبط التطبيق</h2><p>يمسح المفضلة والمواضع والثيم والإعدادات المحلية، ثم يعيد فتح التطبيق من البداية.</p><button id="reset-app" type="button">إعادة تعيين كل التطبيق</button></article></section><p class="modal-credit">من صنع Abdullah Qatan · مرخص برخصة MIT</p></section></div>`;
}
function openSettingsModal() {
  if (state.settingsModalOpen) return;
  state.settingsModalOpen = true;
  document.body.insertAdjacentHTML("beforeend", settingsMarkup());
  const modal = $("#settings-modal");
  const close = () => { state.settingsModalOpen = false; modal?.remove(); };
  $("#settings-close").addEventListener("click", close);
  modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
  $$('[data-theme]', modal).forEach((button) => button.addEventListener("click", () => { setTheme(button.dataset.theme); close(); openSettingsModal(); }));
  $("#settings-font-range").addEventListener("input", (event) => { state.font = Number(event.target.value); settings.font = state.font; persist(); applyReadingStyle(); $("#settings-font").textContent = `${state.font}px`; });
  $("#remember").addEventListener("change", (event) => { settings.remember = event.target.checked; persist(); });
  $("#export-data").addEventListener("click", exportData);
  $("#import-data").addEventListener("click", () => $("#import-file").click());
  $("#import-file").addEventListener("change", importData);
  $("#download-library").addEventListener("click", downloadLibrary);
  $("#clear-cache").addEventListener("click", clearOffline);
  $("#open-sources").addEventListener("click", () => { modal?.remove(); state.settingsModalOpen = false; state.view = "sources"; render(); });
  $("#latest-release").addEventListener("click", () => { window.location.href = "https://github.com/Abdullah-Qatan-AQ/Diwan-Shamil/releases"; });
  $("#reset-app").addEventListener("click", resetApplication);
  $$('[data-remove]', modal).forEach((button) => button.addEventListener("click", () => { state.bookmarks = state.bookmarks.filter((item) => item.id !== button.dataset.remove); persist(); close(); openSettingsModal(); }));
}
function settingsView() { openSettingsModal(); }
function resetApplication() {
  if (!window.confirm("هل تريد حذف كل بيانات التطبيق المحلية وإعادة ضبطه؟")) return;
  localStorage.clear();
  if ("caches" in window) caches.keys().then((names) => Promise.all(names.map((name) => caches.delete(name))));
  window.location.reload();
}

function exportData() {
  try {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            version: 3,
            exportedAt: new Date().toISOString(),
            settings,
            bookmarks: state.bookmarks,
            readingPositions: state.readingPositions,
            surah: state.surah,
          },
          null,
          2,
        ),
      ],
      { type: "application/json;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `diwan-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showStatus("تم تجهيز ملف النسخة الاحتياطية للتنزيل");
  } catch {
    showStatus("تعذر تصدير البيانات من هذا المتصفح", "error");
  }
}
function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (Array.isArray(data.bookmarks)) state.bookmarks = data.bookmarks;
      if (Array.isArray(data.readingPositions)) state.readingPositions = data.readingPositions;
      if (data.settings && typeof data.settings === "object")
        Object.assign(settings, data.settings);
      if (Number.isInteger(Number(data.surah)))
        state.surah = Number(data.surah);
      persist();
      document.documentElement.dataset.theme = settings.theme;
      applyReadingStyle();
      settingsView();
      showStatus("تم استيراد النسخة الاحتياطية");
    } catch {
      showStatus("ملف النسخة الاحتياطية غير صالح", "error");
    }
  };
  reader.readAsText(file);
}
async function downloadLibrary() {
  if (!("caches" in window))
    return showStatus("التنزيل غير مدعوم في هذا المتصفح", "error");
  const urls = [
    "./",
    "./index.html",
    "./styles.css?v=34",
    "./app.js?v=42",
    "./manifest.json",
    "./data/quran.json",
    "./data/surah-meta.json",
    "./data/poetry/index.json",
    "./data/poetry/poets.json",
    ...Array.from({ length: 76 }, (_, index) => `./data/poetry/part-${String(index).padStart(3, "0")}.json`),
    "./data/poetry/supplemental.json",
    "./data/poetry/POETRY-LICENSE-SHAWQI",
    "./data/lexicon/lexicon-core.json",
    "./data/lexicon/original-glosses.json",
    "./data/lexicon/original-additions.json",
    "./data/lexicon/original-letters.json",
    "./data/lexicon/poetry-words.json",
    "./data/lexicon/lexicon.json",
    "./data/lexicon/poetry-coverage.json",
    "./data/lexicon/coverage/index.json",
    "./data/lexicon/wiktionary.json",
    "./data/lexicon/wiktionary2.json",
    ...collections
      .filter((item) => item[3] === "hadith")
      .map((item) => `./${item[2]}`),
  ];
  const cache = await caches.open("diwan-library-v6");
  let done = 0;
  let failed = 0;
  showStatus("بدأ تنزيل المكتبة…");
  for (const url of urls) {
    try {
      const response = await fetch(url, { cache: "no-cache" });
      if (!response.ok) throw new Error(url);
      await cache.put(url, response);
      done += 1;
    } catch {
      failed += 1;
    }
  }
  showStatus(
    failed
      ? `اكتمل التنزيل جزئيًا: ${done} ملف، تعذر ${failed}`
      : `تم تنزيل ${done} ملفًا للعمل دون إنترنت`,
    failed ? "error" : "ok",
  );
}
async function clearOffline() {
  if (!("caches" in window)) return;
  const names = await caches.keys();
  const removed = await Promise.all(
    names
      .filter((name) => name.startsWith("diwan-library-"))
      .map((name) => caches.delete(name)),
  );
  showStatus(
    removed.some(Boolean)
      ? "تم مسح التنزيلات المحلية"
      : "لا توجد تنزيلات محلية",
  );
}
function downloadQuran() {
  const surah = state.surahs.find((item) => item.number === state.surah);
  if (!surah) return;
  const text = surah.ayahs
    .map((ayah) => `${ayah.verse}. ${ayah.text}`)
    .join("\n");
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/plain;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `سورة-${state.surah}.txt`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function render() {
  applyReadingStyle();
  document.documentElement.dataset.theme = settings.theme;
  state.renderToken += 1;
  if (state.view === "reader") reader();
  else if (state.view === "catalog") catalog();
  else if (state.view === "favorites") favorites();
  else if (state.view === "sources") sourcesView();
  else if (state.view === "settings") { state.view = "home"; home(); openSettingsModal(); }
  else if (state.view === "hadith" && state.hadithData) renderHadith();
  else if (state.view === "poetry" && state.poetryIndex) renderPoetryControls();
  else if (state.view === "poetry") renderPoetryLoading("موسوعة الشعر العربي");
  else home();
}
state.lexiconPromise = loadLexicon();
persist();
render();
window.__diwan = { state, navigate, goBack, render };
