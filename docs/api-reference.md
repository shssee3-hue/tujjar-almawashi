# مرجع واجهة البيانات (API Reference)

لا يوجد REST API تقليدي في هذا المشروع — الواجهة تتصل مباشرة بـ Cloud
Firestore عبر Firebase JS SDK. هذا المستند يوثّق نفس المعلومات التي يوفرها
REST API reference عادةً: شكل كل مجموعة بيانات، من يملك صلاحية القراءة/الكتابة،
والدوال الجاهزة في `frontend/src/lib/*.ts` التي تُستخدم بدل استدعاءات HTTP.

## ads

| الحقل | النوع | ملاحظات |
|---|---|---|
| title, description | string | |
| price | number | |
| isNegotiable | boolean | |
| animalType, breed, age | string | |
| weight | number \| null | |
| country, region, city | string | |
| sellerId, sellerName, sellerType, sellerRating | — | مخزّنة مباشرة على الإعلان (denormalized) |
| phoneNumber, whatsapp | string | |
| images | string[] | Data URI بصيغة base64 |
| views, reportsCount | number | |
| status | `active` \| `ended` \| `flagged` \| `deleted` | |
| featured | boolean | |

**الصلاحيات:** القراءة عامة. الإنشاء لأي مستخدم مسجّل (لنفسه فقط). التعديل/الحذف لصاحب الإعلان أو أي admin/owner.

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
الصيانة). القراءة عامة، الكتابة لـ **owner فقط**. الدوال في `settings.ts`.

## المصادقة (Auth)

Firebase Authentication — Email/Password. الدوال: `registerUser`, `loginUser`,
`authErrorMessage` في `frontend/src/lib/auth.ts`.
