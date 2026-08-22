"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { listAds, AdFilters } from "@/lib/ads";
import { Ad } from "@/lib/types";
import AdCard from "@/components/AdCard";
import Pagination from "@/components/Pagination";
import BackButton from "@/components/BackButton";
import {
  ANIMAL_TYPES,
  DEFAULT_BREEDS,
  DEFAULT_REGIONS,
  SORT_OPTIONS,
} from "@/lib/constants";

const PAGE_SIZE = 12;

export default function AdsExplorer({
  title,
  showAdvanced = false,
}: {
  title: string;
  showAdvanced?: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const [animalType, setAnimalType] = useState(params.get("animalType") || "");
  const [breed, setBreed] = useState(params.get("breed") || "");
  const [region, setRegion] = useState(params.get("region") || "");
  const [city, setCity] = useState(params.get("city") || "");
  const [minPrice, setMinPrice] = useState(params.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") || "");
  const [q, setQ] = useState(params.get("q") || "");
  const [sort, setSort] = useState(params.get("sort") || "newest");

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const filters: AdFilters = useMemo(
    () => ({
      animalType: animalType || undefined,
      breed: breed || undefined,
      region: region || undefined,
      city: city || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      q: q || undefined,
      sort,
    }),
    [animalType, breed, region, city, minPrice, maxPrice, q, sort]
  );

  useEffect(() => {
    setLoading(true);
    listAds(filters)
      .then((res) => {
        setAds(res);
        setPage(1);
      })
      .catch(() => setAds([]))
      .finally(() => setLoading(false));
  }, [filters]);

  const breedOptions = animalType ? DEFAULT_BREEDS[animalType] || [] : [];
  const regionOptions = DEFAULT_REGIONS["السعودية"] || [];

  const totalPages = Math.max(1, Math.ceil(ads.length / PAGE_SIZE));
  const pageAds = ads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function applyToUrl() {
    const sp = new URLSearchParams();
    if (animalType) sp.set("animalType", animalType);
    if (breed) sp.set("breed", breed);
    if (region) sp.set("region", region);
    if (city) sp.set("city", city);
    if (minPrice) sp.set("minPrice", minPrice);
    if (maxPrice) sp.set("maxPrice", maxPrice);
    if (q) sp.set("q", q);
    if (sort !== "newest") sp.set("sort", sort);
    router.push(`?${sp.toString()}`);
  }

  function resetFilters() {
    setAnimalType("");
    setBreed("");
    setRegion("");
    setCity("");
    setMinPrice("");
    setMaxPrice("");
    setQ("");
    setSort("newest");
    router.push("?");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <BackButton />
      <h1 className="mb-6 text-2xl font-extrabold text-brand-bg-dark">{title}</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-bold text-brand-primary">تصفية النتائج</h2>

          <div className="flex flex-col gap-4 text-sm">
            <div>
              <label className="mb-1 block font-medium">كلمة بحث</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="عنوان، وصف، سلالة..."
                className="w-full rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-brand-secondary"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium">نوع الحيوان</label>
              <select
                value={animalType}
                onChange={(e) => {
                  setAnimalType(e.target.value);
                  setBreed("");
                }}
                className="w-full rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-brand-secondary"
              >
                <option value="">الكل</option>
                {ANIMAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {breedOptions.length > 0 && (
              <div>
                <label className="mb-1 block font-medium">السلالة</label>
                <select
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  className="w-full rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-brand-secondary"
                >
                  <option value="">الكل</option>
                  {breedOptions.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1 block font-medium">المنطقة</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-brand-secondary"
              >
                <option value="">الكل</option>
                {regionOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block font-medium">المدينة</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="اسم المدينة"
                className="w-full rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-brand-secondary"
              />
            </div>

            {showAdvanced && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block font-medium">أقل سعر</label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-brand-secondary"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium">أعلى سعر</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-brand-secondary"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={applyToUrl}
                className="flex-1 rounded-lg bg-brand-primary py-2 font-bold text-white"
              >
                تطبيق
              </button>
              <button
                onClick={resetFilters}
                className="flex-1 rounded-lg border border-black/10 py-2 font-medium text-black/60"
              >
                إعادة تعيين
              </button>
            </div>
          </div>
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-black/50">{ads.length} إعلان</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="py-20 text-center text-black/40">جاري التحميل...</p>
          ) : pageAds.length === 0 ? (
            <p className="py-20 text-center text-black/40">لا توجد نتائج مطابقة</p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {pageAds.map((ad) => (
                <AdCard key={ad.id} ad={ad} />
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}
