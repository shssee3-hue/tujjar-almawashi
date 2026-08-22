# تجّار المواشي — Tujjar Al-Mawashi

منصة ويب لبيع وشراء المواشي (أغنام، ماعز، إبل، أبقار، خيول، دواجن) في السعودية
ودول الخليج.

## Tech Stack

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **Backend:** Firebase (Firestore + Auth) accessed directly from the client,
  with all authorization enforced by `firestore.rules` — no separate
  Node/Express server. See "لماذا هذا الـ Stack" below for why this differs
  from the originally proposed Node/Express + MongoDB/Vercel/Render stack.
- **Auth:** Firebase Authentication, Email/Password provider
- **Hosting:** Firebase Hosting (static export, `next build` with
  `output: "export"`). Note: the single-ad page is `/ad?id=<id>` rather than
  `/ad/<id>` — a static export has no server to resolve arbitrary dynamic
  path segments at request time, so a real per-ad path (as opposed to one
  fixed at build time) isn't reliable under this hosting model. A query
  string sidesteps that limitation entirely.
- **Images:** compressed client-side (`browser-image-compression`) and stored
  as base64 data URLs directly on the `ads` document — no Cloud Storage, so
  no Blaze/billing plan is required.

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
  lib/                    # طبقة الوصول لـ Firestore (ads/users/reports/...)
firestore.rules            # قواعد الصلاحيات (RBAC)
firestore.indexes.json     # الفهارس المركّبة المطلوبة للاستعلامات
firebase.json               # إعداد Firebase Hosting (تصدير ثابت)
```

## نظام الأدوار: owner / admin / user

- **owner (مالك النظام)**: دور واحد فقط في كامل النظام. يملك كل صلاحيات
  المشرف، بالإضافة إلى صفحة `/dashboard/admins` الحصرية لترقية/إلغاء صلاحية
  المشرفين. لا يستطيع أي مشرف عادي رؤية هذه الصفحة أو تعديل حقل `role` لأي
  حساب — القيد مفروض في الواجهة (إخفاء الرابط + إعادة توجيه) وأيضًا داخل
  `firestore.rules` نفسها، بحيث لا فائدة من تجاوز الواجهة.
- **admin (مشرف)**: كل صلاحيات لوحة التحكم عدا إدارة المشرفين.
- **user (مستخدم)**: حساب عادي.

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

## النشر

```bash
npm run build          # ينتج مجلد out/ (static export)
firebase deploy --only hosting,firestore
```
