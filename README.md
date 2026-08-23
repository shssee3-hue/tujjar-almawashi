# تجّار المواشي — Tujjar Al-Mawashi

منصة إلكترونية لبيع وشراء المواشي (أغنام، ماعز، إبل، أبقار، خيول، دواجن) في
السعودية ودول الخليج.

## هيكلة المستودع

```
tujjar-almawashi/
├── frontend/     تطبيق Next.js الكامل (الواجهة + الاتصال المباشر بـ Firebase)
├── backend/      لا يوجد خادم منفصل — راجع backend/README.md لسبب هذا القرار
└── docs/         التقرير النهائي، البنية التقنية، مرجع البيانات، خارطة الطريق
```

## التقنيات المستخدمة

- **Next.js** (App Router) + **React**
- **Firebase**: Auth (Email/Password) + Firestore + Hosting
- **Tailwind CSS v4**

## طريقة التشغيل

```bash
cd frontend
npm install
cp .env.example .env.local   # يحتوي إعدادات Firebase العامة (غير سرّية)
npm run dev
```

لا يوجد `backend/` بمعنى خادم منفصل يحتاج تشغيلًا — كل الاتصال بقاعدة
البيانات يتم مباشرة من الواجهة عبر Firebase SDK، ومحمي بقواعد
`frontend/firestore.rules`. التفاصيل الكاملة في [`backend/README.md`](backend/README.md).

## روابط مهمة

| البند | الرابط |
|---|---|
| النسخة المنشورة | https://tujjar-almawashi.web.app |
| لوحة التحكم | https://tujjar-almawashi.web.app/dashboard |
| حساب المالك (owner) | `owner@tujjar-almawashi.com` — كلمة المرور غير معروضة هنا لأسباب أمنية |
| الشروط والأحكام | https://tujjar-almawashi.web.app/terms |
| التقرير النهائي | [`docs/tujjar-report.html`](docs/tujjar-report.html) |
| البنية التقنية | [`docs/architecture.md`](docs/architecture.md) |
| مرجع البيانات | [`docs/api-reference.md`](docs/api-reference.md) |
| خارطة الطريق | [`docs/roadmap.md`](docs/roadmap.md) |

## الرخصة

[MIT](LICENSE)
