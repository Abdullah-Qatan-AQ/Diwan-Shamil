# Android Release Automation

يتم بناء APK موقّع تلقائيًا عند كل Push إلى `main`. يزيد Workflow `versionCode` بمقدار واحد، ثم يبحث في Tags الموجودة عن أول رقم Patch مفقود ضمن نفس السلسلة. مثلًا، إذا كانت `v1.0.0` و`v1.0.2` موجودتين، فسيستخدم `v1.0.1` بدل القفز إلى `v1.0.3`. بعد ذلك ينشئ Commit وTag، ثم ينشئ **مسودة GitHub Release** ويُرفق APK الموقّع بها. تبقى المسودة غير منشورة حتى تضيف الوصف وتضغط نشر يدويًا.

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

لا تحتاج إلى تنفيذ أي أوامر خاصة. عند دفع أي تغيير إلى الفرع `main`، يقوم Workflow `.github/workflows/android-release.yml` تلقائيًا بتثبيت الاعتماديات، وزيادة رقم الإصدار، وإنشاء Commit وTag، واستعادة keystore، وبناء APK موقّع، والتحقق من التوقيع، ورفع Artifact، وإنشاء **مسودة GitHub Release** وإرفاق APK بها. بعد ذلك أضف وصف الإصدار من صفحة المسودة واضغط **Publish release** لنشره.

يفشل Workflow إذا كانت الأسرار ناقصة، أو إذا تعذر إنشاء Commit أو Tag، أو إذا فشل بناء APK أو التحقق من توقيعه. تشغيله يدويًا من GitHub Actions ينشئ إصدارًا جديدًا أيضًا.

## الحماية

يفضل تفعيل Required reviewers على Environment `production` حتى لا تُنشر إصدارات رسمية إلا بعد مراجعة. لا تستخدم الأسرار في Pull Requests من Forks، ولا تطبع قيمها في سجلات Workflow.

## التحقق من التوقيع

يعرض سجل Workflow نتيجة `apksigner verify --verbose` وبصمة الشهادة. يجب أن تبقى بصمة الشهادة نفسها بين الإصدارات؛ تغييرها يعني استخدام مفتاح مختلف ولن يتمكن Android من تحديث النسخة المثبتة كتحديث عادي.
