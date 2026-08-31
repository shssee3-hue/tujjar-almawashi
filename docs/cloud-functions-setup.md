# إعداد Cloud Functions + Storage

## المتطلب الوحيد: خطة Blaze

Cloud Functions **و** Firebase Storage كلاهما يتطلب أن يكون مشروع Firebase على
خطة **Blaze** (الدفع حسب الاستخدام). لا يوجد أي مزوّد خارجي أو مفتاح API —
رسائل التحقق عبر Firebase Phone Authentication من Google نفسها، وتفعيل "الدخول
بالجوال" وسياسة مناطق SMS تمّا برمجيًا.

تأكد من الترقية من:
https://console.firebase.google.com/project/tujjar-almawashi/usage/details

## النشر

من مجلد `frontend/`:

```bash
firebase deploy --only functions,storage,firestore:rules,firestore:indexes
```

الدوال المنشورة (`frontend/functions/src/index.ts`, منطقة `us-central1`):

| الدالة | النوع |
|---|---|
| `startPhoneReset`, `completePhoneReset`, `resetPasswordWithOtp` | onCall — تدفّق استعادة كلمة المرور بالجوال |
| `deleteUserCompletely` | onCall — حذف مستخدم نهائيًا (Firestore + Storage + Auth) |

## بعد أول نشر لـ Storage

شغّل سكربت ترحيل الصور القديمة (Base64 داخل Firestore ← Storage) لمرة واحدة —
راجع [`../frontend/scripts/README.md`](../frontend/scripts/README.md).

## الفهارس

`firebase deploy --only firestore:indexes` ينشئ الفهارس المركّبة الجديدة
اللازمة لترقيم `listAds` من جهة الخادم (قد تستغرق دقائق حتى تُبنى).
