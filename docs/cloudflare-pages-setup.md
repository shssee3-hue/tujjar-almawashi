# نشر الموقع على Cloudflare Pages (بالإضافة لـ Firebase Hosting)

Firebase Hosting يبقى شغّالًا كما هو — هذا نشر إضافي موازٍ، ليس استبدالًا.
بما إن الموقع export ثابت بالكامل (`output: "export"` في `next.config.ts`،
بلا أي خادم)، هو متوافق تمامًا مع Cloudflare Pages بدون أي تعديل على الكود.

خطوتان فقط أنت من يقدر يسويهما (تسجيل حساب + ربط GitHub من لوحتك) — بعدها
أقدر أكمل أي إعداد إضافي (مثل ربط الدومين بـ Firebase Auth) بنفسي.

## 1) إنشاء حساب Cloudflare

سجّل مجانًا على https://dash.cloudflare.com/sign-up — لا تحتاج بطاقة دفع
لـ Cloudflare Pages بحجم استخدام موقعك.

## 2) ربط المستودع من GitHub

1. من لوحة التحكم: **Workers & Pages** → **Create** → تبويب **Pages** →
   **Connect to Git**.
2. اربط حساب GitHub (`shssee3-hue`) وامنح Cloudflare صلاحية الوصول لمستودع
   `tujjar-almawashi`.
3. اختر المستودع، ثم اضبط إعدادات البناء بالضبط كالتالي (الموقع داخل مجلد
   فرعي `frontend/` وليس جذر المستودع):

| الحقل | القيمة |
|---|---|
| Framework preset | None (أو Next.js إن ظهر، لكن تأكد الإعدادات أدناه لم تتغيّر) |
| Root directory (advanced) | `frontend` |
| Build command | `npm run build` |
| Build output directory | `out` |

## 3) متغيّرات البيئة (Environment variables)

قبل أول نشر، أضف هذه المتغيّرات في نفس صفحة إعدادات المشروع (Settings →
Environment variables) — كلها قيم عامة (public) مضمّنة أصلًا في كود الموقع
المنشور، وليست أسرارًا:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCBAP9nm7fTFOWTo3ql2uyFHXVGOmHRQqk
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tujjar-almawashi.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tujjar-almawashi
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tujjar-almawashi.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=342619861741
NEXT_PUBLIC_FIREBASE_APP_ID=1:342619861741:web:585547ac51373fea6152e4
```

## 4) انشر

اضغط **Save and Deploy**. Cloudflare يبني وينشر تلقائيًا، ويعطيك رابطًا
بصيغة `tujjar-almawashi.pages.dev` أو مشابه (يتكرر تلقائيًا مع كل push
جديد على GitHub لاحقًا — بدون أي إجراء إضافي).

## 5) أرسل لي الرابط الناتج

هذه الخطوة الوحيدة المتبقية بعدها، وأنا أقدر أسويها:

**تسجيل الدومين الجديد في قائمة "Authorized domains" الخاصة بـ Firebase
Authentication** — بدونها، تسجيل الدخول/إنشاء الحساب/التحقق برمز الجوال
(reCAPTCHA) ستفشل جميعًا على دومين Cloudflare الجديد تحديدًا (تعمل بشكل
طبيعي على `tujjar-almawashi.web.app` لأنه مُسجَّل مسبقًا). بمجرد ما ترسل لي
الرابط، أضيفه فورًا عبر Identity Platform Admin API — لا حاجة لأي خطوة يدوية
منك فيها.

## ملاحظات

- لا حاجة لأي تعديل على `firestore.rules` أو Cloud Functions — كلاهما
  خدمات سحابية مستقلة عن مكان استضافة الملفات الثابتة، تُستدعى بنفس الطريقة
  من أي دومين (بعد تسجيله في Authorized domains).
- دومين مخصّص لاحقًا (بدل `.pages.dev`)؟ نفس الفكرة: تضيفه من إعدادات
  Cloudflare Pages نفسها (Custom domains)، ثم ترسل لي الدومين الجديد
  لإضافته لقائمة Firebase أيضًا.
