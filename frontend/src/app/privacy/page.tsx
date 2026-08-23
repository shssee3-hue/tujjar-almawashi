import BackButton from "@/components/BackButton";

export const metadata = {
  title: "سياسة الخصوصية | تجّار المواشي",
};

const SECTIONS = [
  {
    title: "1. البيانات التي نقوم بجمعها",
    items: [
      "معلومات التسجيل الأساسية: الاسم، البريد الإلكتروني، رقم الجوال.",
      "بيانات الاستخدام: الصفحات التي يتم زيارتها، مدة التصفح.",
      "بيانات الإعلانات والخدمات التي ينشرها البائعون داخل المنصة.",
    ],
  },
  {
    title: "2. كيفية استخدام البيانات",
    intro: "نستخدم البيانات للأغراض التالية:",
    items: [
      "تحسين تجربة المستخدم داخل المنصة.",
      "عرض الخدمات والمحتوى بشكل مناسب.",
      "التواصل مع المستخدم عند الحاجة (مثل التحقق أو الدعم الفني).",
      "تحليل الأداء العام للمنصة وتطويرها.",
    ],
  },
  {
    title: "3. مشاركة البيانات",
    intro: "لا نقوم بمشاركة بيانات المستخدم مع أي طرف ثالث إلا في الحالات التالية:",
    items: [
      "الامتثال للأنظمة والقوانين المحلية.",
      "عند وجود اشتباه في إساءة استخدام المنصة أو مخالفة الشروط.",
    ],
  },
  {
    title: "4. حماية البيانات",
    intro: "نستخدم تقنيات حديثة لحماية البيانات من الوصول غير المصرح به، بما في ذلك:",
    items: ["تشفير الاتصال عبر HTTPS", "أنظمة مراقبة ومنع الاختراق", "سياسات صارمة للتحكم في الوصول"],
  },
  {
    title: "5. حقوق المستخدم",
    intro: "يحق للمستخدم:",
    items: ["طلب تعديل بياناته", "طلب حذف حسابه"],
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <BackButton />
      <h1 className="mb-2 text-3xl font-extrabold text-brand-primary">
        🔒 سياسة الخصوصية لمنصة تجّار المواشي
      </h1>
      <p className="mb-6 text-sm text-black/40">آخر تحديث: {new Date().toLocaleDateString("ar-SA")}</p>

      <p className="mb-10 leading-relaxed text-black/70">
        نحن في منصة تجّار المواشي نلتزم بحماية خصوصية المستخدمين وضمان سرية
        المعلومات التي يتم جمعها أثناء استخدام المنصة. تهدف هذه السياسة إلى
        توضيح كيفية جمع البيانات واستخدامها وحمايتها.
      </p>

      <div className="flex flex-col gap-8">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="mb-2 text-lg font-bold text-brand-bg-dark">{s.title}</h2>
            {s.intro && <p className="mb-2 leading-relaxed text-black/70">{s.intro}</p>}
            <ul className="list-inside list-disc space-y-1 leading-relaxed text-black/70">
              {s.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
