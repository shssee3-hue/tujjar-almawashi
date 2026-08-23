# مرجع واجهة البيانات (API Reference)

لا يوجد REST API تقليدي في هذا المشروع — الواجهة تتصل مباشرة بـ Cloud
Firestore عبر Firebase JS SDK. هذا المستند يوثّق نفس المعلومات التي يوفرها
REST API reference عادةً: شكل كل مجموعة بيانات، من يملك صلاحية القراءة/الكتابة،
والدوال الجاهزة في `frontend/src/lib/*.ts` التي تُستخدم بدل استدعاءات HTTP.

## ads

| الحقل | النوع | ملاحظات |
|---|---|---|
| category | `livestock` \| `feed` \| `equipment` \| `services` \| `transport` \| `offers` | |
| subCategory | string | فارغ لـ livestock، قيمة من `SUB_CATEGORIES` لبقية الأقسام |
| title, description | string | |
| price | number | |
| isNegotiable | boolean | |
| animalType, breed, age | string | تُملأ فقط عندما category=="livestock" |
| weight | number \| null | |
| country, region, city | string | |
| sellerId, sellerName, sellerType, sellerRating | — | مخزّنة مباشرة على الإعلان (denormalized) |
| phoneNumber, whatsapp | string | |
| showCallButton, showWhatsappButton | boolean | تتحكم بظهور زر الاتصال/واتساب للمشترين — كلاهما `false` افتراضيًا؛ الرقم لا يظهر تلقائيًا أبدًا |
| images | string[] | Data URI بصيغة base64 |
| views, reportsCount | number | |
| status | `active` \| `ended` \| `flagged` \| `deleted` | |
| featured | boolean | |
| oathAccepted | boolean | يجب أن تكون `true` عند الإنشاء — مفروضة في `firestore.rules`، راجع الملاحظة أدناه |

**الصلاحيات:** القراءة عامة. الإنشاء لأي مستخدم مسجّل (لنفسه فقط)، **وفقط إذا كانت
`oathAccepted == true`** — إقرار العمولة الإلزامي معروض للمستخدم في شاشة المعاينة
قبل زر النشر، والقاعدة ترفض أي طلب إنشاء (بما فيه استدعاء مباشر لـ Firestore API
يتجاوز الواجهة) لا يحمل هذا الحقل بقيمة `true`؛ الشرط غير مفروض على التعديل حتى
لا تُعطَّل إجراءات الإشراف (تمييز/تعليم كمخالف) على إعلانات أُنشئت قبل إضافة هذا
الحقل. التعديل (تغيير الحالة، التمييز، إلخ) لصاحب الإعلان أو أي admin/owner.
**الحذف النهائي (hard delete) حصري للـ owner فقط** — "مراجعة الإعلانات الحساسة"؛
الحذف العادي من صاحب الإعلان هو حذف ناعم (status → "deleted") عبر التعديل، ويبقى
متاحًا للجميع كالمعتاد.

"عروض خاصة" (`offers`) قسم متوقف — لم يعد قابلًا للاختيار عند إنشاء إعلان جديد
ولا يظهر في الصفحة الرئيسية أو أزرار التصفية، لكن الإعلانات القديمة بهذا التصنيف
بقيت كما هي في قاعدة البيانات ويستمر عرضها بشكل صحيح أينما فُتحت مباشرة.

**الدوال:** `createAd`, `updateAd`, `deleteAd`, `hardDeleteAd`, `getAd`, `incrementViews`, `listAds`, `listFeaturedAds`, `listAdsBySeller`, `listSimilarAds`, `listAllAdsAdmin` — في `frontend/src/lib/ads.ts`.

## users

| الحقل | النوع |
|---|---|
| name, email, phoneNumber | string |
| accountType | `individual` \| `trader` |
| role | `user` \| `admin` \| `owner` |
| rating, adsCount, reportsCount | number |
| banned | boolean |

**الصلاحيات:**
- القراءة: كل حساب يقرأ مستنده الخاص فقط، إلا **owner** فيقرأ أي حساب.
- الإنشاء: ذاتي فقط، بدور `user` إلزاميًا.
- التعديل: **owner** فقط يقدر يغيّر `role`/`banned`؛ أي حساب يقدر يعدّل بياناته الشخصية (الاسم/الجوال) بدون المساس بهذه الحقول.
- الحذف: **owner** فقط.

