# مصادر بيانات الحديث

تضم النسخة النهائية **12 مجموعة عربية** من QuranLab Hadith مبنية على طبقة Open-Hadith-Data. تم حذف مجموعة HadeethEnc لأن شروطها تتطلب الحفاظ على الإصدار والمتابعة الدورية، وهو ما لا يناسب توزيع نسخة ثابتة.

## الملفات والتغطية

| الملف | التكوين | عدد السجلات | الطبقة | الترخيص |
| --- | --- | ---: | --- | --- |
| `ara-bukhari.json` | bukhari-ar | 7,580 | Open-Hadith-Data | ODbL 1.0 + DbCL 1.0 |
| `ara-muslim.json` | muslim-ar | 7,360 | Open-Hadith-Data | ODbL 1.0 + DbCL 1.0 |
| `ara-tirmidhi.json` | tirmidhi-ar | 3,924 | Open-Hadith-Data | ODbL 1.0 + DbCL 1.0 |
| `ara-abudawud.json` | abudawud-ar | 5,272 | Open-Hadith-Data | ODbL 1.0 + DbCL 1.0 |
| `ara-nasai.json` | nasai-ar | 5,679 | Open-Hadith-Data | ODbL 1.0 + DbCL 1.0 |
| `ara-ibnmajah.json` | ibnmajah-ar | 4,338 | Open-Hadith-Data | ODbL 1.0 + DbCL 1.0 |
| `ara-malik.json` | malik-ar | 1,829 | Open-Hadith-Data | ODbL 1.0 + DbCL 1.0 |
| `ara-ahmad.json` | ahmad-ar | 26,363 | Open-Hadith-Data | ODbL 1.0 + DbCL 1.0 |
| `ara-darimi.json` | darimi-ar | 3,367 | Open-Hadith-Data | ODbL 1.0 + DbCL 1.0 |
| `ara-dehlawi.json` | dehlawi-ar | 40 | Open-Hadith-Data | ODbL 1.0 + DbCL 1.0 |
| `ara-nawawi.json` | nawawi-ar | 42 | Open-Hadith-Data | ODbL 1.0 + DbCL 1.0 |
| `ara-qudsi.json` | qudsi-ar | 40 | Open-Hadith-Data | ODbL 1.0 + DbCL 1.0 |
| **الإجمالي** |  | **65,834** |  |  |

## الترخيص والإسناد

رخصة قاعدة البيانات هي **ODbL 1.0**، وترخيص المحتوى هو **DbCL 1.0**. تسمحان عادةً بالنسخ وإعادة التوزيع والاستخدام التجاري، لكنهما ليستا MIT أو CC0. يجب إبقاء اسم المصدر وروابط الرخصة وإشعارات الإسناد، وقد تنطبق شروط Share-Alike على قاعدة البيانات المشتقة.

رخصة MIT الموجودة في جذر المستودع تخص **كود التطبيق فقط** ولا تعيد ترخيص بيانات الحديث. نقل البيانات إلى JSON أو JavaScript أو SQLite أو APK لا يغير حقوقها أو شروطها.

كل سجل يحتفظ بحقوق المصدر والحقول الوصفية التي وفرها QuranLab، وتحتوي ملفات البيانات على بصمات المصدر عند توفرها. لا يقدم التطبيق ادعاءً مستقلًا بصحة الأحاديث أو درجاتها.

## إعادة البناء والتحقق

يمكن إعادة استيراد بيانات QuranLab بالأمر:

```bash
python3 scripts/import-quranlab.py
```

لا تُضمَّن ملفات Parquet المؤقتة في المستودع. راجع `QURANLAB-LICENSES.md` و`QURANLAB-SOURCES.md` قبل أي إعادة توزيع.

## الروابط الرسمية

- [QuranLab Hadith](https://huggingface.co/datasets/quranlab/hadith)
- [Open-Hadith-Data](https://github.com/mhashim6/Open-Hadith-Data)
- [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/)
- [DbCL 1.0](https://opendatacommons.org/licenses/dbcl/1-0/)

هذا توثيق عملي للمشروع وليس استشارة قانونية.
