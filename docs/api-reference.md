# مرجع واجهة البيانات (API Reference)

لا يوجد REST API تقليدي في هذا المشروع — الواجهة تتصل مباشرة بـ Cloud
Firestore عبر Firebase JS SDK. هذا المستند يوثّق نفس المعلومات التي يوفرها
REST API reference عادةً: شكل كل مجموعة بيانات، من يملك صلاحية القراءة/الكتابة،
والدوال الجاهزة في `frontend/src/lib/*.ts` التي تُستخدم بدل استدعاءات HTTP.

## ads

| الحقل | النوع | ملاحظات |
|---|---|---|
| category | `livestock` \| `feed` \| `equipment` \| `services` \| `transport` \| `offers` | |
| subCategory | string | فارغ لـ livestock؛ لبقية الأقسام قيمة من `SUB_CATEGORIES`، أو نص حر كتبه المستخدم عبر خيار "أخرى" في نموذج الإضافة (غير قابل للتصفية بالبحث عمدًا) |
| title, description | string | إلزاميان |
| price | number | اختياري — `0` يعني "السعر عند الاتصال" في الواجهة |
| isNegotiable | boolean | |
| animalType, breed, age | string | تُملأ فقط عندما category=="livestock" |
| weight | number \| null | |
| country, region | string | إلزاميان |
| city | string | اختياري |
| sellerId, sellerName, sellerType, sellerRating | — | مخزّنة مباشرة على الإعلان (denormalized) |
| phoneNumber, whatsapp | string | |
| showCallButton, showWhatsappButton | boolean | تتحكم بظهور زر الاتصال/واتساب للمشترين — كلاهما `false` افتراضيًا؛ الرقم لا يظهر تلقائيًا أبدًا |
| images | string[] | Data URI بصيغة base64 |
| views, reportsCount | number | |
| status | `active` \| `ended` \| `flagged` \| `deleted` | |
| featured | boolean | |
| oathAccepted | boolean | يجب أن تكون `true` عند الإنشاء — مفروضة في `firestore.rules`، راجع الملاحظة أدناه |

**الصلاحيات:** القراءة عامة.

**الإنشاء** لأي مستخدم مسجّل (لنفسه فقط)، وفقط إذا كانت `oathAccepted == true`
(إقرار العمولة الإلزامي)، و`views`/`reportsCount` تساوي 0، و`featured` غائب أو
`false`، و`sellerName`/`sellerType`/`sellerRating` مطابقة فعليًا لملفه الشخصي —
كل هذا يمنع استدعاء مباشر لـ Firestore API (متجاوزًا `createAd()`) من إنشاء
إعلان "مميز" مجانًا، أو بعدد مشاهدات/بلاغات مزيّف، أو منتحلاً اسمًا أو صفة تاجر
أو تقييمًا لا يملكه صاحبه فعليًا.

**التعديل:** صاحب الإعلان يقدر يعدّل محتوى إعلانه بحرية (العنوان، السعر، الصور،
إلخ)، لكن لا يقدر يغيّر `featured`/`reportsCount`/`views` إطلاقًا، ولا يقدر يغيّر
`status` إلا إلى `"deleted"` (حذفه الذاتي الناعم) أو `"ended"` (تُضبط تلقائيًا من
`SaleConfirmationModal` عند تأكيد "تم البيع" — راجع قسم `commissions` أدناه) — لا
يقدر مثلاً يُرجع إعلانه من `"flagged"` إلى `"active"` بنفسه ليتحايل على قرار إشراف.
admin/owner معفيّون من
هذا القيد بالكامل (`isAdmin()` يمرّ أولًا). بالإضافة لذلك، **أي شخص** (حتى غير
مسجّل دخول) يقدر يزيد `views` تحديدًا بمقدار +1 بالضبط ولا شيء غيره — هذا ما
يشغّل عداد المشاهدات العام في `incrementViews()`؛ ملاحظة: `featured` قد يكون
غائبًا تمامًا من مستندات قديمة، فالمقارنة تستخدم `.get("featured", false)` بدل
الوصول المباشر (`.featured`) الذي يرمي خطأً ويرفض القاعدة كاملة إن كان الحقل
غير موجود.

**الحذف النهائي (hard delete) حصري للـ owner فقط** — "مراجعة الإعلانات الحساسة".

