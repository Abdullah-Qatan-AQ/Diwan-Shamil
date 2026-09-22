from pathlib import Path
p = Path('app.js')
s = p.read_text()
s = s.replace('75,023<small> إدخال شعري · 756 شاعرًا</small>', '75,025<small> إدخال شعري · 756 شاعرًا</small>')
s = s.replace('75,023 إدخالًا شعريًا و756 شاعرًا', '75,025 إدخالًا شعريًا و756 شاعرًا')
needle = '<article class="settings-card"><h2>أحمد شوقي — ملك عام</h2>'
insert = '<article class="settings-card"><h2>إيليا أبو ماضي — مصدر موثق</h2><p>أضيفت قصيدتان مختارتان لإيليا أبي ماضي من صفحات ويكي مصدر، مع إبقاء النسبة وروابط المصدر. صفحات المصدر تعرض النصوص وتذكر وضع الحقوق بحسب قانون المصدر، بينما يطبّق ويكي مصدر ترخيص CC BY-SA 4.0 على محتواه.</p><p><a href="https://ar.wikisource.org/wiki/جئت_لا_أعلم_من_أين_ولكني_أتيت" target="_blank" rel="noopener">جئت لا أعلم من أين</a> · <a href="https://ar.wikisource.org/wiki/أيلول_الشاعر" target="_blank" rel="noopener">أيلول الشاعر</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a></p></article>'
if needle in s and 'إيليا أبو ماضي — مصدر موثق' not in s:
    s = s.replace(needle, insert + needle)
p.write_text(s)
