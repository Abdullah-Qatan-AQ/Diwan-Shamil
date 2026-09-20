# مصادر بيانات الحديث

تستخدم ملفات الحديث العربية في هذا المجلد طبقة المتن العربي من [QuranLab Hadith](https://huggingface.co/datasets/quranlab/hadith)، المبنية على [Open-Hadith-Data](https://github.com/mhashim6/Open-Hadith-Data). تم تنزيل التكوينات العربية السبعة وتحويلها محليًا من Parquet إلى JSON دون استخدام API وقت التشغيل.

## الملفات والتغطية

| الملف | التكوين | عدد الأحاديث |
| --- | --- | ---: |
| `ara-bukhari.json` | `bukhari-ar` | 7,580 |
| `ara-muslim.json` | `muslim-ar` | 7,360 |
| `ara-tirmidhi.json` | `tirmidhi-ar` | 3,924 |
| `ara-abudawud.json` | `abudawud-ar` | 5,272 |
| `ara-nasai.json` | `nasai-ar` | 5,679 |
| `ara-ibnmajah.json` | `ibnmajah-ar` | 4,338 |
| `ara-malik.json` | `malik-ar` | 1,829 |
| **الإجمالي** |  | **35,982** |

## الترخيص والإسناد

تخضع طبقة قاعدة البيانات لشروط **ODbL 1.0**، ويخضع المحتوى لشروط **DbCL 1.0** وفق إشعاري المصدر الرسميين [`QURANLAB-LICENSES.md`](QURANLAB-LICENSES.md) و[`QURANLAB-SOURCES.md`](QURANLAB-SOURCES.md). يجب إبقاء الإسناد عند إعادة التوزيع، وقد تنطبق متطلبات Share-Alike على قواعد البيانات المشتقة. لا يجوز اعتبار رخصة MIT الموجودة في جذر المشروع ترخيصًا لبيانات الحديث؛ فهي تخص كود التطبيق فقط.

النصوص العربية محفوظة كما وردت من المصدر دون تنقيح أو إعادة صياغة. لا تتضمن هذه النسخة الترجمات أو الشروح أو طبقة الدرجات متعددة اللغات. يحتوي كل ملف JSON على `metadata.sourceSha256` لبصمة ملف Parquet الأصلي، وعلى حقول المصدر والرخصة لكل سجل.

## إعادة البناء والتحقق

يمكن إعادة الاستيراد بالأمر:

```bash
python3 scripts/import-quranlab.py
```

تاريخ التحويل: **2026-09-21**. لا تُضمَّن ملفات Parquet المؤقتة في المستودع.

للنصوص الكاملة، راجع [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) و[DbCL 1.0](https://opendatacommons.org/licenses/dbcl/1-0/).
