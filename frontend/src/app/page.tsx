"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ANIMAL_TYPES, CATEGORIES } from "@/lib/constants";
import { listFeaturedAds } from "@/lib/ads";
import { Ad } from "@/lib/types";
import AdCard from "@/components/AdCard";
import { useAuth } from "@/contexts/AuthContext";

const CATEGORY_PHOTOS: Record<string, string> = {
  "الضأن": "/images/animals/sheep.webp",
  "ماعز": "/images/animals/goat.webp",
  "إبل": "/images/animals/camel.webp",
  "أبقار": "/images/animals/cow.webp",
  "خيول": "/images/animals/horse.webp",
  "دواجن": "/images/animals/chicken.webp",
};

export default function HomePage() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
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
        <Image
          src="/images/hero/hero-desert-camel.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-[0.85]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(26,20,15,0.35) 0%, rgba(90,70,50,0.55) 55%, rgba(90,70,50,0.92) 100%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center">
          <h1 className="text-3xl font-extrabold [text-shadow:0_2px_10px_rgba(0,0,0,0.45)] sm:text-5xl">
            تجّار المواشي
          </h1>
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
            {firebaseUser ? (
              <Link
                href="/add-ad"
                className="rounded-full border border-white/40 px-6 py-3 font-bold transition hover:bg-white/10"
              >
                + إضافة إعلان
              </Link>
            ) : (
              <Link
                href="/register"
                className="rounded-full border border-white/40 px-6 py-3 font-bold transition hover:bg-white/10"
              >
                إنشاء حساب
              </Link>
            )}
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
              className="group relative aspect-square overflow-hidden rounded-2xl border border-black/5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <Image
                src={CATEGORY_PHOTOS[type]}
                alt={type}
                fill
                sizes="(max-width: 640px) 50vw, 16vw"
                className="object-cover opacity-[0.85] transition duration-300 group-hover:scale-105"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 40%, rgba(26,20,15,0.75) 100%)",
                }}
              />
              <span className="absolute inset-x-0 bottom-0 p-3 text-center font-bold text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.5)]">
                {type}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14">
        <h2 className="mb-6 text-center text-2xl font-extrabold text-brand-bg-dark">
          أقسام إضافية
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {CATEGORIES.filter((c) => c.key !== "livestock").map((c) => (
            <Link
              key={c.key}
              href={`/ads?category=${c.key}`}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-black/5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <Image
                src={c.photo}
                alt={c.label}
                fill
                sizes="(max-width: 640px) 50vw, 20vw"
                className="object-cover opacity-[0.85] transition duration-300 group-hover:scale-105"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 40%, rgba(26,20,15,0.75) 100%)",
                }}
              />
              <span className="absolute inset-x-0 bottom-0 p-3 text-center font-bold text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.5)]">
                {c.label}
              </span>
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
