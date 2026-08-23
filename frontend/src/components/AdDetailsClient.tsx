"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAd, incrementViews, listSimilarAds, deleteAd } from "@/lib/ads";
import { Ad } from "@/lib/types";
import ImageGallery from "@/components/ImageGallery";
import ReportButton from "@/components/ReportButton";
import AdCard from "@/components/AdCard";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-SA").format(price);
}

export default function AdDetailsClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const router = useRouter();
  const { firebaseUser, isAdmin } = useAuth();
  const [ad, setAd] = useState<Ad | null | undefined>(undefined);
  const [similar, setSimilar] = useState<Ad[]>([]);

  useEffect(() => {
    if (!id) {
      setAd(null);
      return;
    }
    getAd(id).then((res) => {
      setAd(res);
      if (res) {
        incrementViews(id);
        listSimilarAds(res).then(setSimilar);
      }
    });
  }, [id]);

  if (ad === undefined) {
    return <p className="py-24 text-center text-black/40">جاري التحميل...</p>;
  }

  if (ad === null || ad.status === "deleted") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <BackButton fallbackHref="/ads" />
        <div className="py-16 text-center">
          <p className="mb-4 text-black/50">هذا الإعلان غير موجود أو تم حذفه</p>
          <Link href="/ads" className="font-bold text-brand-primary">
            العودة لجميع الإعلانات
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = firebaseUser?.uid === ad.sellerId;
  const mapQuery = encodeURIComponent(`${ad.city} ${ad.region} ${ad.country}`);

  async function handleDelete() {
    if (!confirm("هل أنت متأكد من حذف هذا الإعلان؟")) return;
    await deleteAd(ad!.id);
    toast.success("تم حذف الإعلان");
    router.push("/profile");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <BackButton fallbackHref="/ads" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <ImageGallery images={ad.images} alt={ad.title} />

          <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-2xl font-extrabold text-brand-bg-dark">{ad.title}</h1>
              {ad.status !== "active" && (
                <span className="rounded-full bg-black/10 px-3 py-1 text-xs font-bold">
                  {ad.status === "ended" ? "منتهي" : ad.status === "flagged" ? "مخالف" : ad.status}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-black/50">
              {ad.city}، {ad.region} — {ad.country}
            </p>

            <div className="mt-4 flex items-center gap-4">
              <span className="text-3xl font-extrabold text-brand-primary">
                {formatPrice(ad.price)} ريال
              </span>
              {ad.isNegotiable && (
                <span className="rounded-full bg-brand-secondary/20 px-3 py-1 text-xs font-bold text-brand-primary">
                  قابل للتفاوض
                </span>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-black/5 bg-white p-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-black/40">النوع</p>
                <p className="font-bold">{ad.animalType}</p>
              </div>
              <div>
                <p className="text-black/40">السلالة</p>
                <p className="font-bold">{ad.breed}</p>
              </div>
              <div>
                <p className="text-black/40">العمر</p>
                <p className="font-bold">{ad.age}</p>
              </div>
              <div>
                <p className="text-black/40">الوزن</p>
                <p className="font-bold">{ad.weight ? `${ad.weight} كجم` : "—"}</p>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="mb-2 font-bold text-brand-bg-dark">الوصف</h2>
              <p className="whitespace-pre-line leading-relaxed text-black/70">
                {ad.description}
              </p>
            </div>

            <div className="mt-6">
              <h2 className="mb-2 font-bold text-brand-bg-dark">الموقع</h2>
              <div className="overflow-hidden rounded-2xl border border-black/5">
                <iframe
                  title="خريطة الموقع"
                  width="100%"
                  height="260"
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${mapQuery}&z=10&output=embed`}
                />
              </div>
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-bold text-brand-bg-dark">معلومات البائع</h2>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-xl font-bold text-brand-primary">
              {ad.sellerName?.[0] || "؟"}
            </div>
            <div>
              <p className="font-bold">{ad.sellerName}</p>
              <p className="text-xs text-black/40">
                {ad.sellerType === "trader" ? "تاجر" : "فرد"} · تقييم {ad.sellerRating || 0}/5
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <a
              href={`tel:${ad.phoneNumber}`}
              className="rounded-xl bg-brand-primary py-3 text-center font-bold text-white hover:brightness-110"
            >
              📞 اتصال: {ad.phoneNumber}
            </a>
            {ad.whatsapp && (
              <a
                href={`https://wa.me/${ad.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-green-600 py-3 text-center font-bold text-white hover:brightness-110"
              >
                💬 واتساب
              </a>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-2 border-t border-black/5 pt-4">
            {isOwner && (
              <Link
                href={`/add-ad?edit=${ad.id}`}
                className="text-sm font-medium text-brand-primary"
              >
                ✏️ تعديل الإعلان
              </Link>
            )}
            {(isOwner || isAdmin) && (
              <button
                onClick={handleDelete}
                className="text-start text-sm font-medium text-red-600"
              >
                🗑️ حذف الإعلان
              </button>
            )}
            {!isOwner && <ReportButton adId={ad.id} adTitle={ad.title} />}
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-xl font-extrabold text-brand-bg-dark">إعلانات مشابهة</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((s) => (
              <AdCard key={s.id} ad={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
