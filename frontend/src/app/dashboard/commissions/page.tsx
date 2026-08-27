"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { listCommissionsAdmin, setCommissionStatus } from "@/lib/commissions";
import { Commission, CommissionStatus } from "@/lib/types";

const STATUS_LABEL: Record<CommissionStatus, string> = {
  pending: "قيد المراجعة",
  approved: "مقبول",
  rejected: "مرفوض",
};

const STATUS_COLOR: Record<CommissionStatus, string> = {
  pending: "bg-orange-100 text-orange-600",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};

function formatPrice(n: number) {
  return new Intl.NumberFormat("ar-SA").format(n);
}

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [filter, setFilter] = useState<CommissionStatus | "all">("all");
  const [codeSearch, setCodeSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);

  function refresh() {
    setLoading(true);
    listCommissionsAdmin()
      .then(setCommissions)
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  const normalizedSearch = codeSearch.trim().toLowerCase();
  const filtered = commissions
    .filter((c) => filter === "all" || c.status === filter)
    .filter((c) => !normalizedSearch || (c.adCode || "").toLowerCase().includes(normalizedSearch));

  async function handleStatus(id: string, status: CommissionStatus) {
    await setCommissionStatus(id, status);
    setCommissions((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    toast.success(status === "approved" ? "تم قبول العمولة" : "تم رفض العمولة");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-brand-bg-dark">إدارة العمولات</h1>
        <div className="flex flex-wrap gap-2">
          {(["all", "pending", "approved", "rejected"] as const).map((s) => (
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

      <div>
        <label htmlFor="ad-code-search" className="mb-1 block text-sm font-medium text-black/60">
          بحث برقم الإعلان
        </label>
        <input
          id="ad-code-search"
          type="text"
          dir="ltr"
          value={codeSearch}
          onChange={(e) => setCodeSearch(e.target.value)}
          placeholder="AD-2026-000123"
          className="w-full max-w-xs rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-brand-secondary"
        />
      </div>

      {loading ? (
        <p className="text-black/40">جاري التحميل...</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/10 py-10 text-center text-black/40">
          لا توجد عمليات بيع مسجّلة
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-right">
              <tr>
                <th className="px-4 py-3">الإعلان</th>
                <th className="px-4 py-3">رقم الإعلان</th>
                <th className="px-4 py-3">البائع</th>
                <th className="px-4 py-3">قيمة البيع</th>
                <th className="px-4 py-3">العمولة</th>
                <th className="px-4 py-3">طريقة الدفع</th>
                <th className="px-4 py-3">الإيصال</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">
                    <Link href={`/ad?id=${c.adId}`} className="font-medium text-brand-primary">
                      {c.adTitle || c.adId}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <bdi>{c.adCode || "—"}</bdi>
                  </td>
                  <td className="px-4 py-3">{c.sellerName}</td>
                  <td className="px-4 py-3">{formatPrice(c.saleAmount)} ريال</td>
                  <td className="px-4 py-3">
                    {formatPrice(c.commissionAmount)} ريال
                    <span className="text-black/40"> ({c.commissionRate}%)</span>
                  </td>
                  <td className="px-4 py-3">{c.paymentMethod === "applepay" ? "Apple Pay" : "تحويل بنكي"}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setPreview(c.receiptFile)}
                      className="font-bold text-brand-primary underline"
                    >
                      عرض
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${STATUS_COLOR[c.status]}`}>
                      {STATUS_LABEL[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatus(c.id, "approved")}
                          className="text-xs font-bold text-green-600"
                        >
                          قبول
                        </button>
                        <button
                          onClick={() => handleStatus(c.id, "rejected")}
                          className="text-xs font-bold text-red-600"
                        >
                          رفض
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreview(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="إيصال الدفع" className="max-h-[85vh] max-w-full rounded-xl" />
        </div>
      )}
    </div>
  );
}
