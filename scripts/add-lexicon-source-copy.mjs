import fs from "node:fs";
const file = "app.js";
let text = fs.readFileSync(file, "utf8");
const marker = '<article class="settings-card"><h2>مصادر القرآن</h2>';
const card = '<article class="settings-card"><h2>شرح الكلمات</h2><p>عند النقر على أي كلمة في القصيدة، يطلب التطبيق معناها من <b>ويكاموس العربي</b> عبر واجهة Wikimedia العامة. لا تُخزَّن نسخة كاملة من المعجم داخل التطبيق، وقد لا يتوفر تعريف لكل كلمة أو دون اتصال.</p><p>محتوى ويكاموس منشور وفق <b>CC BY-SA 4.0</b> مع الإسناد ورابط المصدر. واجهة الطلب التقنية مقدمة من Wikimedia؛ راجع شروط المصدر قبل أي إعادة توزيع مستقلة للتعريفات.</p><p><a href="https://ar.wiktionary.org/" target="_blank" rel="noopener">ويكاموس العربي</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.ar" target="_blank" rel="noopener">نص CC BY-SA 4.0</a> · <a href="https://www.mediawiki.org/wiki/API:Main_page" target="_blank" rel="noopener">توثيق Wikimedia API</a></p></article>';
if (!text.includes("<h2>شرح الكلمات</h2>")) text = text.replace(marker, `${card}${marker}`);
text = text.replaceAll("./styles.css?v=33", "./styles.css?v=34").replaceAll("./app.js?v=36", "./app.js?v=37");
fs.writeFileSync(file, text);
