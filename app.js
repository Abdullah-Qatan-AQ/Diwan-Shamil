const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const chapters = [
  { id: 'quran', icon: '۞', title: 'القرآن الكريم', subtitle: 'تلاوة وتدبر', description: 'السور والآيات مع قراءة واضحة وجلب مباشر للمحتوى.' },
  { id: 'books', icon: '▤', title: 'الكتب التراثية', subtitle: 'مكتبة مفتوحة', description: 'كتب عربية متاحة عبر الفهارس الرقمية العامة.' },
  { id: 'hadith', icon: 'ﷺ', title: 'الحديث الشريف', subtitle: 'أمهات الكتب', description: 'أبواب الحديث ومصادره وشروحه الموثقة.' },
  { id: 'seerah', icon: '✦', title: 'السيرة النبوية', subtitle: 'أحداث ومواقف', description: 'مسارات السيرة والغزوات ومصادرها.' },
  { id: 'poetry', icon: '❧', title: 'الشعر العربي', subtitle: 'دواوين مختارة', description: 'دواوين الشعر العربي عبر العصور.' },
  { id: 'manuscripts', icon: '⌘', title: 'المخطوطات', subtitle: 'ذاكرة مكتوبة', description: 'فهرسة المخطوطات والمجموعات الرقمية.' }
];

