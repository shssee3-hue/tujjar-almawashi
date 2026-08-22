"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { listRegions, addRegionCity, removeRegionCity } from "@/lib/regions";
import { RegionCity } from "@/lib/types";
import { DEFAULT_REGIONS } from "@/lib/constants";

export default function AdminRegionsPage() {
  const [items, setItems] = useState<RegionCity[]>([]);
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);

  function refresh() {
    listRegions()
      .then(setItems)
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!region.trim() || !city.trim()) return;
    await addRegionCity(region.trim(), city.trim());
    toast.success("تمت إضافة المدينة");
    setCity("");
    refresh();
  }

  async function handleRemove(id: string) {
    await removeRegionCity(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-brand-bg-dark">إدارة المناطق والمدن</h1>

      <form
        onSubmit={handleAdd}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">المنطقة</label>
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="rounded-xl border border-black/10 px-4 py-2"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">المدينة</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-2"
          />
        </div>
        <button type="submit" className="rounded-xl bg-brand-primary px-6 py-2 font-bold text-white">
          إضافة
        </button>
      </form>

      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <h3 className="mb-3 font-bold text-brand-primary">المناطق الافتراضية (السعودية)</h3>
        <div className="flex flex-wrap gap-2">
          {(DEFAULT_REGIONS["السعودية"] || []).map((r) => (
            <span key={r} className="rounded-full bg-black/5 px-3 py-1 text-xs">
              {r}
            </span>
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
                <th className="px-4 py-3">المنطقة</th>
                <th className="px-4 py-3">المدينة</th>
                <th className="px-4 py-3">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {items.map((i) => (
                <tr key={i.id}>
                  <td className="px-4 py-3">{i.region}</td>
                  <td className="px-4 py-3">{i.city}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleRemove(i.id)} className="text-xs font-bold text-red-600">
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <p className="py-10 text-center text-black/40">لم تتم إضافة مدن مخصصة بعد</p>
          )}
        </div>
      )}
    </div>
  );
}
