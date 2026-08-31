# تجّار المواشي — Tujjar Al-Mawashi

منصة ويب لبيع وشراء المواشي (أغنام، ماعز، إبل، أبقار، خيول، دواجن) في المملكة
العربية السعودية.

## Tech Stack

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **Backend:** Firebase (Firestore + Auth) accessed directly from the client,
  with all authorization enforced by `firestore.rules` — no separate
  Node/Express server. See "لماذا هذا الـ Stack" below for why this differs
  from the originally proposed Node/Express + MongoDB/Vercel/Render stack.
- **Auth:** Firebase Authentication — Email/Password, plus phone/OTP for the
  "forgot password" flow (Firebase Phone Authentication)
- **Cloud Functions:** the few Admin-SDK-only operations — phone/OTP password
  reset and permanent user deletion (`functions/`)
- **Hosting:** Firebase Hosting (static export, `next build` with
  `output: "export"`). Note: the single-ad page is `/ad?id=<id>` rather than
  `/ad/<id>` — a static export has no server to resolve arbitrary dynamic
  path segments at request time, so a real per-ad path (as opposed to one
  fixed at build time) isn't reliable under this hosting model. A query
  string sidesteps that limitation entirely.
- **Images:** compressed client-side (`browser-image-compression`) and
  uploaded to **Firebase Storage** (`ad-images/`, `commission-receipts/`);
  the Firestore doc only stores the download URL. See `storage.rules`.

## لماذا هذا الـ Stack

الطلب الأصلي اقترح Node/Express أو NestJS + MongoDB/Firestore + نشر على
Vercel/Render/Railway. تم تنفيذ نسخة معدّلة تعتمد فقط على Firebase للأسباب
التالية:

1. إنشاء حساب على MongoDB Atlas أو Vercel أو Render يتطلب تسجيل حساب جديد
   بكلمة مرور — وهذا إجراء لا يمكن لأي مساعد ذكاء اصطناعي القيام به نيابة
   عنك لأسباب أمنية.
2. حساب Firebase الحالي مُفعّل ومُصادق عليه مسبقًا (نفس الحساب المستخدم في
   مشروع PPM Maintenance)، مما سمح بإنشاء المشروع ونشره فعليًا وتشغيله بشكل
   كامل ضمن هذه الجلسة دون انتظار أي إجراء يدوي إضافي (باستثناء خطوتين تفعيل
   لمرة واحدة من الكونسول: Firestore API و Authentication).
3. Firestore Security Rules تقوم بدور "الـ Backend" في فرض الصلاحيات
   (Manager/User/Admin وغيرها)، بنفس الأسلوب الذي أثبت نجاحه في مشروع PPM.
4. لا حاجة لخادم Node منفصل طالما أن كل منطق التفويض يمكن التعبير عنه في
   قواعد Firestore؛ إضافته كان سيزيد التعقيد دون فائدة حقيقية.

## البنية (Project Structure)

```
src/
  app/                    # صفحات Next.js (App Router)
    page.tsx              # /
    ads/page.tsx           # /ads
    ad/page.tsx            # /ad?id=<id>
    add-ad/page.tsx        # /add-ad
    search/page.tsx        # /search
    profile/page.tsx       # /profile
    login/, register/      # /login  /register
    terms/page.tsx         # /terms
    dashboard/             # /dashboard/*  (محمية بـ AdminGuard)
  components/             # مكوّنات واجهة قابلة لإعادة الاستخدام
  contexts/AuthContext.tsx # حالة تسجيل الدخول + بروفايل المستخدم + الدور
  lib/                    # طبقة الوصول لـ Firestore/Storage (ads/users/storage/...)
functions/                 # Cloud Functions (Admin SDK: استعادة كلمة المرور، حذف مستخدم)
tests/                     # اختبارات firestore.rules (vitest + المُحاكي)
scripts/                   # سكربتات صيانة لمرة واحدة (ترحيل الصور، معالجة صور الأصول)
firestore.rules            # قواعد صلاحيات Firestore (RBAC)
storage.rules              # قواعد صلاحيات Firebase Storage
firestore.indexes.json     # الفهارس المركّبة المطلوبة للاستعلامات
firebase.json               # إعداد Firebase (Hosting + Firestore + Storage + Functions + المُحاكي)
```

