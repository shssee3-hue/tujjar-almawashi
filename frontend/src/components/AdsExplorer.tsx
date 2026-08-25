"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { listAds, AdFilters } from "@/lib/ads";
import { listBreeds } from "@/lib/breeds";
import { listAdditionalServices } from "@/lib/services";
import { Ad, AdCategory, Breed, AdditionalService } from "@/lib/types";
import AdCard from "@/components/AdCard";
import Pagination from "@/components/Pagination";
import BackButton from "@/components/BackButton";
import {
  DEFAULT_BREEDS,
  DEFAULT_REGIONS,
  CATEGORY_LABELS,
  SUB_CATEGORIES,
  SECTION_OPTIONS,
} from "@/lib/constants";

const PAGE_SIZE = 12;
const REGION_OPTIONS = DEFAULT_REGIONS["السعودية"] || [];

function uniq(list: string[]) {
  return Array.from(new Set(list));
}

export default function AdsExplorer() {
  const router = useRouter();
  const params = useSearchParams();

  // animalType/category are kept as the authoritative filter state (not
  // derived from SECTION_OPTIONS) specifically so a link to a pre-rename
  // value — e.g. animalType=="أغنام" from before the "الضأن" rename, still
  // present on real ads — keeps filtering correctly even though it no
  // longer has a matching entry in SECTION_OPTIONS. The dropdown's value is
  // derived from these below, with that legacy value injected back into its
  // options list so it still displays as selected instead of reverting to
  // "كل الأقسام".
  const [animalType, setAnimalType] = useState("");
  const [category, setCategory] = useState<AdCategory | "">("");
  const [region, setRegion] = useState("");
  const [label, setLabel] = useState("");

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setAnimalType(sp.get("animalType") || "");
    setCategory((sp.get("category") as AdCategory) || "");
    setRegion(sp.get("region") || "");
    setLabel(sp.get("label") || "");
  }, [params]);

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Admin-added breeds/services (from /dashboard/breeds and
  // /dashboard/services) — merged with the hardcoded defaults below so a
  // new addition shows up here immediately, not just on the admin page.
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [services, setServices] = useState<AdditionalService[]>([]);

  useEffect(() => {
    listBreeds().then(setBreeds).catch(() => {});
    listAdditionalServices().then(setServices).catch(() => {});
  }, []);

  const section = animalType || category;
  // Inject a legacy/unrecognized value (like "أغنام") so the select still
  // shows it as selected rather than silently reverting to "كل الأقسام".
  const sectionOptions = !section || SECTION_OPTIONS.some((o) => o.value === section)
    ? SECTION_OPTIONS
    : [...SECTION_OPTIONS, { value: section, label: section, isAnimalType: !!animalType }];

  const labelField: "breed" | "subCategory" | null = animalType
    ? "breed"
    : category
      ? "subCategory"
      : null;
  const labelOptions =
    labelField === "breed"
      ? uniq([
          ...(DEFAULT_BREEDS[animalType] || []),
          ...breeds.filter((b) => b.animalType === animalType).map((b) => b.name),
        ])
      : labelField === "subCategory"
        ? uniq([
            ...(SUB_CATEGORIES[category as Exclude<AdCategory, "livestock">] || []),
            ...services.filter((s) => s.category === category).map((s) => s.name),
          ])
        : [];

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
    if (animalType) sp.set("animalType", animalType);
    else if (category) sp.set("category", category);
    if (region) sp.set("region", region);
    if (label) sp.set("label", label);
    router.push(`?${sp.toString()}`);
  }

  function handleSectionChange(value: string) {
    setLabel("");
    if (!value) {
      setAnimalType("");
      setCategory("");
      return;
    }
    const opt = sectionOptions.find((o) => o.value === value);
    if (opt?.isAnimalType) {
      setAnimalType(value);
      setCategory("");
    } else {
      setCategory(value as AdCategory);
      setAnimalType("");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <BackButton />
      <h1 className="mb-3 text-xl font-extrabold text-brand-bg-dark">{title}</h1>

      <form
        onSubmit={applySearch}
        className="mb-4 flex h-[55px] flex-nowrap items-center gap-1 rounded-xl border border-black/5 bg-white px-1.5 shadow-sm sm:gap-2 sm:px-2"
      >
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="h-9 min-w-0 flex-1 rounded-lg border border-black/10 px-1.5 text-xs outline-none focus:border-brand-secondary sm:px-2 sm:text-sm"
        >
          <option value="">كل المناطق</option>
          {REGION_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={section}
          onChange={(e) => handleSectionChange(e.target.value)}
          className="h-9 min-w-0 flex-1 rounded-lg border border-black/10 px-1.5 text-xs outline-none focus:border-brand-secondary sm:px-2 sm:text-sm"
        >
          <option value="">كل الأقسام</option>
          {sectionOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {labelField && labelOptions.length > 0 && (
          <select
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="h-9 min-w-0 flex-1 rounded-lg border border-black/10 px-1.5 text-xs outline-none focus:border-brand-secondary sm:px-2 sm:text-sm"
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
          className="h-9 shrink-0 rounded-lg bg-brand-primary px-2.5 text-xs font-bold text-white sm:px-4 sm:text-sm"
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
