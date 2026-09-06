# الاستضافة على Cloudflare Pages (المنصة الوحيدة)

القرار المعتمد: **Cloudflare Pages هو المضيف الوحيد للموقع**. Firebase يبقى
مزوّد خدمات فقط (Auth / Firestore / Storage / Functions لاحقًا) ولا يستضيف أي
ملفات. Firebase Hosting **أُلغي**.

الموقع تصدير ثابت بالكامل (`output: "export"` في `next.config.ts`، بلا خادم
ولا SSR)، فهو متوافق مع Cloudflare Pages دون أي تعديل على الكود.

الخطوات التي تتطلب لوحة تحكمك أنت مُعلَّمة بـ **[يدوي]**؛ الباقي منفّذ في
المستودع.

---

## 1) ربط المستودع بـ Cloudflare Pages — [يدوي]

1. أنشئ حسابًا مجانيًا على https://dash.cloudflare.com/sign-up (بلا بطاقة).
2. **Workers & Pages** → **Create** → تبويب **Pages** → **Connect to Git**.
3. اربط حساب GitHub (`shssee3-hue`) وامنح الوصول لمستودع `tujjar-almawashi`.
4. اضبط إعدادات البناء بالضبط (الموقع داخل `frontend/` وليس جذر المستودع):

| الحقل | القيمة |
|---|---|
| Framework preset | None |
| Root directory (advanced) | `frontend` |
| Build command | `npm run build` |
| Build output directory | `out` |
| متغيّر بيئة إضافي | `NODE_VERSION` = `20` |

## 2) متغيّرات البيئة — [يدوي]

Settings → Environment variables. القيم من `frontend/.env.local` المحلي، أو من
Firebase Console → Project settings → General → Your apps:

```
NEXT_PUBLIC_FIREBASE_API_KEY=<من .env.local أو Firebase Console>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tujjar-almawashi.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tujjar-almawashi
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tujjar-almawashi.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=342619861741
NEXT_PUBLIC_FIREBASE_APP_ID=1:342619861741:web:585547ac51373fea6152e4
NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY=     # لاحقًا، عند تجهيز App Check
```

> مفتاح Web API قيمة عامة بتصميم Firebase (مضمّن في ملفات JS للمتصفح)؛
> الحماية من قيود referrer وقواعد Firestore، لا من إخفائه. تُركت القيمة
> خارج هذا الملف فقط لتفادي تنبيهات فحص الأسرار الآلية.

## 3) النشر التلقائي ومعاينات الفروع

مفعّلان افتراضيًا في Cloudflare Pages:

- كل push على `main` → نشر إنتاج على `https://<اسم-المشروع>.pages.dev`.
- كل push على أي فرع آخر / PR → نشر معاينة على `https://<hash>.<اسم-المشروع>.pages.dev`.

لا إجراء إضافي مطلوب.

## 4) النطاق المخصّص — [يدوي]

**نطاق `.com`:** سجّله عبر **Cloudflare Registrar** (Dash → Domain
Registration) — بسعر التكلفة وخصوصية WHOIS مجانية، وDNS جاهز تلقائيًا.

**نطاق `.com.sa` / `.sa`:** سجّله عبر مسجّل معتمد من **SaudiNIC** (nic.sa)،
ثم انقل إدارة DNS إلى Cloudflare (أضف الموقع في Cloudflare → غيّر
nameservers عند المسجّل).

ثم:

1. Cloudflare Pages → مشروعك → **Custom domains** → **Set up a domain**.
2. أدخل النطاق — يُضبط سجل `CNAME` تلقائيًا حين يكون DNS داخل Cloudflare.
3. انتظر التفعيل (SSL تلقائي).
4. **أرسل النطاق للمطوّر** لإضافته إلى **Firebase Auth → Settings →
   Authorized domains** — بدونها يفشل تسجيل الدخول و reCAPTCHA على النطاق
   الجديد (يعمل على `*.pages.dev` و`*.web.app` لأنهما مُسجّلان مسبقًا... مع
   ملاحظة أن `.pages.dev` يحتاج إضافته يدويًا أيضًا عند أول نشر).

## 5) البريد الإلكتروني

Cloudflare Pages لا يوفّر صناديق بريد. عند الحاجة لبريد شركة
(`info@<النطاق>`): استخدم **Hostinger للبريد فقط** (خطة Email Hosting)، أو
Google Workspace / Zoho Mail — بإضافة سجلات MX في Cloudflare DNS. الموقع
يبقى على Cloudflare Pages في كل الأحوال.

---

## إلغاء Firebase Hosting

منفّذ في المستودع:

- حُذفت كتلة `"hosting"` من `frontend/firebase.json` — `firebase deploy` لم
  يعد يمسّ الاستضافة، ويبقى ينشر القواعد والفهارس فقط:
  ```bash
  cd frontend && firebase deploy --only firestore:rules,firestore:indexes
  ```
- ترويسات الأمان والتخزين المؤقت التي كانت في `firebase.json` نُقلت بالكامل
  إلى `frontend/public/_headers` (يقرؤها Cloudflare Pages).

يتبقى عليك — [يدوي]، مرة واحدة:

```bash
cd frontend && firebase hosting:disable
```

يوقف تقديم `tujjar-almawashi.web.app` / `.firebaseapp.com`. إيقافه يمنع
ازدواج SEO تلقائيًا (لا حاجة لتحويل 301 لأن العنوان يتوقف عن العمل). حدّث
أي روابط قديمة (README، التقرير، أي منشور) إلى نطاق Cloudflare الجديد.

## ملاحظات

- `firestore.rules` و Cloud Functions خدمات سحابية مستقلة عن مكان الاستضافة،
  تُستدعى بنفس الطريقة من أي نطاق مُسجّل في Authorized domains.
- CI الحالي (`.github/workflows/ci.yml`) يبني ويختبر فقط ولا ينشر — لا تغيير
  مطلوب فيه؛ النشر يتولّاه Cloudflare Pages مباشرة من GitHub.
