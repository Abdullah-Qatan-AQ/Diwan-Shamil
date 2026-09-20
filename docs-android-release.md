# Android Release Automation

يتم بناء APK موقّع تلقائيًا عند دفع Git tag يطابق رقم إصدار التطبيق، مثل `v1.0.4`. أما Push العادي إلى `main` فيستمر بنشر نسخة الويب عبر Workflow الخاص بـ GitHub Pages ولا ينشئ Release Android.

## أسرار GitHub المطلوبة

أنشئ Environment باسم `production` من إعدادات المستودع، ثم أضف الأسرار التالية تحت **Secrets**:

| الاسم | القيمة |
|---|---|
| `DIWAN_RELEASE_KEYSTORE_B64` | ملف keystore كاملًا بعد تحويله إلى Base64، دون أسطر جديدة |
| `DIWAN_RELEASE_STORE_PASSWORD` | كلمة مرور keystore |
| `DIWAN_RELEASE_KEY_ALIAS` | اسم alias للمفتاح داخل keystore |
| `DIWAN_RELEASE_KEY_PASSWORD` | كلمة مرور المفتاح داخل keystore |

لا تضع ملف keystore أو كلمات المرور داخل Git. ملف keystore يبقى خارج المستودع، ويُستعاد مؤقتًا على GitHub Actions ثم يُحذف بعد انتهاء المهمة.

لتحويل الملف إلى Base64:

```bash
base64 -w 0 diwan-shamil-release > diwan-shamil-release.base64
```

انسخ محتوى `diwan-shamil-release.base64` إلى `DIWAN_RELEASE_KEYSTORE_B64` ثم احذف الملف المؤقت.

## إصدار جديد

1. حدّث `versionCode` إلى رقم أكبر من الإصدار السابق، وحدّث `versionName` في `android/app/build.gradle`.
2. أنشئ Tag مطابقًا تمامًا لـ `versionName`، مثل:

```bash
git tag v1.0.4
git push origin v1.0.4
```

3. سيقوم Workflow `.github/workflows/android-release.yml` بتثبيت الاعتماديات، واستعادة keystore، وبناء APK موقّع، والتحقق من التوقيع، ورفع Artifact، وإنشاء GitHub Release وإرفاق APK به.

يفشل Workflow عمدًا إذا كان اسم الـ tag لا يطابق `versionName`، أو إذا كانت الأسرار ناقصة، أو إذا فشل التحقق من توقيع APK.

## الحماية

يفضل تفعيل Required reviewers على Environment `production` حتى لا تُنشر إصدارات رسمية إلا بعد مراجعة. لا تستخدم الأسرار في Pull Requests من Forks، ولا تطبع قيمها في سجلات Workflow.

## التحقق من التوقيع

يعرض سجل Workflow نتيجة `apksigner verify --verbose` وبصمة الشهادة. يجب أن تبقى بصمة الشهادة نفسها بين الإصدارات؛ تغييرها يعني استخدام مفتاح مختلف ولن يتمكن Android من تحديث النسخة المثبتة كتحديث عادي.
