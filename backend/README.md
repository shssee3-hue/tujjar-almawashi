# Backend

هذا المشروع **لا يحتوي خادم Node/Express منفصل عن قصد**.

بدل خادم backend تقليدي، يتصل الـ frontend (Next.js) مباشرة بـ Firebase
(Firestore + Auth)، وكل منطق التفويض والصلاحيات (من يقدر يقرأ/يكتب أي بيانات)
مفروض داخل [`../frontend/firestore.rules`](../frontend/firestore.rules) —
وهي تلعب فعليًا دور طبقة الـ backend/API.

## لماذا هذا القرار

راجع قسم **"لماذا هذا الـ Stack"** في [`../frontend/README.md`](../frontend/README.md)
للتفاصيل الكاملة. باختصار: إنشاء حسابات على مزودي استضافة/قواعد بيانات جدد
(MongoDB Atlas، Vercel، Render...) يتطلب تسجيل حساب جديد بكلمة مرور — إجراء
لا يمكن تنفيذه نيابة عن المستخدم. بينما حساب Firebase كان مفعّلًا ومُصادقًا
عليه مسبقًا، فسمح ببناء المشروع ونشره وتشغيله بالكامل دون انتظار أي تسجيل
حساب يدوي إضافي.

## أين أجد "منطق الـ API"؟

- **مخطط البيانات وقواعد الوصول:** [`docs/architecture.md`](../docs/architecture.md)
- **توثيق واجهة البيانات (بديل REST API reference):** [`docs/api-reference.md`](../docs/api-reference.md)
- **دوال الوصول لقاعدة البيانات من جهة العميل:** `../frontend/src/lib/*.ts`
  (`ads.ts`, `users.ts`, `reports.ts`, `breeds.ts`, `regions.ts`, `settings.ts`, `auth.ts`)
