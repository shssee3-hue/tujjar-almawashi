"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { listRecentReportsAdmin, closeReport, deleteReport } from "@/lib/reports";
import { Report } from "@/lib/types";

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listRecentReportsAdmin(200)
      .then(setReports)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? reports : reports.filter((r) => r.status === filter);

  async function handleClose(id: string) {
    await closeReport(id);
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: "closed" } : r)));
    toast.success("تم إغلاق البلاغ");
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف هذا البلاغ نهائيًا؟ لا يمكن التراجع.")) return;
    await deleteReport(id);
    setReports((prev) => prev.filter((r) => r.id !== id));
    toast.success("تم حذف البلاغ");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-brand-bg-dark">إدارة البلاغات</h1>
        <div className="flex gap-2">
          {(["all", "open", "closed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-4 py-1.5 text-sm font-bold ${
                filter === s ? "bg-brand-primary text-white" : "bg-white text-black/50"
              }`}
            >
              {s === "all" ? "الكل" : s === "open" ? "مفتوح" : "مغلق"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-black/40">جاري التحميل...</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/10 py-10 text-center text-black/40">
          لا توجد بلاغات
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/ad?id=${r.adId}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter") router.push(`/ad?id=${r.adId}`);
              }}
              title="اضغط للانتقال إلى الإعلان"
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
            >
              <div>
                <Link
                  href={`/ad?id=${r.adId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-bold text-brand-primary hover:underline"
                >
                  {r.adTitle || r.adId}
                </Link>
                <p className="text-sm text-black/50">{r.reason}</p>
                <p className="text-xs text-black/30">
                  {new Date(r.createdAt).toLocaleString("ar-SA")}
                </p>
              </div>
              <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    r.status === "open" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
                  }`}
                >
                  {r.status === "open" ? "مفتوح" : "مغلق"}
                </span>
                {r.status === "open" && (
                  <button
                    onClick={() => handleClose(r.id)}
                    className="text-sm font-bold text-brand-primary"
                  >
                    إغلاق البلاغ
                  </button>
                )}
                {r.status === "closed" && (
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="text-sm font-bold text-red-600"
                  >
                    حذف البلاغ
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
