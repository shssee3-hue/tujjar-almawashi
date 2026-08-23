import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 bg-brand-bg-dark text-white/80">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <div className="mb-3 flex items-center gap-2 text-lg font-extrabold text-white">
            <span className="text-2xl">🐪</span>
            <span>تجّار المواشي</span>
          </div>
          <p className="text-sm leading-relaxed text-white/60">
            منصة إلكترونية لبيع وشراء المواشي في السعودية ودول الخليج، تجمع
            التجار والأفراد في مكان واحد.
          </p>
        </div>

        <div>
          <h3 className="mb-3 font-bold text-white">روابط سريعة</h3>
          <ul className="space-y-2 text-sm text-white/60">
            <li>
              <Link href="/ads" className="hover:text-brand-secondary">
                جميع الإعلانات
              </Link>
            </li>
            <li>
              <Link href="/add-ad" className="hover:text-brand-secondary">
                إضافة إعلان
              </Link>
            </li>
            <li>
              <Link href="/search" className="hover:text-brand-secondary">
                بحث متقدم
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-brand-secondary">
                الشروط والأحكام
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-bold text-white">تواصل معنا</h3>
          <p className="text-sm text-white/60">
            للاستفسارات والدعم الفني يرجى التواصل عبر البريد الإلكتروني أو
            الأرقام المتاحة داخل حسابك.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/40">
        © {new Date().getFullYear()} تجّار المواشي. جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
