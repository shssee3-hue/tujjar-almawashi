"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { listAds, AdFilters } from "@/lib/ads";
import { Ad, AdCategory } from "@/lib/types";
import AdCard from "@/components/AdCard";
import Pagination from "@/components/Pagination";
import BackButton from "@/components/BackButton";
import {
  DEFAULT_BREEDS,
  DEFAULT_REGIONS,
  CATEGORY_LABELS,
  SUB_CATEGORIES,
} from "@/lib/constants";

const PAGE_SIZE = 12;
const REGION_OPTIONS = DEFAULT_REGIONS["السعودية"] || [];

export default function AdsExplorer() {
  const router = useRouter();
  const params = useSearchParams();

  // The section (category / animalType) is fixed by whichever homepage tile
  // or search the visitor came from — this page no longer lets them switch
  // section from within it, only refine by region and, when a section is
  // known, by its "مسمى" (breed for an animal-type page, sub-category for
  // the other four sections).
  const category = (params.get("category") as AdCategory) || "";
  const animalType = params.get("animalType") || "";

  const [region, setRegion] = useState(params.get("region") || "");
  const [label, setLabel] = useState(params.get("label") || "");

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const labelOptions = animalType
    ? DEFAULT_BREEDS[animalType] || []
    : category && category !== "livestock"
      ? SUB_CATEGORIES[category] || []
      : [];
  const labelField: "breed" | "subCategory" | null = animalType
    ? "breed"
    : category && category !== "livestock"
      ? "subCategory"
      : null;

  const title = animalType || (category ? CATEGORY_LABELS[category] : "جميع الإعلانات");

  const filters: AdFilters = useMemo(
    () => ({
      category: category || undefined,
      animalType: animalType || undefined,
      breed: labelField === "breed" ? label || undefined : undefined,
      subCategory: labelField === "subCategory" ? label || undefined : undefined,
      region: region || undefined,
    }),
    [category, animalType, labelField, label, region]
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

  const totalPages = Math.max(1, Math.ceil(ads.length / PAGE_SIZE));
  const pageAds = ads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (category) sp.set("category", category);
    if (animalType) sp.set("animalType", animalType);
    if (region) sp.set("region", region);
    if (label) sp.set("label", label);
    router.push(`?${sp.toString()}`);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <BackButton />
      <h1 className="mb-3 text-xl font-extrabold text-brand-bg-dark">{title}</h1>

      <form
        onSubmit={applySearch}
        className="mb-4 flex h-[55px] items-center gap-2 rounded-xl border border-black/5 bg-white px-2 shadow-sm"
      >
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="h-9 flex-1 rounded-lg border border-black/10 px-2 text-sm outline-none focus:border-brand-secondary"
        >
          <option value="">كل المناطق</option>
          {REGION_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        {labelField && labelOptions.length > 0 && (
          <select
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="h-9 flex-1 rounded-lg border border-black/10 px-2 text-sm outline-none focus:border-brand-secondary"
          >
            <option value="">{labelField === "breed" ? "كل السلالات" : "كل التصنيفات"}</option>
            {labelOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        )}

        <button
          type="submit"
          className="h-9 shrink-0 rounded-lg bg-brand-primary px-4 text-sm font-bold text-white"
        >
          بحث
        </button>
      </form>

      <div className="mb-3 text-sm text-black/50">{ads.length} إعلان</div>

      {loading ? (
        <p className="py-20 text-center text-black/40">جاري التحميل...</p>
      ) : pageAds.length === 0 ? (
        <p className="py-20 text-center text-black/40">لا توجد نتائج مطابقة</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {pageAds.map((ad) => (
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
