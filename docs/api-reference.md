# مرجع واجهة البيانات (API Reference)

لا يوجد REST API تقليدي في هذا المشروع — الواجهة تتصل مباشرة بـ Cloud
Firestore عبر Firebase JS SDK. هذا المستند يوثّق نفس المعلومات التي يوفرها
REST API reference عادةً: شكل كل مجموعة بيانات، من يملك صلاحية القراءة/الكتابة،
والدوال الجاهزة في `frontend/src/lib/*.ts` التي تُستخدم بدل استدعاءات HTTP.

## ads

| الحقل | النوع | ملاحظات |
|---|---|---|
| adCode | string، اختياري | رقم تعريف فريد وقابل للقراءة مثل `AD-2026-000123` — يُولَّد تلقائيًا في `createAd()` (راجع قسم `counters` أدناه)؛ اختياري في النوع فقط لأن الإعلانات المُنشأة قبل هذه الميزة لا تملكه |
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
| banned | boolean، اختياري | غائب حتى يضبطه **owner** عبر `setUserBanned` (زر "حظر" في `/dashboard/users`، خلف مربع تأكيد) — القاعدة تقارنه بـ `.get("banned", false)` وليس الوصول المباشر، وإلا يرمي خطأ ويرفض تعديل الحساب لكل من لم يُحظر قط. **يُفرض فعليًا عند الدخول**: `login/page.tsx` يتحقق من الحقل فور نجاح `signInWithEmailAndPassword` ولا يُكمل الدخول إن كان `true`؛ و`AuthContext` يشترك بشكل حي (`onSnapshot`) على ملف أي مستخدم مسجّل دخول، فإن حُظر أثناء تصفّحه الموقع يُسجَّل خروجه فورًا برسالة "تم حظر حسابك من قبل إدارة المنصة." — وليس فقط عند محاولة دخول جديدة. |

**الصلاحيات:**
- القراءة: كل حساب يقرأ مستنده الخاص فقط، إلا **owner** فيقرأ أي حساب.
- الإنشاء: ذاتي فقط، بدور `user` إلزاميًا.
- التعديل: **owner** فقط يقدر يغيّر `role`/`banned`؛ أي حساب يقدر يعدّل بياناته الشخصية (الاسم/الجوال) بدون المساس بهذه الحقول.
- الحذف: **owner** فقط (حذف مباشر لمستند Firestore فقط — راجع "الحذف النهائي" أدناه للحذف الكامل الفعلي).

**الحذف النهائي (زر "🗑️ حذف نهائي" في `/dashboard/users`، خلف مربع تأكيد):**
حذف حساب مستخدم بالكامل — بياناته، إعلاناته، تقييماته، وسجلات عمولته، **بالإضافة**
لحسابه الفعلي في Firebase Auth — لا يمكن تنفيذه من المتصفح وحده مهما كانت صلاحيات
Firestore، لأن حذف حساب Auth **مستخدم آخر** (غير الحساب المسجّل دخوله حاليًا) يتطلب
Admin SDK، وهو ما لا يعمل إلا من كود خادم. لهذا هذا الإجراء ينفَّذ عبر Cloud Function
اسمها `deleteUserCompletely` (`frontend/functions/src/index.ts`)، تتحقق أولًا أن
المستدعي فعلًا `role == "owner"` من ملفه في Firestore، ثم تحذف بالتتابع: إعلانات
البائع (`ads` حيث `sellerId`)، تقييماته (`ratings` حيث `userId`)، عمولاته
(`commissions` حيث `sellerId`)، ملفه في `users`، وأخيرًا حسابه في Firebase Auth
عبر `admin.auth().deleteUser()`. **يتطلب خطة Blaze** — راجع
`docs/cloud-functions-setup.md`.