"عروض خاصة" (`offers`) قسم متوقف — لم يعد قابلًا للاختيار عند إنشاء إعلان جديد
ولا يظهر في الصفحة الرئيسية أو أزرار التصفية، لكن الإعلانات القديمة بهذا التصنيف
بقيت كما هي في قاعدة البيانات ويستمر عرضها بشكل صحيح أينما فُتحت مباشرة.

**الحقول الإلزامية في نموذج الإضافة/التعديل** (تحقق على مستوى الواجهة، وليس
قواعد Firestore التي لم تفرض هذا أصلًا): القسم، عنوان الإعلان، نوع الحيوان/
التصنيف الفرعي، الوصف، المنطقة، رقم التواصل. البقية (العمر، السعر، المدينة،
رقم الواتساب، السلالة) اختيارية.

**نظام البحث** يعتمد حصرًا على القسم + المنطقة + "المسمى" (السلالة لصفحات نوع
الحيوان، أو التصنيف الفرعي لبقية الأقسام) — لا بحث نصي حر ولا ترتيب اختياري
ولا نطاق سعري؛ `listAds()` في `frontend/src/lib/ads.ts` يعكس هذا (لا معاملات
`q`/`sort`/`minPrice`/`maxPrice`/`city` بعد الآن). الصفحة الرئيسية لا تعرض أي
إعلانات — فقط الأقسام ومربع بحث (قسم + منطقة) ينقل مباشرة إلى `/ads`.

**قفل حقل القسم داخل صفحة قسم محدَّد:** عند الوصول لـ `/ads` عبر رابط يحمل
`animalType` أو `category` (كما يحدث من الصفحة الرئيسية أو أي بطاقة قسم)، حقل
"القسم" في شريط البحث يُقفل تلقائيًا على القسم الحالي فقط (`disabled`، ويعرض
خيارًا واحدًا هو القسم الحالي) — لا يمكن للمستخدم تصفّح كل الأقسام من هناك.
المنطقة و"المسمى" (السلالة/التصنيف الفرعي) يبقيان قابلين للتغيير، والمسمى
مبني ديناميكيًا من خيارات هذا القسم تحديدًا. أما `/ads` بدون أي معامل قسم
("تصفح الإعلانات" العامة) فتعرض شريط بحث كامل غير مُقفل: كل الأقسام، كل
المناطق، وكل المسميات. المنطق في `AdsExplorer.tsx` (متغيّر `locked`، مبني من
وجود `animalType`/`category` في `window.location.search`).

**الدوال:** `createAd`, `updateAd`, `deleteAd`, `hardDeleteAd`, `getAd`, `incrementViews`, `listAds`, `listFeaturedAds`, `listAdsBySeller`, `listSimilarAds`, `listAllAdsAdmin` — في `frontend/src/lib/ads.ts`.

## users

| الحقل | النوع |
|---|---|
| name, email, phoneNumber | string |
| accountType | `individual` \| `trader` |
| role | `user` \| `admin` \| `owner` |
| rating, adsCount, reportsCount | number |
| banned | boolean، اختياري | غائب حتى يضبطه admin عبر `setUserBanned` — القاعدة تقارنه بـ `.get("banned", false)` وليس الوصول المباشر، وإلا يرمي خطأ ويرفض تعديل الحساب لكل من لم يُحظر قط |

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

## breeds / regions / additionalServices

بيانات مرجعية (سلالات/مناطق/خدمات إضافية مخصصة يضيفها المشرف بالإضافة للقيم
الافتراضية المُدمجة في `frontend/src/lib/constants.ts`). القراءة عامة، الكتابة
لـ admin/owner. الدوال في `breeds.ts`، `regions.ts`، و`services.ts`.

`additionalServices` هو نظير `breeds` لكن للأقسام الأربعة غير المتعلقة
بالمواشي (تصنيف فرعي بدل نوع حيوان) — يُدار من `/dashboard/services`. **كلا
المجموعتين مقروءتان ديناميكيًا** من `AdsExplorer` (شريط البحث في `/ads`)
ونموذج `add-ad`، لا فقط من صفحة الإدارة نفسها — أي إضافة يجريها المشرف تظهر
فورًا في قوائم "المسمى/السلالة" لكل مستخدم دون الحاجة لإعادة نشر الموقع.

## settings/site

