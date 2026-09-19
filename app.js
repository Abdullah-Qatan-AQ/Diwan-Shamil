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

const collections = [
  ["القرآن الكريم", "قرآن", "data/quran.json", "quran"],
  ["صحيح البخاري", "حديث", "data/ara-bukhari.json", "hadith"],
  ["صحيح مسلم", "حديث", "data/ara-muslim.json", "hadith"],
  ["جامع الترمذي", "حديث", "data/ara-tirmidhi.json", "hadith"],
  ["سنن أبي داود", "حديث", "data/ara-abudawud.json", "hadith"],
  ["سنن النسائي", "حديث", "data/ara-nasai.json", "hadith"],
  ["سنن ابن ماجه", "حديث", "data/ara-ibnmajah.json", "hadith"],
  ["موطأ مالك", "حديث", "data/ara-malik.json", "hadith"],
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
  hadithData: null,
  hadithLoading: false,
  renderToken: 0,
};

function persist() {
  localStorage.setItem(
    "diwan-settings",
    JSON.stringify({ ...settings, font: state.font }),
  );
  localStorage.setItem("diwan-bookmarks", JSON.stringify(state.bookmarks));
  localStorage.setItem("diwan-surah", String(state.surah));
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
  }
  render();
}
function goBack() {
  const previous = state.routeHistory.pop();
  state.view = previous && previous !== state.view && previous !== "settings" ? previous : "home";
  state.renderToken += 1;
  state.hadithData = state.view === "hadith" ? state.hadithData : null;
  state.hadithLoading = false;
  if (state.view !== "poetry") {
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
  app.innerHTML = `<div class="app-shell"><header class="topbar"><button id="app-back" class="app-back" type="button" aria-label="رجوع">‹ رجوع</button><a class="brand" href="#"><span class="brand-mark">۞</span><b>الديوان الشامل</b></a><nav aria-label="التنقل الرئيسي"><button type="button" data-view="home">الرئيسية</button><button type="button" data-view="reader">القرآن</button><button type="button" data-view="catalog">الفهرس</button><button type="button" data-view="settings">الإعدادات</button></nav><button type="button" class="top-search" data-view="catalog" aria-label="بحث">⌕ بحث</button></header><main>${content}</main><footer>الديوان الشامل · مكتبة عربية للقراءة والبحث</footer></div>`;
  bindShell();
}
function bindShell() {
  $$("[data-view]").forEach((button) =>
    button.addEventListener("click", (event) => {
      event.preventDefault();
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
    `<section class="home"><div class="home-copy"><span class="kicker">مكتبتك العربية</span><h1>المعرفة العربية<br><em>في موضعها.</em></h1><div class="quick-search"><input id="quick-q" type="search" autocomplete="off" placeholder="ابحث في القرآن والحديث والشعر"><button id="quick-go" type="button">بحث</button></div><div class="home-actions"><button type="button" data-view="settings">تخصيص القراءة</button><button id="offline-home" type="button">تنزيل المكتبة</button></div></div><div class="home-mark">۞</div></section><section class="home-grid"><button type="button" data-view="reader"><b>القرآن الكريم</b><span>السور والآيات والبحث داخل السورة</span></button><button type="button" data-view="catalog"><b>الحديث الشريف</b><span>ثمانية كتب مع بحث وفلاتر</span></button><button type="button" data-view="catalog"><b>الشعر العربي</b><span>75,022 قصيدة مع تحميل تدريجي</span></button><button type="button" data-view="settings"><b>إعدادات وتجربة شخصية</b><span>ثيمات، خط، محفوظات، ونسخ احتياطي</span></button></section>`,
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
    `<div class="page-head"><div><span class="kicker">المصحف</span><h1>القرآن الكريم</h1></div><div class="reader-actions"><button id="minus" type="button">A−</button><button id="plus" type="button">A+</button><button id="save" type="button">☆ حفظ</button><button id="download" type="button">⇩ تنزيل السورة</button></div></div><div class="reader-grid"><aside class="surah-panel"><input id="surah-q" type="search" placeholder="بحث باسم السورة"><div id="surahs" class="surahs">جاري التحميل</div></aside><article class="quran-paper"><div class="paper-head"><div><span id="surah-label" class="kicker">السورة</span><h2 id="surah-title">القرآن الكريم</h2></div><input id="ayah-q" class="inline-search" type="search" placeholder="بحث داخل السورة"><div class="font-readout">${state.font}px</div></div><div id="ayahs" class="ayahs">جاري القراءة…</div></article></div>`,
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
      : '<div class="basmala">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>';
  $("#ayahs").innerHTML =
    basmala +
    (rows
      .map(
        (ayah) =>
          `<p class="ayah"><span>${esc(ayah.text)}</span><b>${ayah.verse}</b></p>`,
      )
      .join("") || '<div class="empty">لا توجد آيات مطابقة</div>');
  $(".font-readout").textContent = `${state.font}px`;
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
function getHadithText(item) {
  return String(item.text || item.arabic || item.arabicText || "").trim();
}
function getHadithNumber(item) {
  return item.hadithnumber || item.idInBook || item.id || "";
}
function getHadithSections(data, list) {
  const sections = data.metadata?.sections || data.sections || {};
  const names = Object.entries(sections)
    .filter(([, name]) => name)
    .map(([id, name]) => ({ id: String(id), name: String(name) }));
  if (names.length) return names;
  return [
    ...new Set(
      list
        .map((item) => item.chapterId ?? item.chapter ?? item.bookId)
        .filter((value) => value != null),
    ),
  ].map((id) => ({ id: String(id), name: `القسم ${id}` }));
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
    state.poetryReady = false;
    renderPoetryLoading(collection.name);
    try {
      const index = await fetchJson(collection.file);
      if (token !== state.renderToken || state.view !== "poetry") return;
      state.poetryIndex = index;
      state.poetryLoading = false;
      await loadPoetryPart();
      if (token !== state.renderToken || state.view !== "poetry") return;
      state.poetryReady = true;
      renderPoetryControls();
    } catch {
      if (token === state.renderToken) {
        state.poetryLoading = false;
        showStatus("تعذر تحميل فهرس الشعر.", "error");
        renderPoetryLoading(collection.name, "تعذر تحميل فهرس الشعر");
      }
    }
    return;
  }
  state.hadithData = { list: [], index: [], name: collection.name, query: "", section: "all", length: "all", limit: 60, sections: [], loading: true };
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
      const section = String(item.chapterId ?? item.chapter ?? item.bookId ?? "");
      return { item, text, number, section, searchable: JSON.stringify(item).toLowerCase() };
    });
    state.hadithData.sections = getHadithSections(data, list);
    state.hadithData.loading = false;
    state.hadithLoading = false;
    renderHadith();
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
  shell(`<div class="book-overview"><div><span class="kicker">شعر</span><h2>موسوعة الشعر العربي</h2><p>${Number(index.count).toLocaleString("ar-EG")} قصيدة · تحميل تدريجي كامل</p></div><div class="book-seal">شعر</div></div><div class="reading-toolbar"><input id="poetry-q" type="search" placeholder="ابحث عن شاعر أو قصيدة أو بيت"><select id="poetry-era"><option>الكل</option></select><span id="poem-count"></span></div><div id="poems"></div><button id="load-more" class="load-more" type="button" hidden>تحميل المزيد</button><div id="poem-status" class="loading-more"></div>`);
  $("#poetry-q").addEventListener("focus", focusWithinViewport);
  $("#poetry-q").addEventListener("input", (event) => { state.poetryQuery = event.target.value; drawPoems(); });
  $("#poetry-era").addEventListener("change", (event) => { state.poetryEra = event.target.value; drawPoems(); });
  $("#load-more").addEventListener("click", async () => { await loadPoetryPart(); fillEras(); drawPoems(); });
  fillEras();
  drawPoems();
}

function renderHadith() {
  const info = state.hadithData;
  shell(
    `<div class="book-overview"><div><span class="kicker">حديث</span><h2>${esc(info.name)}</h2><p>${info.list.length.toLocaleString("ar-EG")} نص · بحث وفلاتر متقدمة</p></div><div class="book-seal">حديث</div></div><div class="reading-toolbar"><input id="hadith-q" type="search" placeholder="بحث في النص أو الرقم"><select id="hadith-section"><option value="all">كل الأقسام</option>${info.sections.map((section) => `<option value="${esc(section.id)}">${esc(section.name)}</option>`).join("")}</select><select id="hadith-len"><option value="all">كل النتائج</option><option value="short">مختصر</option><option value="long">مطول</option></select><span id="hadith-count"></span></div><div id="hadith-list">${info.loading ? '<div class="loading-more">جاري تحميل الكتاب…</div>' : ''}</div><button id="hadith-more" class="load-more" type="button" ${info.loading ? 'hidden' : ''}>عرض المزيد</button><div id="hadith-status" class="loading-more">${info.loading ? 'يتم تجهيز البحث…' : ''}</div>`,
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
  $("#hadith-more").addEventListener("click", () => {
    info.limit += 60;
    drawHadith();
  });
  drawHadith();
}
function drawHadith() {
  const info = state.hadithData;
  if (!info || !(info.index || info.list) || !$("#hadith-list") || info.loading) return;
  const matches = info.index.filter((entry) => entry.text && (!info.query || entry.searchable.includes(info.query)) && (info.section === "all" || entry.section === info.section) && (info.length === "all" || (info.length === "short" ? entry.text.length < 350 : entry.text.length >= 350)));
  const visible = matches.slice(0, info.limit);
  $("#hadith-list").innerHTML = visible.map(({ item, text, number }) => {
    const id = `hadith-${info.name}-${number}`;
    return `<article class="hadith"><div class="hadith-meta"><b>حديث ${esc(number)}</b><span>${esc(info.name)}</span><button type="button" class="mini-save" data-save="${esc(id)}" data-title="${esc(text.slice(0, 80))}">${state.bookmarks.some((saved) => saved.id === id) ? "★" : "☆"}</button></div><p>${esc(text)}</p></article>`;
  }).join("") || '<div class="empty">لا توجد نتائج مطابقة</div>';
  $("#hadith-count").textContent = `${matches.length.toLocaleString("ar-EG")} حديث`;
  $("#hadith-status").textContent = matches.length > visible.length ? `عرض ${visible.length.toLocaleString("ar-EG")} من ${matches.length.toLocaleString("ar-EG")} حديث` : "اكتملت النتائج";
  $("#hadith-more").hidden = matches.length <= visible.length;
  $$('[data-save]').forEach((button) => button.addEventListener("click", () => { toggleBookmark({ id: button.dataset.save, type: "hadith", title: button.dataset.title }); drawHadith(); }));
}

async function openPoetry(collection) {
  if (state.poetryIndex) renderPoetryControls();
}

async function loadPoetryPart() {
  if (
    state.poetryLoading ||
    !state.poetryIndex ||
    state.poetryLoaded >= state.poetryIndex.parts
  )
    return;
  state.poetryLoading = true;
  try {
    state.poetryParts.push(await fetchJson(
      `data/poetry/part-${String(state.poetryLoaded).padStart(3, "0")}.json`,
    ));
    state.poetryLoaded += 1;
  } finally {
    state.poetryLoading = false;
    updatePoetryStatus();
  }
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
function updatePoetryStatus() {
  const element = $("#poem-status");
  const complete = state.poetryLoaded >= (state.poetryIndex?.parts || 0);
  if (element) {
    element.textContent = complete
      ? "اكتمل تحميل الديوان"
      : `المحمّل ${state.poetryParts.length.toLocaleString("ar-EG")} من ${Number(state.poetryIndex?.count || 0).toLocaleString("ar-EG")} قصيدة`;
  }
  $("#load-more")?.toggleAttribute("hidden", complete);
}
function drawPoems() {
  if (!state.poetryReady) {
    $("#poems").innerHTML =
      '<div class="loading-more">جاري تحميل القصائد…</div>';
    return;
  }
  const query = state.poetryQuery.toLowerCase();
  const rows = state.poetryParts.filter(
    (item) =>
      (state.poetryEra === "الكل" || item.poet_era === state.poetryEra) &&
      (!query ||
        `${item.poet_name} ${item.poem_title} ${item.poem_text}`
          .toLowerCase()
          .includes(query)),
  );
  $("#poems").innerHTML =
    rows
      .map((item) => {
        const id = `poem-${item.poem_title}-${item.poet_name}`;
        return `<article class="poem"><header><b>${esc(item.poem_title || "قصيدة")}</b><span>${esc(item.poet_name || "شاعر")} · ${esc(item.poet_era || "")} <button type="button" class="mini-save" data-save="${esc(id)}" data-title="${esc(item.poem_title || "قصيدة")}">${state.bookmarks.some((saved) => saved.id === id) ? "★" : "☆"}</button></span></header><p>${esc(item.poem_text || "")}</p></article>`;
      })
      .join("") || '<div class="empty">لا توجد نتائج في الأجزاء المحملة</div>';
  $("#poem-count").textContent = `${rows.length.toLocaleString("ar-EG")} نتيجة`;
  updatePoetryStatus();
  $$("[data-save]").forEach((button) =>
    button.addEventListener("click", () => {
      toggleBookmark({
        id: button.dataset.save,
        type: "poem",
        title: button.dataset.title,
      });
      drawPoems();
    }),
  );
}

function settingsView() {
  shell(
    `<div class="page-head"><div><span class="kicker">تخصيص</span><h1>الإعدادات</h1></div></div><section class="settings-grid"><article class="settings-card"><h2>المظهر والقراءة</h2><label>الثيم</label><div class="theme-choices"><button type="button" data-theme="sand">رملي</button><button type="button" data-theme="night">ليلي</button><button type="button" data-theme="green">أخضر</button><button type="button" data-theme="paper">ورقي</button></div><label>حجم الخط <b id="settings-font">${state.font}px</b></label><input id="settings-font-range" type="range" min="16" max="40" value="${state.font}"><label class="check"><input id="remember" type="checkbox" ${settings.remember ? "checked" : ""}> تذكر آخر سورة</label></article><article class="settings-card"><h2>المحفوظات والنسخ الاحتياطي</h2><p>لديك <b>${state.bookmarks.length}</b> عنصر محفوظ.</p><button id="export-data" type="button">تصدير نسخة احتياطية</button><button id="import-data" type="button">استيراد نسخة احتياطية</button><input id="import-file" type="file" accept="application/json" hidden><div class="bookmark-list">${
      state.bookmarks
        .slice(0, 12)
        .map(
          (item) =>
            `<div class="bookmark-row"><span>${esc(item.title || item.id)}</span><button type="button" data-remove="${esc(item.id)}">حذف</button></div>`,
        )
        .join("") || '<p class="muted">لا توجد محفوظات بعد.</p>'
    }</div></article><article class="settings-card"><h2>القراءة دون إنترنت</h2><p>نزّل ملفات المكتبة الأساسية إلى ذاكرة المتصفح لتعمل عند انقطاع الشبكة.</p><button id="download-library" type="button">تنزيل المكتبة الأساسية</button><button id="clear-cache" type="button">مسح التنزيلات</button></article><article class="settings-card"><h2>المزامنة بين الأجهزة</h2><p>التصدير والاستيراد يعملان فورًا دون حساب. للمزامنة السحابية الحقيقية يلزم ربط حساب وقاعدة بيانات.</p><button id="sync-copy" type="button">نسخ بيانات المزامنة</button></article></section>`,
  );
  $$("[data-theme]").forEach((button) =>
    button.addEventListener("click", () => {
      setTheme(button.dataset.theme);
      settingsView();
    }),
  );
  $("#settings-font-range").addEventListener("input", (event) => {
    state.font = Number(event.target.value);
    settings.font = state.font;
    persist();
    applyReadingStyle();
    $("#settings-font").textContent = `${state.font}px`;
  });
  $("#remember").addEventListener("change", (event) => {
    settings.remember = event.target.checked;
    persist();
  });
  $("#export-data").addEventListener("click", exportData);
  $("#import-data").addEventListener("click", () => $("#import-file").click());
  $("#import-file").addEventListener("change", importData);
  $("#download-library").addEventListener("click", downloadLibrary);
  $("#clear-cache").addEventListener("click", clearOffline);
  $("#sync-copy").addEventListener("click", exportData);
  $$("[data-remove]").forEach((button) =>
    button.addEventListener("click", () => {
      state.bookmarks = state.bookmarks.filter(
        (item) => item.id !== button.dataset.remove,
      );
      persist();
      settingsView();
    }),
  );
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
      if (data.settings && typeof data.settings === "object")
        Object.assign(settings, data.settings);
      if (Number.isInteger(Number(data.surah)))
        state.surah = Number(data.surah);
      persist();
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
    "./styles.css?v=19",
    "./app.js?v=19",
    "./manifest.json",
    "./data/quran.json",
    "./data/surah-meta.json",
    "./data/poetry/index.json",
    ...collections
      .filter((item) => item[3] === "hadith")
      .map((item) => `./${item[2]}`),
  ];
  const cache = await caches.open("diwan-library-v5");
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
  else if (state.view === "settings") settingsView();
  else if (state.view === "hadith" && state.hadithData) renderHadith();
  else if (state.view === "poetry" && state.poetryIndex) renderPoetryControls();
  else if (state.view === "poetry") renderPoetryLoading("موسوعة الشعر العربي");
  else home();
}
persist();
render();
window.__diwan = { state, navigate, goBack, render };