**الدوال:** `createUserProfile`, `getUserProfile`, `updateUserProfile`, `listAllUsersAdmin`, `setUserRole`, `setUserBanned`, `deleteUserPermanently` — في `frontend/src/lib/users.ts`.

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
| adCode | string، اختياري | نسخة من `ads/{adId}.adCode` وقت إنشاء سجل العمولة — يُتيح للمدير البحث السريع في `/dashboard/commissions`؛ غائب فقط إذا كان الإعلان نفسه بلا `adCode` (إعلان قديم سابق لهذه الميزة) |
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
عمليات البيع المسجّلة، بعمود "رقم الإعلان (Ad Code)" ومربع "بحث برقم الإعلان"
يُصفّي الجدول فوريًا (تصفية جهة العميل على القائمة المحمّلة أصلًا، `includes`
غير حساس لحالة الأحرف) — مع أزرار قبول/رفض، مُقيَّد بـ `ownerOnly: true` في
`DashboardShell.tsx` (قرار احترازي لأنه يتعامل مع بيانات دفع، وليس مطلوبًا
صراحة من المواصفات).

**الدوال:** `createCommission`, `listCommissionsAdmin`, `setCommissionStatus` — في `frontend/src/lib/commissions.ts`.

## counters

مستند واحد (`counters/adCode`) يولّد رقم الإعلان التسلسلي — `{ year: number,
seq: number }`. `createAd()` يزيده داخل معاملة Firestore (`runTransaction`)
قبل إنشاء الإعلان: يقرأ القيمة الحالية، يحسب `seq+1` إن كانت نفس السنة أو
يعيدها لـ `1` عند دخول سنة جديدة، ثم يبني `AD-{year}-{seq مكوّن من 6 خانات}`
(مثال: `AD-2026-000123`) ويخزّنه في حقل `adCode` على الإعلان.

**الصلاحيات:** القراءة عامة. الكتابة لأي مستخدم مسجّل، لكن مقيّدة بشدة في
`firestore.rules` بحيث لا يقدر أي عميل (حتى عبر استدعاء مباشر لـ Firestore
API متجاوزًا `createAd()`) إرجاع الرقم للخلف أو القفز لرقم غير متسلسل: كل
تحديث يجب أن يكون زيادة `+1` بالضبط ضمن نفس السنة، أو إعادة تعيين لـ `1` عند
تغيّر السنة، ولا يمسّ أي حقل غير `year`/`seq`.

**ملاحظة تشغيلية:** بما إنه لا توجد بيئة اختبار منفصلة (staging) لهذا
المشروع، أي اختبار حي لهذه الميزة يستهلك أرقامًا فعلية من هذا العداد
المشترك في الإنتاج. عند التحقق من الميزة تم حذف الإعلانات التجريبية بعد
الانتهاء، **وأيضًا** إعادة ضبط `counters/adCode.seq` يدويًا (عبر صلاحية
admin) للقيمة التي كانت عليها قبل الاختبار، حتى يبدأ أول إعلان حقيقي من
`000001` كما هو متوقع.

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

## password_resets

سجلات جلسة "نسيت كلمة المرور" عبر رقم الجوال
(`/forgot-password` → `/forgot-password/verify` → `/forgot-password/reset`).
كل الحقول والمنطق يعيش في Cloud Functions (`frontend/functions/src/index.ts`)
— لا يوجد أي كود عميل يقرأ أو يكتب هذه المجموعة مباشرة. **الرمز نفسه (OTP)
لا يُخزَّن هنا إطلاقًا** — توليده والتحقق منه بالكامل مفوَّض لـ Authentica
(راجع `functions/src/authentica.ts`)، فهذا المستند يتتبّع فقط "جلسة إعادة
التعيين" المرتبطة برقم/حساب معيّن.

| الحقل | النوع | ملاحظات |
|---|---|---|
| phone | string | |
| uid | string | معرّف حساب Firebase Auth المطابق — يُستخدم لاحقًا في `admin.auth().updateUser()` |
| createdAt, expiresAt | number | صلاحية الجلسة 3 دقائق (`RESET_SESSION_TTL_MS`) |
| used | boolean | يُضبط `true` إمّا بعد نجاح تغيير كلمة المرور، أو فور إنشاء طلب أحدث لنفس الرقم (يُبطل كل الطلبات السابقة غير المستخدمة)، أو إذا ردّت Authentica بأن الرمز منتهي |
| verified | boolean | `true` بعد أن يؤكد Authentica صحة الرمز — شرط لازم قبل السماح بتغيير كلمة المرور في الخطوة التالية |
| attempts | number | عدّاد محاولات خاطئة من جهتنا (دفاع إضافي فوق حدود Authentica نفسها)، يُبطل الطلب تلقائيًا (`used=true`) بعد 5 محاولات |

