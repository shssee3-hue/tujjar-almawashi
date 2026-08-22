"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ANIMAL_TYPES } from "@/lib/constants";
import { listFeaturedAds } from "@/lib/ads";
import { Ad } from "@/lib/types";
import AdCard from "@/components/AdCard";

const CATEGORY_ICONS: Record<string, string> = {
  "أغنام": "🐑",
  "ماعز": "🐐",
  "إبل": "🐪",
  "أبقار": "🐄",
  "خيول": "🐎",
  "دواجن": "🐔",
};

export default function HomePage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [featured, setFeatured] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listFeaturedAds()
      .then(setFeatured)
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(q ? `/ads?q=${encodeURIComponent(q)}` : "/ads");
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-brand-primary text-white">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #C9A66B 0%, transparent 40%), radial-gradient(circle at 80% 60%, #C9A66B 0%, transparent 35%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center">
          <div className="mb-4 text-6xl">🐪🐑🐐</div>
          <h1 className="text-3xl font-extrabold sm:text-5xl">تجّار المواشي</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            منصتك الأولى لبيع وشراء المواشي في السعودية ودول الخليج — تصفح آلاف
            الإعلانات أو أضف إعلانك الآن.
          </p>

          <form
            onSubmit={handleSearch}
            className="mx-auto mt-8 flex max-w-xl overflow-hidden rounded-full bg-white shadow-lg"
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن نوع، سلالة، مدينة..."
              className="flex-1 px-5 py-3 text-brand-bg-dark outline-none"
            />
            <button
              type="submit"
              className="bg-brand-secondary px-6 font-bold text-brand-bg-dark transition hover:brightness-95"
            >
              بحث
            </button>
          </form>

          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/ads"
              className="rounded-full bg-white px-6 py-3 font-bold text-brand-primary transition hover:bg-white/90"
            >
              تصفح الإعلانات
            </Link>
            <Link
              href="/register"
              className="rounded-full border border-white/40 px-6 py-3 font-bold transition hover:bg-white/10"
            >
              إنشاء حساب
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="mb-6 text-center text-2xl font-extrabold text-brand-bg-dark">
          أقسام المواشي
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {ANIMAL_TYPES.map((type) => (
            <Link
              key={type}
              href={`/ads?animalType=${encodeURIComponent(type)}`}
              className="flex flex-col items-center gap-2 rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <span className="text-4xl">{CATEGORY_ICONS[type]}</span>
              <span className="font-bold text-brand-bg-dark">{type}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-brand-bg-dark">إعلانات مميزة</h2>
          <Link href="/ads" className="text-sm font-bold text-brand-primary">
            عرض الكل ←
          </Link>
        </div>
        {loading ? (
          <p className="text-center text-black/40">جاري التحميل...</p>
        ) : featured.length === 0 ? (
          <p className="text-center text-black/40">لا توجد إعلانات مميزة حاليًا</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