## نظام الأدوار: owner / admin / user

- **owner (مالك النظام)**: دور واحد فقط في كامل النظام. يملك كل صلاحيات
  المشرف، بالإضافة إلى صفحة `/dashboard/admins` الحصرية لترقية/إلغاء صلاحية
  المشرفين. لا يستطيع أي مشرف عادي رؤية هذه الصفحة أو تعديل حقل `role` لأي
  حساب — القيد مفروض في الواجهة (إخفاء الرابط + إعادة توجيه) وأيضًا داخل
  `firestore.rules` نفسها، بحيث لا فائدة من تجاوز الواجهة.
- **admin (مشرف)**: إدارة الإعلانات (عدا الحذف النهائي — حصري لـ owner)، البلاغات،
  السلالات، والمناطق.
- **user (مستخدم)**: حساب عادي — إضافة/تعديل/نشر إعلاناته، والتعليق.
- **بدون تسجيل دخول**: تصفح فقط — أي محاولة تفاعل (إضافة إعلان، تعليق،
  مشاركة) تفتح نافذة تسجيل دخول/حساب جديد بدل توجيه المستخدم لصفحة أخرى.

## الأقسام (Categories)

المنصة متعددة الأقسام: المواشي (الأصلي، بحقول animalType/breed/age/weight)،
بالإضافة لخمسة أقسام عامة (أعلاف، معدات، خدمات، نقل مواشي، عروض خاصة) تستخدم
حقل `subCategory` بدل حقول المواشي التفصيلية. كلها تعيش في نفس مجموعة `ads`
بحقل `category` مميّز — راجع [`../docs/api-reference.md`](../docs/api-reference.md).

## معاينة الإعلان قبل النشر

نموذج `/add-ad` مكوّن من خطوتين: تعبئة النموذج، ثم معاينة تعرض شكل الإعلان
كما سيظهر للمستخدمين قبل تأكيد النشر فعليًا (`createAd`/`updateAd` لا تُستدعى
إلا من زر "نشر الإعلان" بشاشة المعاينة). **ملاحظة أمنية:** هذه خطوة تجربة
مستخدم (UX) فرضها التطبيق نفسه، وليست قيدًا يمكن فرضه على مستوى قواعد
Firestore — فالقواعد لا تملك وسيلة لمعرفة "هل مرّ العميل بشاشة معاينة أم لا"،
فقط تتحقق من شكل البيانات وهوية المرسل. التحقق منها كان جزءًا من الفحص الأمني.

### Admin bootstrap (خطوة لمرة واحدة)

بما أن قواعد Firestore تمنع أي مستخدم من منح نفسه أي دور أعلى عبر التسجيل
العادي، أول حساب "owner" يجب ضبطه يدويًا من Firebase Console:

1. أنشئ حسابًا عاديًا من صفحة `/register`.
2. افتح Firebase Console → Firestore Database → مجموعة `users` → المستند
   الذي يحمل الـ UID الخاص بك.
3. غيّر الحقل `role` من `"user"` إلى `"owner"` واحفظ.
4. سجّل الخروج والدخول مرة أخرى (أو أعد تحميل الصفحة) — ستظهر لك لوحة التحكم
   بكامل أقسامها بما فيها "المشرفون".

بعد ذلك، يمكن ترقية أي مستخدم آخر إلى **admin** (وليس owner) من داخل لوحة
التحكم نفسها (`/dashboard/admins`) دون الحاجة للرجوع إلى الكونسول مرة أخرى.

## التشغيل محليًا

```bash
npm install
cp .env.example .env.local
npm run dev
```

## الاختبارات

```bash
npm run test:rules     # اختبارات firestore.rules عبر المُحاكي (تحتاج Java 17)
```

تفاصيل و CI في [`../docs/testing.md`](../docs/testing.md).

## النشر

```bash
npm run build          # ينتج مجلد out/ (static export)
firebase deploy --only hosting,firestore:rules,firestore:indexes,storage,functions
```

> أول نشر بعد إضافة Storage: تأكّد من تفعيل خطة **Blaze**، وانشر
> `storage` قبل تشغيل `scripts/migrate-images-to-storage.mjs` (راجع
> [`scripts/README.md`](./scripts/README.md)).
