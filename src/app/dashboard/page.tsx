"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listAllAdsAdmin } from "@/lib/ads";
import { listAllUsersAdmin } from "@/lib/users";
import { listRecentReportsAdmin } from "@/lib/reports";
import { Ad, UserProfile, Report } from "@/lib/types";

export default function DashboardOverviewPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listAllAdsAdmin(), listAllUsersAdmin(), listRecentReportsAdmin(10)])
      .then(([a, u, r]) => {
        setAds(a);
        setUsers(u);
        setReports(r);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeAds = ads.filter((a) => a.status === "active").length;
  const flaggedAds = ads.filter((a) => a.status === "flagged").length;
  const openReports = reports.filter((r) => r.status === "open").length;

  const stats = [
    { label: "إجمالي الإعلانات", value: ads.length, icon: "🐐" },
    { label: "إعلانات نشطة", value: activeAds, icon: "✅" },
    { label: "إعلانات مخالفة", value: flaggedAds, icon: "⚠️" },
    { label: "إجمالي المستخدمين", value: users.length, icon: "👥" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-extrabold text-brand-bg-dark">نظرة عامة</h1>

      {loading ? (
        <p className="text-black/40">جاري التحميل...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <div className="text-2xl">{s.icon}</div>
                <div className="mt-2 text-2xl font-extrabold text-brand-primary">{s.value}</div>
                <div className="text-sm text-black/50">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-brand-bg-dark">
                أحدث البلاغات{" "}
                {openReports > 0 && (
                  <span className="ms-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                    {openReports} مفتوح
                  </span>
                )}
              </h2>
              <Link href="/dashboard/reports" className="text-sm font-bold text-brand-primary">
                عرض الكل ←
              </Link>
            </div>

            {reports.length === 0 ? (
              <p className="text-sm text-black/40">لا توجد بلاغات حتى الآن</p>
            ) : (
              <div className="flex flex-col divide-y divide-black/5">
                {reports.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium text-brand-bg-dark">{r.adTitle || r.adId}</p>
                      <p className="text-xs text-black/40">{r.reason}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        r.status === "open"
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {r.status === "open" ? "مفتوح" : "مغلق"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
