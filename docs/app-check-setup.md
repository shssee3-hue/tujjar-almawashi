# App Check — إعداد وتفعيل

App Check يتحقّق أن الطلبات قادمة من تطبيق الويب الحقيقي قبل أن تخدمها
Firebase، فيمنع السكربتات والبوتات من استخدام Firestore وAuth مباشرة (إنشاء
حسابات وهمية، نشر إعلانات مزعجة، كشط البيانات).

**لا يتطلب خطة Blaze** — يعمل على الخطة المجانية (Spark).

## 1. كود الواجهة (منفّذ)

`frontend/src/lib/firebase.ts` يُهيّئ App Check تلقائيًا عند وجود مفتاح
reCAPTCHA v3 في متغيّر البيئة `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY`. إن
كان فارغًا، لا يُفعَّل App Check (مفيد للتطوير المحلي بلا مفتاح).

## 2. إنشاء مفتاح reCAPTCHA v3

1. افتح <https://www.google.com/recaptcha/admin/create>.
2. النوع: **reCAPTCHA v3**. أضِف النطاقات: `tujjar-almawashi.web.app`،
   `tujjar-almawashi.firebaseapp.com`، ونطاق Cloudflare Pages، و`localhost`.
3. انسخ **Site key** (المفتاح العام) — هذا ما يُوضع في متغيّر البيئة.
   (الـ Secret key غير مستخدم في العميل.)

## 3. تسجيل التطبيق في Firebase Console

1. Firebase Console ← **App Check** ← تبويب **Apps**.
2. اختر تطبيق الويب ← **reCAPTCHA v3** ← الصق الـ Site key ← حفظ.

## 4. ضبط متغيّر البيئة

في بيئة النشر (Cloudflare Pages / Firebase Hosting) وفي `.env.local` محليًا:

```
NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY=<reCAPTCHA v3 site key>
```

أعِد النشر بعد الإضافة.

## 5. التطوير المحلي (debug token)

App Check يفشل على `localhost` بلا إعداد. الحل:

1. شغّل التطبيق مرة، وافتح Console في المتصفح — ستجد رسالة فيها
   **debug token**.
2. Firebase Console ← App Check ← Apps ← ⋮ ← **Manage debug tokens** ←
   أضِف القيمة.

أو مرّر التوكن عبر `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN` في
`.env.local` فقط (لا تضعه في النشر إطلاقًا).

## 6. الفرض (Enforcement) — خطوة الكونسول

تفعيل الكود وحده **لا يمنع** أحدًا؛ الفرض يتم من الكونسول لكل خدمة:

1. Firebase Console ← App Check ← تبويب **APIs**.
2. راقب نسبة الطلبات «المتحقَّقة» أول 24–48 ساعة بعد النشر (تأكّد أنها
   قرب 100% من مستخدمين حقيقيين).
3. فعّل **Enforce** لكل من:
   - **Cloud Firestore**
   - **Authentication**

بعد الفرض، أي طلب بلا توكن App Check صالح يُرفض بـ `permission-denied`.

## 7. اختبار ما بعد التفعيل

- تسجيل حساب جديد + تسجيل دخول.
- إضافة إعلان جديد ورفع صورة.
- فتح صفحة إعلان كزائر (قراءة عامة) وكمستخدم مسجّل (قراءة `adsPrivate`).
- تقديم بلاغ.
- «تم البيع» ورفع إيصال.

راجع أيضًا [`architecture.md`](./architecture.md) و[`api-reference.md`](./api-reference.md).