مستند واحد بإعدادات الموقع (اسم الموقع، سعر الإعلان المميز، رقم الدعم، وضع
الصيانة، ونص إقرار العمولة الإلزامي `oathText` — قابل للتعديل من
`/dashboard/oath-text`). القراءة عامة، الكتابة لـ **owner فقط**. الدوال في
`settings.ts`.

**حقول نظام العمولة (`commissionRate`, `commissionText`, `bankAccountNumber`,
`applePayLink`)** أُضيفت لنفس المستند — قابلة للتعديل من `/dashboard/settings`
("نظام العمولة"):

| الحقل | النوع | ملاحظات |
|---|---|---|
| commissionRate | number | نسبة مئوية (افتراضيًا `1.5`)، تُستخدم لحساب `commissionAmount` تلقائيًا عند "تم البيع" |
| commissionText | string | النص القانوني المعروض في نموذج "تم البيع" وعلى صفحة دفع العمولة؛ القيمة الافتراضية هي الصيغة القانونية المعتمدة التي زوّدنا بها صاحب المشروع |
| bankAccountNumber | string | رقم الحساب البنكي المعروض عند اختيار "تحويل بنكي"؛ فارغ افتراضيًا (تظهر رسالة "لم يضبط المدير..." للبائع حتى يُضبط) |
| applePayLink | string | رابط الدفع عبر Apple Pay؛ نفس السلوك عند الفراغ |

## commissions

تُنشأ تلقائيًا عند ضغط البائع على "✅ تم البيع" في صفحة إعلانه (زر يظهر فقط
لصاحب الإعلان و`status == "active"`) عبر `SaleConfirmationModal` — يفتح نموذج
"تأكيد البيع" (`frontend/src/components/SaleConfirmationModal.tsx`)، وعند
الإرسال ينشئ مستند `commissions` **ثم** يضبط `ads/{adId}.status = "ended"`.

| الحقل | النوع | ملاحظات |
|---|---|---|
| adId, adTitle | string | |
| sellerId, sellerName | string | مأخوذة من الإعلان نفسه، لا من مدخلات حرة |
| saleAmount | number | يُدخلها البائع — قيمة البيع الفعلية |
| commissionRate | number | نسخة من `settings/site.commissionRate` وقت الإنشاء (تُجمَّد على المستند، فلا يتغيّر احتساب عمولة قديمة لو عدّل المدير النسبة لاحقًا) |
| commissionAmount | number | `saleAmount * commissionRate / 100`، محسوبة في الواجهة |
| paymentMethod | `applepay` \| `bank` | |
| receiptFile | string | إيصال الدفع، Data URI بصيغة base64 (نفس أسلوب `images` في `ads` — لا Cloud Storage) |
| status | `pending` \| `approved` \| `rejected` | `pending` إلزاميًا عند الإنشاء |
| createdAt | number | |
| reviewedAt | number، اختياري | تُضبط من admin/owner عند تغيير الحالة |

**الصلاحيات:**
- **القراءة:** admin/owner، أو البائع صاحب العمولة (`sellerId == auth.uid`) لسجله فقط.
- **الإنشاء:** أي مستخدم مسجّل، لكن فقط إن كان `sellerId == auth.uid` **و**كان
  فعليًا بائع الإعلان `adId` المشار إليه (يتحقق عبر `get()` على مستند الإعلان)،
  **و**`status == "pending"` إلزاميًا — هذا يمنع انتحال عمولة باسم بائع آخر أو
  عن إعلان لا يملكه، أو تزوير حالة الموافقة عند الإنشاء مباشرة.
- **التعديل:** admin/owner فقط، ومحصور بتغيير `status`/`reviewedAt` حصرًا
  (`request.resource.data.diff(resource.data).affectedKeys().hasOnly(["status","reviewedAt"])`)
  — لا يقدر أحد (ولا حتى admin) تعديل `saleAmount`/`commissionAmount`/`receiptFile`
  بعد الإنشاء.
- **الحذف:** admin/owner فقط.

**لوحة الإدارة:** `/dashboard/commissions` ("إدارة العمولات") — جدول بكل
عمليات البيع المسجّلة مع أزرار قبول/رفض، مُقيَّد بـ `ownerOnly: true` في
`DashboardShell.tsx` (قرار احترازي لأنه يتعامل مع بيانات دفع، وليس مطلوبًا
صراحة من المواصفات).

**الدوال:** `createCommission`, `listCommissionsAdmin`, `setCommissionStatus` — في `frontend/src/lib/commissions.ts`.

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
