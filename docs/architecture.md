# البنية التقنية (Architecture)

## نظرة عامة

تجّار المواشي تطبيق ويب من نوع **Frontend فقط + Backend-as-a-Service**، بدون
خادم Node/Express خاص. Next.js (كتصدير ثابت/Static Export) يتصل مباشرة بـ
Firebase من المتصفح، وقواعد Firestore Security Rules تفرض كل التفويض.

```
المتصفح
  │
  ├─ Firebase Auth (Email/Password + التحقق بالجوال OTP)
  ├─ Cloud Firestore (البيانات + قواعد RBAC)
  ├─ Firebase Storage (صور الإعلانات وإيصالات العمولة)
  ├─ Cloud Functions (عمليات Admin SDK: استعادة كلمة المرور، حذف مستخدم،
  │                    وحساب تقييم البائع)
  └─ Firebase Hosting (تصدير Next.js الثابت)
```

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

## تخزين الصور

الصور تُضغط من جهة المتصفح (`browser-image-compression` → JPEG صغير) ثم
تُرفع إلى **Firebase Storage**، ولا يُخزَّن في مستند Firestore سوى رابط
التنزيل. المسارات (راجع [`../frontend/storage.rules`](../frontend/storage.rules)):

| المسار | المحتوى | القراءة | الكتابة |
|---|---|---|---|
| `ad-images/{uid}/…` | صور إعلانات البائع | عامة | صاحب `uid` فقط، صور ≤ 2MB |
| `commission-receipts/{uid}/…` | إيصالات دفع «تم البيع» | صاحب `uid` (المشرف يفتح الرابط المُوقَّع المخزَّن على المستند) | صاحب `uid` فقط |

> الإعلانات القديمة كانت تخزّن الصور كـ Base64 Data URI داخل المستند نفسه؛
> سكربت `frontend/scripts/migrate-images-to-storage.mjs` ينقلها لمرة واحدة.

## تصفّح الإعلانات

`listAds()` في [`../frontend/src/lib/ads.ts`](../frontend/src/lib/ads.ts)
يفلتر من جهة الخادم بالقسم (`category`/`animalType`) والمنطقة ويُرقّم النتائج
بمؤشّر (`startAfter` + `limit`, 12 لكل صفحة) بدل جلب كل الإعلانات النشطة
وفلترتها في المتصفح. الفهارس المركّبة اللازمة في
[`../frontend/firestore.indexes.json`](../frontend/firestore.indexes.json).
حقلا `breed`/`subCategory` يبقيان فلترة داخل الصفحة المجلوبة فقط.

## تقييم البائع

كل تقييم مستند في `ratings/{adId}_{userId}`. دالة `recomputeSellerRating`
(مُشغَّل Firestore على `ratings/{ratingId}`) تعيد حساب متوسط تقييمات كل
إعلانات البائع وتكتبه في `users/{sellerId}.rating` (+ `ratingCount`) وتُظلّله
على `sellerRating` في كل إعلاناته. هذه الحقول لا يكتبها أحد غير الدالة —
القواعد تثبّتها على 0 عند الإنشاء وتمنع البائع من تعديلها.

## الاستضافة

- **Frontend:** Firebase Hosting، تصدير ثابت (`next build` مع `output: "export"`).
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
