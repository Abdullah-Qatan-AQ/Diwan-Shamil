# مصادر بيانات الحديث

تستخدم ملفات الحديث العربية في هذا المجلد مجموعات QuranLab Hadith الرسمية، محوّلة محليًا من Parquet إلى JSON دون اتصال وقت التشغيل. تضم النسخة الحالية جميع التكوينات العربية الثلاثة عشر المتاحة في المصدر. وتشمل 65,834 متنًا عربيًا من طبقة Open-Hadith-Data، إضافة إلى 3,574 سجلًا من طبقة HadeethEnc، أي 69,408 سجلًا إجمالًا.

## الملفات والتغطية

| الملف | التكوين | عدد السجلات | طبقة المصدر |
| --- | --- | ---: | --- |
| `ara-bukhari.json` | `bukhari-ar` | 7,580 | Open-Hadith-Data / ODbL + DbCL |
| `ara-muslim.json` | `muslim-ar` | 7,360 | Open-Hadith-Data / ODbL + DbCL |
| `ara-tirmidhi.json` | `tirmidhi-ar` | 3,924 | Open-Hadith-Data / ODbL + DbCL |
| `ara-abudawud.json` | `abudawud-ar` | 5,272 | Open-Hadith-Data / ODbL + DbCL |
| `ara-nasai.json` | `nasai-ar` | 5,679 | Open-Hadith-Data / ODbL + DbCL |
| `ara-ibnmajah.json` | `ibnmajah-ar` | 4,338 | Open-Hadith-Data / ODbL + DbCL |
| `ara-malik.json` | `malik-ar` | 1,829 | Open-Hadith-Data / ODbL + DbCL |
| `ara-ahmad.json` | `ahmad-ar` | 26,363 | Open-Hadith-Data / ODbL + DbCL |
| `ara-darimi.json` | `darimi-ar` | 3,367 | Open-Hadith-Data / ODbL + DbCL |
| `ara-dehlawi.json` | `dehlawi-ar` | 40 | Open-Hadith-Data / ODbL + DbCL |
| `ara-nawawi.json` | `nawawi-ar` | 42 | Open-Hadith-Data / ODbL + DbCL |
| `ara-qudsi.json` | `qudsi-ar` | 40 | Open-Hadith-Data / ODbL + DbCL |
| `ara-hadeethenc.json` | `hadeethenc-ar` | 3,574 | HadeethEnc.com، شروط الإسناد وإعادة النشر |
| **إجمالي طبقة Open-Hadith-Data** |  | **65,834** |  |
| **إجمالي جميع الملفات** |  | **69,408** |  |

## الترخيص والإسناد

ملفات المجموعات الإحدى عشرة المبنية على المتن العربي من Open-Hadith-Data تستخدم **ODbL 1.0** لقاعدة البيانات و**DbCL 1.0** للمحتوى، مع إبقاء إشعارات المصدر والرخصة. أما `ara-hadeethenc.json` فله شروط HadeethEnc الخاصة، ولا يجوز معاملته تلقائيًا على أنه ODbL.

كل سجل يحتفظ بحقول `source` و`sourceUrl` و`license`، وتحتوي بيانات المجموعة على `metadata.sourceSha256` لبصمة ملف Parquet الأصلي. النصوص العربية لا تُنقّح ولا تُعاد صياغتها أثناء التحويل.

## إعادة البناء والتحقق

يمكن إعادة الاستيراد بالأمر:

```bash
python3 scripts/import-quranlab.py
```

لا تُضمَّن ملفات Parquet المؤقتة في المستودع. راجع [`QURANLAB-LICENSES.md`](QURANLAB-LICENSES.md) و[`QURANLAB-SOURCES.md`](QURANLAB-SOURCES.md) قبل أي إعادة توزيع.

تاريخ آخر تحويل: **2026-09-21**.

## الروابط الرسمية

[QuranLab Hadith](https://huggingface.co/datasets/quranlab/hadith) · [Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/) · [Database Contents License 1.0](https://opendatacommons.org/licenses/dbcl/1-0/) · [HadeethEnc](https://hadeethenc.com/ar/home)

هذا توثيق عملي للمشروع وليس استشارة قانونية. قد تنطبق قواعد إضافية بحسب بلد النشر وطريقة توزيع التطبيق.

## References

[1]: https://huggingface.co/datasets/quranlab/hadith "QuranLab Hadith — Dataset Card and source notices"
[2]: https://opendatacommons.org/licenses/odbl/1-0/ "Open Database License 1.0"
[3]: https://opendatacommons.org/licenses/dbcl/1-0/ "Database Contents License 1.0"
[4]: https://hadeethenc.com/ar/home "HadeethEnc — شروط وسياسات إعادة النشر"