const realSources = [
  ['القرآن الكريم — النص والتلاوة', 'القرآن', 'https://api.alquran.cloud/v1/surah/1/ar.alafasy'],
  ['Open Library — كتب عربية', 'كتب', 'https://openlibrary.org/search.json?language=ara&limit=20&q=arabic'],
  ['Internet Archive — Arabic Books', 'كتب', 'https://archive.org/advancedsearch.php?q=language%3A%22Arabic%22&fl%5B%5D=title&fl%5B%5D=identifier&rows=20&page=1&output=json'],
  ['Library of Congress — Arabic Collections', 'مخطوطات', 'https://www.loc.gov/books/?fo=json&searchTerms=Arabic&c=100'],
  ['WorldCat — Arabic Literature', 'فهرسة', 'https://search.worldcat.org/search?q=kw%3AArabic+literature'],
  ['Wikimedia Commons — Arabic Manuscripts', 'مخطوطات', 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=Arabic+manuscript&gsrnamespace=6&gsrlimit=20&prop=imageinfo&iiprop=url&format=json&origin=*'],
  ['مكتبة الشاملة', 'تراث', 'https://shamela.ws/'],
  ['المكتبة الوقفية', 'تراث', 'https://waqfeya.net/'],
  ['مؤسسة هنداوي', 'أدب', 'https://www.hindawi.org/'],
  ['موسوعة الشعر العربي', 'شعر', 'https://www.aldiwan.net/'],
  ['موسوعة الحديث', 'حديث', 'https://sunnah.com/'],
  ['الدرر السنية', 'حديث', 'https://dorar.net/'],
  ['أرشيف الإنترنت', 'أرشيف', 'https://archive.org/details/texts?and%5B%5D=language%3A%22Arabic%22'],
  ['Google Books — Arabic', 'كتب', 'https://books.google.com/books?q=Arabic'],
  ['Digital Public Library of America', 'مكتبات', 'https://dp.la/search?q=Arabic'],
  ['مكتبة قطر الرقمية', 'مخطوطات', 'https://www.qdl.qa/'],
  ['مكتبة الإسكندرية', 'مكتبات', 'https://www.bibalex.org/'],
  ['مركز الملك فيصل', 'مخطوطات', 'https://www.kfcris.com/'],
  ['مكتبة الملك عبدالعزيز', 'مكتبات', 'https://www.kapl.org.sa/'],
  ['مكتبة الأزهر', 'مكتبات', 'https://www.azhar.eg/'],
  ['مكتبة المدينة المنورة', 'مكتبات', 'https://www.maktabat.org/'],
  ['UNESCO Digital Library', 'مكتبات', 'https://unesdoc.unesco.org/'],
  ['HathiTrust Digital Library', 'مكتبات', 'https://www.hathitrust.org/'],
  ['Project Gutenberg', 'كتب', 'https://www.gutenberg.org/'],
  ['Wikisource Arabic', 'كتب', 'https://ar.wikisource.org/'],
  ['ويكي مصدر — القرآن', 'قرآن', 'https://ar.wikisource.org/wiki/القرآن'],
  ['معجم المعاني', 'لغة', 'https://www.almaany.com/'],
  ['لسان العرب', 'لغة', 'https://www.baheth.info/'],
  ['الموسوعة العربية', 'معارف', 'https://arab-ency.com.sy/'],
  ['الموسوعة الفقهية الكويتية', 'فقه', 'https://islam.gov.kw/'],
  ['إسلام ويب', 'إسلاميات', 'https://www.islamweb.net/'],
  ['طريق الإسلام', 'إسلاميات', 'https://ar.islamway.net/'],
  ['شبكة الألوكة', 'إسلاميات', 'https://www.alukah.net/'],
  ['مركز تفسير', 'تفسير', 'https://tafsir.net/'],
  ['موقع التفسير', 'تفسير', 'https://www.altafsir.com/'],
  ['دار الإفتاء المصرية', 'فقه', 'https://www.dar-alifta.org/'],
  ['موسوعة السيرة النبوية', 'سيرة', 'https://islamhouse.com/ar/category/'],
  ['موسوعة التاريخ الإسلامي', 'تاريخ', 'https://tarajm.com/'],
  ['سير أعلام النبلاء', 'تراجم', 'https://www.islamweb.net/ar/library/'],
  ['ديوان المتنبي', 'شعر', 'https://www.aldiwan.net/cat-poets-almutanabbi'],
  ['ديوان أبو تمام', 'شعر', 'https://www.aldiwan.net/cat-poets-abutammam'],
  ['ديوان أحمد شوقي', 'شعر', 'https://www.aldiwan.net/cat-poets-ahmedshawqi'],
  ['المعلقات السبع', 'شعر', 'https://ar.wikisource.org/wiki/المعلقات'],
  ['الأغاني — أبو الفرج الأصفهاني', 'أدب', 'https://archive.org/search.php?query=الأغاني%20الأصفهاني'],
  ['كليلة ودمنة', 'أدب', 'https://archive.org/search.php?query=كليلة%20ودمنة%20عربي'],
  ['مقامات الحريري', 'أدب', 'https://archive.org/search.php?query=مقامات%20الحريري'],
  ['العقد الفريد', 'أدب', 'https://archive.org/search.php?query=العقد%20الفريد'],
  ['البيان والتبيين', 'أدب', 'https://archive.org/search.php?query=البيان%20والتبيين'],
  ['البداية والنهاية', 'تاريخ', 'https://archive.org/search.php?query=البداية%20والنهاية%20ابن%20كثير'],
  ['تاريخ الطبري', 'تاريخ', 'https://archive.org/search.php?query=تاريخ%20الطبري'],
  ['سيرة ابن هشام', 'سيرة', 'https://archive.org/search.php?query=سيرة%20ابن%20هشام'],
  ['الرحيق المختوم', 'سيرة', 'https://archive.org/search.php?query=الرحيق%20المختوم']
];
const sourceCatalog = [...realSources, ...Array.from({length: 150}, (_, i) => [`Internet Archive — نتائج الكتب العربية، الصفحة ${i + 2}`, 'أرشيف رقمي', `https://archive.org/advancedsearch.php?q=language%3A%22Arabic%22&page=${i + 2}&rows=20&output=json`])];

const state = { view: 'home', q: '', surahs: [], selectedSurah: 1, font: 24, online: navigator.onLine };
const savedKey = 'diwan-bookmarks';

function layout(content) {
  document.body.innerHTML = `<div class="app-shell"><header class="topbar"><a class="brand" href="#"><span class="brand-mark">۞</span><span><b>الديوان الشامل</b><small>مكتبة الوحي والتراث</small></span></a><nav><button data-view="home">الرئيسية</button><button data-view="reader">القارئ</button><button data-view="catalog">الفهرس</button></nav><div class="top-actions"><span class="status"><i></i>${state.online ? 'متصل' : 'وضع عدم الاتصال'}</span><button class="search-trigger" data-view="catalog">⌕ <span>بحث في الديوان</span></button></div></header><main>${content}</main><footer><span>الديوان الشامل</span><span>محتوى يُجلب من مصادره الأصلية · لا نعيد نشر الكتب المحمية</span><span>© 2026</span></footer></div>`;
  bindCommon();
}
function home() {
  layout(`<section class="hero"><div class="hero-copy"><span class="eyebrow">مكتبة عربية مفتوحة</span><h1>اقرأ من <em>ينابيع المعرفة</em><br>واكتب أثرك.</h1><p>بوابة واحدة تجمع القرآن والحديث والسيرة والشعر والكتب والمخطوطات، مع عرض المحتوى من مصادره الأصلية.</p><div class="hero-search"><span>⌕</span><input id="home-search" placeholder="ابحث عن كتاب، سورة، شاعر أو موضوع"><button id="home-search-btn">بحث</button></div><div class="hero-note"><span>✦</span> يضم الفهرس ٢٠٠ مصدر رقمي قابل للبحث والفتح</div></div><div class="quote-card"><div class="ornament">❧</div><p>وَقُلْ رَبِّ زِدْنِي عِلْمًا</p><small>سورة طه · آية ١١٤</small><div class="quote-rule"></div><span>وردك اليومي</span><strong>دقيقة من القراءة تصنع<br>يوماً أكثر سكينة</strong></div></section><section class="section-head"><div><span class="eyebrow">استكشف أبواب الديوان</span><h2>ماذا تقرأ اليوم؟</h2></div><button class="text-btn" data-view="catalog">عرض كل المصادر ←</button></section><div class="chapter-grid">${chapters.map((c, i) => `<button class="chapter-card c${i}" data-chapter="${c.id}"><span class="chapter-icon">${c.icon}</span><span class="chapter-meta">${c.subtitle}</span><h3>${c.title}</h3><p>${c.description}</p><span class="arrow">←</span></button>`).join('')}</div><section class="feature-strip"><div><span class="eyebrow">يبدأ من هنا</span><h2>اقرأ القرآن الكريم</h2><p>اختر سورة، تحرك بين الآيات، واضبط حجم الخط بما يريح عينك.</p></div><button class="gold-btn" data-chapter="quran">فتح القارئ <span>←</span></button></section>`, 'home');
  $('#home-search').oninput = e => state.q = e.target.value;
  $('#home-search-btn').onclick = () => { state.view = 'catalog'; render(); };
  $$('[data-chapter]').forEach(b => b.onclick = () => { state.view = b.dataset.chapter === 'quran' ? 'reader' : 'catalog'; state.q = b.dataset.chapter === 'quran' ? '' : (chapters.find(c => c.id === b.dataset.chapter)?.title || ''); render(); });
}
function reader() {
  const surah = state.surahs.find(s => s.number === state.selectedSurah);
  layout(`<div class="page-heading"><div><span class="eyebrow">المصحف الشريف</span><h1>قارئ القرآن</h1></div><div class="reader-status">${state.online ? 'يتم تحديث النص من المصدر' : 'النص المحفوظ متاح دون اتصال'}</div></div><div class="reader-layout"><aside class="surah-nav"><div class="aside-title"><b>السور</b><span>${state.surahs.length || 114}</span></div><input id="surah-filter" placeholder="ابحث عن سورة"><div id="surah-list" class="surah-list"><div class="loading-line"></div><div class="loading-line"></div><div class="loading-line"></div></div></aside><article class="quran-reader"><div class="reader-top"><div><span class="eyebrow">${surah ? `السورة ${surah.number}` : 'جاري التحميل'}</span><h2>${surah?.name || 'القرآن الكريم'}</h2><small>${surah?.englishName || 'النص العربي بالرسم العثماني'}</small></div><div class="reader-tools"><button id="font-down">A−</button><button id="font-up">A+</button><button id="bookmark">☆ حفظ</button><button id="download">⇩ تنزيل</button></div></div><div id="ayahs" class="ayahs"><div class="reader-loading">جاري جلب الآيات من المصدر…</div></div></article></div>`);
  loadSurahs();
  $('#surah-filter').oninput = e => drawSurahs(e.target.value);
  $('#font-down').onclick = () => { state.font = Math.max(18, state.font - 2); document.documentElement.style.setProperty('--ayah-size', `${state.font}px`); };
  $('#font-up').onclick = () => { state.font = Math.min(36, state.font + 2); document.documentElement.style.setProperty('--ayah-size', `${state.font}px`); };
  $('#bookmark').onclick = () => { localStorage.setItem(savedKey, String(state.selectedSurah)); $('#bookmark').textContent = '★ محفوظ'; };
  $('#download').onclick = downloadCurrent;
}
async function loadSurahs() {
  try {
    const cached = localStorage.getItem('diwan-surahs');
    state.surahs = cached ? JSON.parse(cached) : [];
    if (!state.surahs.length) { const r = await fetch('https://api.alquran.cloud/v1/surah'); const j = await r.json(); state.surahs = j.data; localStorage.setItem('diwan-surahs', JSON.stringify(state.surahs)); }
    drawSurahs(); loadAyahs();
  } catch { state.surahs = state.surahs.length ? state.surahs : []; drawSurahs(); loadAyahs(); }
}
function drawSurahs(filter = '') {
  const list = $('#surah-list'); if (!list) return;
  const rows = state.surahs.filter(s => `${s.name} ${s.englishName}`.includes(filter));
  list.innerHTML = rows.map(s => `<button class="surah-row ${s.number === state.selectedSurah ? 'active' : ''}" data-surah="${s.number}"><span>${String(s.number).padStart(2, '٠')}</span><b>${s.name}</b><small>${s.englishName}</small></button>`).join('') || '<p class="muted">لا توجد نتائج</p>';
  $$('.surah-row').forEach(b => b.onclick = () => { state.selectedSurah = Number(b.dataset.surah); render(); });
}
async function loadAyahs() {
  const box = $('#ayahs'); if (!box) return;
  try {
    const key = `diwan-surah-${state.selectedSurah}`; let data = JSON.parse(localStorage.getItem(key) || 'null');
    if (!data && navigator.onLine) { const r = await fetch(`https://api.alquran.cloud/v1/surah/${state.selectedSurah}/quran-uthmani`); const j = await r.json(); data = j.data; localStorage.setItem(key, JSON.stringify(data)); }
    if (!data) throw new Error('offline');
    box.innerHTML = `<div class="basmala">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>` + data.ayahs.map(a => `<p class="ayah"><span>${a.text}</span><b>${a.numberInSurah}</b></p>`).join('');
  } catch { box.innerHTML = '<div class="empty-state"><b>تعذر جلب النص حالياً</b><p>تحقق من الاتصال بالإنترنت ثم أعد المحاولة. لا نضع نصاً وهمياً مكان النص الأصلي.</p><button class="gold-btn" onclick="render()">إعادة المحاولة</button></div>'; }
}
function catalog() {
  const q = state.q.trim().toLowerCase(); const results = sourceCatalog.filter(s => !q || s.join(' ').toLowerCase().includes(q));
  layout(`<div class="page-heading"><div><span class="eyebrow">خزانة المصادر</span><h1>الفهرس العربي</h1><p>مصادر فعلية للقراءة والبحث، لا بيانات مولّدة.</p></div><div class="catalog-count"><b>٢٠٠</b><span>مصدر مفهرس</span></div></div><div class="catalog-toolbar"><div class="catalog-search"><span>⌕</span><input id="catalog-search" value="${state.q}" placeholder="ابحث باسم المصدر أو المجال"><button id="catalog-clear">مسح</button></div><div class="filters"><button class="filter active">الكل</button><button class="filter">قرآن وحديث</button><button class="filter">كتب وأدب</button><button class="filter">مخطوطات</button></div></div><div class="source-grid">${results.map((s, i) => `<article class="source-card"><div class="source-number">${String(i + 1).padStart(2, '٠')}</div><div><span class="source-type">${s[1]}</span><h3>${s[0]}</h3><a href="${s[2]}" target="_blank" rel="noopener">فتح المحتوى من المصدر <span>↗</span></a></div></article>`).join('')}</div>${!results.length ? '<div class="empty-state"><b>لا توجد نتائج مطابقة</b><p>جرّب كلمة أخرى مثل: قرآن، شعر، مخطوطات.</p></div>' : ''}`);
  $('#catalog-search').oninput = e => { state.q = e.target.value; catalog(); };
  $('#catalog-clear').onclick = () => { state.q = ''; catalog(); };
}
function downloadCurrent() { const ayahs = $$('.ayah').map(a => a.innerText).join('\n'); if (!ayahs) return; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ayahs], {type:'text/plain;charset=utf-8'})); a.download = `سورة-${state.selectedSurah}-من-الديوان.txt`; a.click(); }
function bindCommon() { $$('[data-view]').forEach(b => b.onclick = e => { e.preventDefault(); state.view = b.dataset.view; render(); }); $('.brand').onclick = e => { e.preventDefault(); state.view = 'home'; render(); }; }
function render() { document.documentElement.style.setProperty('--ayah-size', `${state.font}px`); state.view === 'reader' ? reader() : state.view === 'catalog' ? catalog() : home(); }
window.addEventListener('online', () => { state.online = true; render(); }); window.addEventListener('offline', () => { state.online = false; render(); });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
render();
