import BackButton from "@/components/BackButton";

export const metadata = {
  title: "من نحن | تجّار المواشي",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <BackButton />
      <h1 className="mb-2 text-3xl font-extrabold text-brand-primary">🐪 منصة تجّار المواشي</h1>

      <p className="mb-10 leading-relaxed text-black/70">
        تجّار المواشي هي منصة إلكترونية متخصصة في عرض خدمات ومعدات ومحتوى
        متعلق بعالم المواشي، تهدف إلى ربط البائعين بالمستخدمين بطريقة سهلة،
        سريعة، وآمنة.
      </p>

      <div className="flex flex-col gap-8">
        <section>
          <h2 className="mb-2 text-lg font-bold text-brand-bg-dark">رؤيتنا</h2>
          <p className="leading-relaxed text-black/70">
            أن نكون المنصة الأولى في المملكة لعرض خدمات المواشي والمعدات
            والمنتجات المرتبطة بها.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-brand-bg-dark">رسالتنا</h2>
          <p className="leading-relaxed text-black/70">
            تسهيل وصول المستخدمين إلى مقدمي الخدمات، وتمكين البائعين من عرض
            خدماتهم بشكل احترافي، مع توفير بيئة موثوقة وشفافة.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-brand-bg-dark">نموذج العمل</h2>
          <p className="leading-relaxed text-black/70">
            نحن منصة وسيطة، لا نبيع المواشي أو المعدات بشكل مباشر، بل نتيح
            للبائعين عرض خدماتهم ومنتجاتهم، ونستفيد من رسوم ما بعد البيع التي
            يدفعها البائع مقابل استخدام المنصة.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-brand-bg-dark">قيمنا</h2>
          <ul className="list-inside list-disc space-y-1 leading-relaxed text-black/70">
            <li>الشفافية</li>
            <li>الجودة</li>
            <li>الأمان</li>
            <li>دعم السوق المحلي</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
