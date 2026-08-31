# Cloud Functions — غير منشورة (تتطلب خطة Blaze)

المشروع على خطة Firebase **المجانية (Spark)**. Cloud Functions **و** Firebase
Storage كلاهما يتطلب ترقية إلى **Blaze** (الدفع حسب الاستخدام)، لذا لا شيء في
`frontend/functions/` منشور حاليًا، و`firebase functions:list` يرجع فارغًا.

كود `functions/src/index.ts` باقٍ في المستودع (ويُبنى في CI للتحقق من صحته)
لترقية مستقبلية محتملة. حتى ذلك الحين، البدائل المستخدمة على الخطة المجانية:

| الميزة | البديل المجاني الحالي |
|---|---|
| استعادة كلمة المرور | رابط بريد من Firebase Auth (`sendPasswordResetEmail`) — `src/lib/passwordReset.ts` |
| استعادة عبر الجوال/OTP | غير مفعّلة (تحتاج `startPhoneReset` / `resetPasswordWithOtp` ⇐ Admin SDK ⇐ Blaze) |
| حذف مستخدم نهائيًا | حذف بيانات Firestore من جهة العميل (المالك يملك صلاحية الحذف في القواعد)؛ حساب الدخول في Auth يُحذف يدويًا من Firebase Console ← Authentication |
| صور الإعلانات | Base64 داخل مستند Firestore بدل Firebase Storage |

## عند الترقية إلى Blaze لاحقًا

1. فعّل الخطة: https://console.firebase.google.com/project/tujjar-almawashi/usage/details
2. أعِد كود Storage/الدوال (راجع سجل فرع `feat/storage-rating-hardening-ci`).
3. `firebase deploy --only functions,storage,firestore:rules,firestore:indexes`

## الاستضافة

الموقع الأساسي على **Cloudflare Pages** (نشر تلقائي من `main`، بلا بطاقة).
راجع [`cloudflare-pages-setup.md`](./cloudflare-pages-setup.md). قواعد
Firestore والفهارس تُنشر عبر `firebase deploy --only firestore:rules,firestore:indexes`
(تعمل على الخطة المجانية).
