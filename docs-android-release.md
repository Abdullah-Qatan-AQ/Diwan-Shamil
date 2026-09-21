# إصدار Android يدويًا

لا ينشر هذا المستودع APK تلقائيًا ولا ينشئ GitHub Releases أو Artifacts عند كل تغيير. هذا مقصود حتى لا تظهر نسخ تطويرية للمستخدمين، وحتى يقرر مالك المشروع متى وأين ينشر الإصدار النهائي.

## المتطلبات

ثبّت Node.js، وJDK 21، وAndroid SDK Platform 35، ثم تأكد من أن `ANDROID_HOME` أو `ANDROID_SDK_ROOT` يشير إلى مسار Android SDK الصحيح. لا تُضمَّن ملفات SDK المحلية أو `local.properties` في Git.

## بناء نسخة Debug محلية

```bash
npm ci
npm run android:build
```

ينشئ الأمر `android/app/build/outputs/apk/debug/app-debug.apk`. هذه النسخة للاختبار المحلي فقط ولا تُرفع إلى المستودع.

## بناء نسخة Release موقعة

احتفظ بملف keystore خارج المستودع، ثم عرّف المتغيرات التالية في جلسة البناء فقط:

| المتغير | الغرض |
|---|---|
| `DIWAN_RELEASE_STORE_FILE` | المسار المحلي لملف keystore |
| `DIWAN_RELEASE_STORE_PASSWORD` | كلمة مرور keystore |
| `DIWAN_RELEASE_KEY_ALIAS` | اسم alias للمفتاح |
| `DIWAN_RELEASE_KEY_PASSWORD` | كلمة مرور المفتاح |

بعد ذلك شغّل:

```bash
./scripts/build-release.sh
```

تحقق من توقيع APK قبل توزيعه باستخدام `apksigner verify --verbose`. لا تطبع كلمات المرور أو مسار المفتاح في سجلات عامة، ولا تحفظ ملف keystore أو أي ملف أسرار داخل Git.

## قائمة مراجعة قبل النشر

حدّث `versionCode` و`versionName` يدويًا، شغّل `npm run verify`، تحقق من JSON ومصادر البيانات، اختبر APK على جهاز أو محاكي، راجع إشعارات الرخص داخل `data/`، ثم أنشئ Release واحدًا بوصف واضح عند اتخاذ قرار النشر. لا تُنشئ مسودات متعددة ولا ترفع APK كـ workflow artifact دائم.

تظل رخصة MIT خاصة بكود التطبيق فقط، بينما تبقى شروط ODbL وDbCL ومصادر البيانات الخارجية نافذة على قواعد البيانات ومشتقاتها. راجع `README.md` وملفات `data/*LICENSE*` و`data/*SOURCES*` قبل كل توزيع.