**الدوال:** `createUserProfile`, `getUserProfile`, `updateUserProfile`, `listAllUsersAdmin`, `setUserRole`, `setUserBanned` — في `frontend/src/lib/users.ts`.

## reports

| الحقل | النوع |
|---|---|
| adId, adTitle, reporterId, reason | string |
| status | `open` \| `closed` |

**الصلاحيات:** القراءة/التعديل/الحذف لـ admin/owner فقط. الإنشاء لأي مستخدم مسجّل (كمُبلِّغ عن نفسه).

**الدوال:** `createReport`, `listRecentReportsAdmin`, `closeReport` — في `frontend/src/lib/reports.ts`.

## breeds / regions

بيانات مرجعية (سلالات/مناطق مخصصة يضيفها المشرف بالإضافة للقيم الافتراضية
المُدمجة في `frontend/src/lib/constants.ts`). القراءة عامة، الكتابة لـ
admin/owner. الدوال في `breeds.ts` و`regions.ts`.

## settings/site

مستند واحد بإعدادات الموقع (اسم الموقع، سعر الإعلان المميز، رقم الدعم، وضع
الصيانة، ونص إقرار العمولة الإلزامي `oathText` — قابل للتعديل من
`/dashboard/oath-text`). القراءة عامة، الكتابة لـ **owner فقط**. الدوال في
`settings.ts`.

## comments

| الحقل | النوع |
|---|---|
| adId, userId, userName, text | string |
| createdAt | number |
| replyToId | string \| null، اختياري | حاضر فقط على رد؛ الواجهة تعرض زر "رد" فقط لصاحب الإعلان (البائع)، لكن هذا اصطلاح واجهة لا قيد صلاحيات — أي مستخدم مسجّل يقدر أصلًا ينشئ تعليقًا جذريًا |
| hidden | boolean، اختياري | تبديل إشراف — التعليقات المخفية تُستثنى من عرض الزوار العاديين وتبقى ظاهرة للمشرف لمراجعتها |

**الصلاحيات:** القراءة عامة. الإنشاء لأي مستخدم مسجّل (باسمه فقط، `userId == auth.uid`).
الحذف لصاحب التعليق أو admin/owner فقط — **صاحب الإعلان لا يملك صلاحية حذف تعليقات
الآخرين على إعلانه** حتى لو لم يكن هو من كتبها. التعديل الوحيد المسموح به هو تبديل
حقل `hidden` من admin/owner فقط (`request.resource.data.diff(resource.data).affectedKeys().hasOnly(["hidden"])`)
— نص التعليق وصاحبه لا يمكن تغييرهما أبدًا بعد النشر.

**الدوال:** `createComment`, `listComments`, `listCommentsForAds`, `setCommentHidden`, `deleteComment` — في `frontend/src/lib/comments.ts`.

## ratings

| الحقل | النوع |
|---|---|
| adId, userId | string |
| value | number (1–5) |
| createdAt | number |

معرّف المستند دائمًا `${adId}_${userId}` — تقييم واحد فقط لكل مستخدم لكل إعلان (upsert
عند إعادة التقييم). المتوسط يُحسب من جهة العميل بجمع كل تقييمات الإعلان، ولا يمسّ
مستند الإعلان نفسه أو ملف المستخدم — تفاديًا لتوسيع صلاحيات الكتابة على مجموعتي
`ads`/`users` المُحكمتين أصلًا.

**الصلاحيات:** القراءة عامة. الإنشاء/التعديل لصاحب التقييم فقط (`userId == auth.uid`
ومعرّف المستند مطابق)، **وبشرط ألا يكون صاحب التقييم هو نفسه بائع الإعلان** (القاعدة
تتحقق من ذلك مباشرة عبر `get()` على مستند الإعلان). الحذف لصاحب التقييم أو admin/owner.

**الدوال:** `submitRating`, `getMyRating`, `listRatings`, `getAverageRating` — في `frontend/src/lib/ratings.ts`.

## المصادقة (Auth)

Firebase Authentication — Email/Password. الدوال: `registerUser`, `loginUser`,
`authErrorMessage` في `frontend/src/lib/auth.ts`.
