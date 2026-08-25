"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ANIMAL_TYPES, CATEGORIES, DEFAULT_REGIONS, SECTION_OPTIONS } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";

const CATEGORY_PHOTOS: Record<string, string> = {
  "الضأن": "/images/animals/sheep.webp",
  "ماعز": "/images/animals/goat.webp",
  "إبل": "/images/animals/camel.webp",
  "أبقار": "/images/animals/cow.webp",
  "خيول": "/images/animals/horse.webp",
  "دواجن": "/images/animals/chicken.webp",
};

const REGION_OPTIONS = DEFAULT_REGIONS["السعودية"] || [];

export default function HomePage() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const [section, setSection] = useState("");
  const [region, setRegion] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const sp = new URLSearchParams();
    const opt = SECTION_OPTIONS.find((o) => o.value === section);
    if (opt) sp.set(opt.isAnimalType ? "animalType" : "category", opt.value);
    if (region) sp.set("region", region);
    const qs = sp.toString();
    router.push(qs ? `/ads?${qs}` : "/ads");
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
            className="mx-auto mt-8 flex max-w-xl flex-nowrap items-center gap-1 rounded-full bg-white p-1 shadow-lg sm:gap-1.5 sm:p-1.5"
          >
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="min-w-0 flex-1 rounded-full bg-brand-bg-light px-2 py-2 text-xs text-brand-bg-dark outline-none sm:px-4 sm:text-base"
            >
              <option value="">القسم</option>
              {SECTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="min-w-0 flex-1 rounded-full bg-brand-bg-light px-2 py-2 text-xs text-brand-bg-dark outline-none sm:px-4 sm:text-base"
            >
              <option value="">المنطقة</option>
              {REGION_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="shrink-0 rounded-full bg-brand-secondary px-3 py-2 text-xs font-bold text-brand-bg-dark transition hover:brightness-95 sm:px-6 sm:text-base"
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

      <section className="mx-auto max-w-7xl px-4 pb-16">
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
    </div>
  );
}
