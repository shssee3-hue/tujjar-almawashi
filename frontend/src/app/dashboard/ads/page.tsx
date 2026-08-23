"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { listAllAdsAdmin, updateAd, hardDeleteAd } from "@/lib/ads";
import { listRecentReportsAdmin } from "@/lib/reports";
import { Ad, AdStatus, Report } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";

type ReportBadge = { label: string; color: string } | null;

function reportBadgeFor(ad: Ad, reportsByAd: Record<string, Report[]>): ReportBadge {
  if (ad.status === "flagged") return { label: "مخالف", color: "bg-red-100 text-red-600" };
  const reports = reportsByAd[ad.id] || [];
  if (reports.length === 0) return null;
  if (reports.some((r) => r.status === "open")) {
    return { label: "مفتوح", color: "bg-orange-100 text-orange-600" };
  }
  return { label: "مغلق", color: "bg-black/10 text-black/50" };
}

const STATUS_LABEL: Record<AdStatus, string> = {
  active: "نشط",
  ended: "منتهي",
  flagged: "مخالف",
  deleted: "محذوف",
};

const STATUS_COLOR: Record<AdStatus, string> = {
  active: "bg-green-100 text-green-700",
  ended: "bg-black/10 text-black/60",
  flagged: "bg-red-100 text-red-600",
  deleted: "bg-black/10 text-black/40",
};

export default function AdminAdsPage() {
  const { isSystemOwner } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [reportsByAd, setReportsByAd] = useState<Record<string, Report[]>>({});
  const [filter, setFilter] = useState<AdStatus | "all">("all");
  const [loading, setLoading] = useState(true);

  function refresh() {
    setLoading(true);
    Promise.all([listAllAdsAdmin(), listRecentReportsAdmin(500)])
      .then(([adsRes, reportsRes]) => {
        setAds(adsRes);
        const grouped: Record<string, Report[]> = {};
        for (const r of reportsRes) {
          (grouped[r.adId] ||= []).push(r);
        }
        setReportsByAd(grouped);
      })
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  const filtered = filter === "all" ? ads : ads.filter((a) => a.status === filter);

  async function setStatus(id: string, status: AdStatus) {
    await updateAd(id, { status });
    setAds((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    toast.success("تم تحديث حالة الإعلان");
  }

  async function toggleFeatured(ad: Ad) {
    await updateAd(ad.id, { featured: !ad.featured });
    setAds((prev) => prev.map((a) => (a.id === ad.id ? { ...a, featured: !a.featured } : a)));
  }

  async function permanentDelete(id: string) {
    if (!confirm("حذف نهائي لهذا الإعلان؟ لا يمكن التراجع.")) return;
    await hardDeleteAd(id);
    setAds((prev) => prev.filter((a) => a.id !== id));
    toast.success("تم الحذف النهائي");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-brand-bg-dark">إدارة الإعلانات</h1>
        <div className="flex flex-wrap gap-2">
          {(["all", "active", "flagged", "ended", "deleted"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-4 py-1.5 text-sm font-bold ${
                filter === s ? "bg-brand-primary text-white" : "bg-white text-black/50"
              }`}
            >
              {s === "all" ? "الكل" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-black/40">جاري التحميل...</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-right">
              <tr>
                <th className="px-4 py-3">الإعلان</th>
                <th className="px-4 py-3">القسم</th>
                <th className="px-4 py-3">البائع</th>
                <th className="px-4 py-3">السعر</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">مميز</th>
                <th className="px-4 py-3">حالة البلاغ</th>
                <th className="px-4 py-3">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filtered.map((ad) => (
                <tr key={ad.id}>
                  <td className="px-4 py-3">
                    <Link href={`/ad?id=${ad.id}`} className="font-medium text-brand-primary">
                      {ad.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-black/50">{CATEGORY_LABELS[ad.category]}</td>
                  <td className="px-4 py-3">{ad.sellerName}</td>
                  <td className="px-4 py-3">{ad.price} ريال</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${STATUS_COLOR[ad.status]}`}>
                      {STATUS_LABEL[ad.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleFeatured(ad)}>
                      {ad.featured ? "⭐" : "☆"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const badge = reportBadgeFor(ad, reportsByAd);
                      return badge ? (
                        <span className={`rounded-full px-2 py-1 text-xs font-bold ${badge.color}`}>
                          {badge.label} ({ad.reportsCount})
                        </span>
                      ) : (
                        <span className="text-black/30">—</span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {ad.status !== "flagged" && (
                        <button
                          onClick={() => setStatus(ad.id, "flagged")}
                          className="text-xs font-bold text-orange-600"
                        >
                          وضع كمخالف
                        </button>
                      )}
                      {ad.status !== "active" && (
                        <button
                          onClick={() => setStatus(ad.id, "active")}
                          className="text-xs font-bold text-green-600"
                        >
                          تفعيل
                        </button>
                      )}
                      {ad.status !== "ended" && (
                        <button
                          onClick={() => setStatus(ad.id, "ended")}
                          className="text-xs font-bold text-black/50"
                        >
                          إنهاء
                        </button>
                      )}
                      {isSystemOwner && (
                        <button
                          onClick={() => permanentDelete(ad.id)}
                          className="text-xs font-bold text-red-600"
                        >
                          حذف نهائي
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="py-10 text-center text-black/40">لا توجد إعلانات في هذا التصنيف</p>
          )}
        </div>
      )}
    </div>
  );
}
