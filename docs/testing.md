# الاختبارات (Testing)

## اختبارات قواعد Firestore

`frontend/tests/firestore.rules.test.ts` يشغّل
[`firestore.rules`](../frontend/firestore.rules) الحقيقية داخل مُحاكي
Firestore عبر `@firebase/rules-unit-testing` + `vitest`، ويغطّي المسارات
الحسّاسة أمنيًا: إنشاء/تعديل `ads`، ثبات حقول الثقة في `users`، مراجعة
`commissions`، عدّاد `counters/adCode`، قراءة `reports`، وإغلاق
`password_resets` و`ratings` (ميزة ملغاة) بالكامل.

### التشغيل محليًا

المتطلبات: Node 20+ و **Java 17+** (للمُحاكي).

```bash
cd frontend
npm install
npm run test:rules
```

السكربت يشغّل `firebase emulators:exec --project=demo-tujjar --only firestore "vitest run"`
— يبدأ المُحاكي، يشغّل vitest، ثم يوقف المُحاكي. أسطر `PERMISSION_DENIED`
في الإخراج متوقّعة: هي حالات `assertFails` تنجح.

## CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) يشغّل على كل push
إلى `main` وكل Pull Request ثلاث وظائف:

| الوظيفة | ماذا تفعل |
|---|---|
| `frontend` | `npm ci` → `npm run lint` → `npm run build` (بمتغيّرات Firebase وهمية) |
| `rules-tests` | `npm ci` + Java 17 → `npm run test:rules` |
| `functions` | `npm ci` + `npm run build` داخل `frontend/functions` |

## غير مغطّى بعد

اختبارات e2e للواجهة (تسجيل دخول، إضافة إعلان، تدفّق العمولة). مُدرجة في
[`roadmap.md`](./roadmap.md).
