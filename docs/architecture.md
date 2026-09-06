# البنية التقنية (Architecture)

## نظرة عامة

تجّار المواشي تطبيق ويب من نوع **Frontend فقط + Backend-as-a-Service**، بدون
خادم Node/Express خاص. Next.js (كتصدير ثابت/Static Export) يتصل مباشرة بـ
Firebase من المتصفح، وقواعد Firestore Security Rules تفرض كل التفويض.

```
المتصفح
  │
  ├─ Firebase App Check (reCAPTCHA v3) — يمنع استخدام الواجهات من غير التطبيق
  ├─ Firebase Auth (Email/Password؛ استعادة كلمة المرور عبر رابط بريد)
  ├─ Cloud Firestore (البيانات + قواعد RBAC، والصور كـ Base64 داخل المستند)
  └─ الاستضافة: Cloudflare Pages (تصدير Next.js الثابت، نشر تلقائي من GitHub)
```

> المشروع على خطة Firebase **المجانية (Spark)**. Firebase Storage و Cloud
> Functions يتطلبان خطة Blaze ولا يُستخدمان — راجع
> [`cloud-functions-setup.md`](./cloud-functions-setup.md). كود `functions/`
> باقٍ في المستودع لترقية مستقبلية محتملة لكنه غير منشور.

## لماذا بدون Backend منفصل؟

راجع قسم "لماذا هذا الـ Stack" في
[`../frontend/README.md`](../frontend/README.md). الملخص: لا حاجة لخادم Node
طالما أن كل منطق التفويض يمكن التعبير عنه داخل `firestore.rules`، وإضافته
كانت ستزيد التعقيد دون فائدة حقيقية — كما أن حسابات الاستضافة البديلة
(Vercel/Render/MongoDB Atlas) تتطلب تسجيل حسابات جديدة لا يمكن تنفيذها آليًا.

## نظام الأدوار (RBAC)

ثلاثة أدوار مخزّنة بحقل `role` في مستند كل مستخدم:

| الدور | الوصف |
|---|---|
| `owner` | مالك النظام — واحد فقط في كامل النظام. كل صلاحيات admin، بالإضافة لإدارة المشرفين والمستخدمين وإعدادات الموقع حصريًا. |
| `admin` | مشرف — إدارة الإعلانات والبلاغات والسلالات والمناطق. |
| `user` | مستخدم عادي — إنشاء/تعديل/حذف إعلاناته الخاصة، تقديم بلاغات. |

كل قيد مفروض على مستويين مستقلين:
1. **الواجهة (React):** `AdminGuard` و`OwnerGuard` يمنعان عرض أي محتوى إداري ويعيدان التوجيه لغير المصرّح لهم.
2. **قاعدة البيانات (`firestore.rules`):** نفس القيود مكرّرة هناك، بحيث تجاوز الواجهة (طلب API مباشر) لا يمنح أي صلاحية إضافية. تم فحص هذا فعليًا — راجع تقرير الفحص الأمني في المحادثة.

## نماذج البيانات (Firestore Collections)

راجع [`api-reference.md`](./api-reference.md) للتفاصيل الكاملة لكل مجموعة
(`ads`, `users`, `reports`, `breeds`, `regions`, `settings`).

## أرقام تواصل البائع

أرقام الهاتف والواتساب **ليست** على مستند الإعلان العام (`ads/{adId}` قراءته
عامة، فكانت الأرقام قابلة للكشط عبر SDK). نُقلت إلى `adsPrivate/{adId}`
المحميّة: لا يقرؤها زائر غير مسجّل إطلاقًا، ولا يقرؤها مستخدم مسجّل إلا إذا
فعّل البائع زر تواصل. راجع [`api-reference.md`](./api-reference.md#adsprivate).

## App Check

`frontend/src/lib/firebase.ts` يُهيّئ Firebase App Check (reCAPTCHA v3) عند
ضبط `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY` — يمنع السكربتات من استخدام
Firestore/Auth. الفرض يُفعَّل من الكونسول. خطوات الإعداد الكاملة في
[`app-check-setup.md`](./app-check-setup.md). لا يتطلب خطة Blaze.

## تخزين الصور

الصور (صور الإعلانات وإيصالات «تم البيع») تُضغط من جهة المتصفح
(`browser-image-compression` → JPEG صغير ≤ 0.35MB) وتُخزَّن كـ **Base64 Data
URI مباشرة داخل مستند Firestore**. Firebase Storage كان سيتجنّب تضخّم المستند
لكنه يتطلب خطة Blaze غير المستخدمة هنا. الضغط في
[`../frontend/src/lib/image.ts`](../frontend/src/lib/image.ts).

## تصفّح الإعلانات

`listAds()` في [`../frontend/src/lib/ads.ts`](../frontend/src/lib/ads.ts)
يفلتر من جهة الخادم بالقسم (`category`/`animalType`) والمنطقة ويُرقّم النتائج
بمؤشّر (`startAfter` + `limit`, 12 لكل صفحة) بدل جلب كل الإعلانات النشطة
وفلترتها في المتصفح. الفهارس المركّبة اللازمة في
[`../frontend/firestore.indexes.json`](../frontend/firestore.indexes.json).
حقلا `breed`/`subCategory` يبقيان فلترة داخل الصفحة المجلوبة فقط.

النطاق الجغرافي: **السعودية فقط**. حقل `country` باقٍ على نموذج الإعلان
(وقائمة `COUNTRIES` تحوي `السعودية` وحدها) حتى تُعرَض الإعلانات القديمة من
دول الخليج، لكن الإعلانات الجديدة لا يمكن أن تكون إلا `السعودية`.

## التقييم

ميزة تقييم الإعلان/البائع **ملغاة**. مجموعة `ratings` مغلقة بالكامل في
القواعد (`allow read, write: if false`)، ولا واجهة ولا دوال تتعامل معها؛ أي
مستندات تقييم قديمة في Firestore خاملة.

## الاستضافة

- **Frontend:** Cloudflare Pages (الاستضافة الوحيدة)، تصدير ثابت (`next build` مع `output: "export"`). Firebase Hosting أُلغي — راجع [`cloudflare-pages-setup.md`](./cloudflare-pages-setup.md).
- **صفحة الإعلان المفرد** بمسار `/ad?id=<id>` (وليس `/ad/<id>`) — لأن التصدير
  الثابت لا يملك خادمًا لحل مسارات ديناميكية حقيقية عند الطلب؛ سلسلة استعلام
  (query string) تتفاداها بالكامل.

## المخطط البصري

```
┌─────────────────────────────────────────────┐
│                  Next.js (static)             │
│  Pages: / /ads /ad /add-ad /profile /login    │
│  /register /terms /privacy /about /dashboard/* │
└───────────────┬───────────────────────────────┘
                │  Firebase JS SDK
                ▼
┌─────────────────────────────────────────────┐
│              Firebase Auth                    │
│              Cloud Firestore + Rules           │
└─────────────────────────────────────────────┘
```