**الصلاحيات:** `allow read, write: if false;` في `firestore.rules` — القراءة/الكتابة
حصرًا عبر Admin SDK داخل Cloud Functions (تتجاوز قواعد الأمان أصلًا)، فلا حاجة
لفتح أي وصول للعميل، وزائر غير مسجّل دخول لا يملك أصلًا سياق مصادقة Firestore
يُمنح عبره وصولًا.

**التدفق الكامل:**
1. `requestPasswordResetOtp({ phone })` — يبحث عن `users` حيث `phoneNumber == phone`؛ إن لم يوجد يرمي `not-found` ("هذا الرقم غير مسجّل في المنصة"). يُبطل أي طلبات سابقة غير مستخدمة لنفس الرقم، يطلب من Authentica توليد وإرسال الرمز (`authentica.sendOtp`)، وينشئ سجل جلسة. يُعيد `{ resetId, expiresAt }` فقط.
2. `verifyPasswordResetOtp({ resetId, otp })` — يتحقق من عدم انتهاء الجلسة وعدم استخدامها، ثم يمرّر الرمز لـ Authentica نفسه للتحقق (`authentica.verifyOtp`) — لا مقارنة محلية لأي رمز مخزَّن لأنه غير موجود أصلًا؛ رفض Authentica ⇐ `invalid-argument` مع زيادة `attempts`، وانتهاء الصلاحية من جهة Authentica ⇐ `deadline-exceeded` مع `used=true`. عند النجاح يضبط `verified=true` فقط (وليس `used`، حتى لا يُهدر المحاولة إن لم يُكمل المستخدم الخطوة التالية).
3. `resetPasswordWithOtp({ resetId, newPassword })` — يتطلب `verified==true && used==false`؛ يتحقق من قوة كلمة المرور (6 خانات فأكثر، أرقام وحروف) على الخادم أيضًا وليس فقط في الواجهة، يستدعي `admin.auth().updateUser(uid, { password })`، ثم يضبط `used=true`.

**الدوال (عميل):** `requestPasswordResetOtp`, `verifyPasswordResetOtp`, `resetPasswordWithOtp`, `passwordResetErrorMessage` — في `frontend/src/lib/passwordReset.ts`، تستدعي الدوال أعلاه عبر `httpsCallable`.

## Cloud Functions (`frontend/functions/`)

أول كود خادم (server-side / Admin SDK) في هذا المشروع — كل شيء آخر يتصل
بـ Firestore مباشرة من المتصفح. أربع دوال `onCall` في
`frontend/functions/src/index.ts`، منطقة `us-central1`:

| الدالة | من يستدعيها | الغرض |
|---|---|---|
| `requestPasswordResetOtp` | أي زائر (غير مسجّل دخول) | الخطوة 1 من نسيان كلمة المرور |
| `verifyPasswordResetOtp` | أي زائر | الخطوة 2 |
| `resetPasswordWithOtp` | أي زائر | الخطوة 3 — التغيير الفعلي لكلمة المرور عبر Admin SDK |
| `deleteUserCompletely` | owner فقط (يتحقق من `role` داخليًا) | حذف مستخدم نهائيًا من Firestore و Auth معًا |

**مزوّد OTP: Authentica** (`functions/src/authentica.ts`) — منصة سعودية
متخصصة في التحقق عبر OTP (وليست مزوّد SMS عام)؛ تولّد الرمز وتتحقق منه على
خادمها هي، فهذا المشروع لا يولّد أو يخزّن الرمز الفعلي إطلاقًا. **تنبيه:**
لم يتوفر حساب Authentica فعلي وقت كتابة هذا الكود، فمسارات الـ API وأسماء
الحقول في `authentica.ts` هي أفضل تخمين مبني على نموذج "OTP-as-a-service"
المعلن، وليست مُتحقَّقة حيًّا — راجعها مقابل توثيق حسابك الفعلي عند توفره.
يتطلب السرّ `AUTHENTICA_API_KEY`.

**يتطلب خطة Blaze (الدفع حسب الاستخدام)** على مشروع Firebase — Cloud Functions
لا تعمل على الخطة المجانية (Spark) إطلاقًا. راجع `docs/cloud-functions-setup.md`
للخطوات الكاملة.
