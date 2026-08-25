"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  listAdditionalServices,
  addAdditionalService,
  updateAdditionalService,
  removeAdditionalService,
} from "@/lib/services";
import { AdditionalService, AdCategory } from "@/lib/types";
import { CATEGORIES, CATEGORY_LABELS, SUB_CATEGORIES } from "@/lib/constants";

const SERVICE_CATEGORIES = CATEGORIES.filter((c) => c.key !== "livestock");

export default function AdminServicesPage() {
  const [services, setServices] = useState<AdditionalService[]>([]);
  const [category, setCategory] = useState<AdditionalService["category"]>(
    SERVICE_CATEGORIES[0].key as AdditionalService["category"]
  );
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  function refresh() {
    listAdditionalServices()
      .then(setServices)
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await addAdditionalService(category, name.trim());
    toast.success("تمت إضافة الخدمة");
    setName("");
    refresh();
  }

  async function handleRemove(id: string) {
    await removeAdditionalService(id);
    setServices((prev) => prev.filter((s) => s.id !== id));
  }

  function startEdit(s: AdditionalService) {
    setEditingId(s.id);
    setEditingName(s.name);
  }

  async function saveEdit(id: string) {
    if (!editingName.trim()) return;
    await updateAdditionalService(id, editingName.trim());
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, name: editingName.trim() } : s)));
    setEditingId(null);
    toast.success("تم تحديث الخدمة");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-bg-dark">
          إدارة الخدمات الإضافية للأقسام
        </h1>
        <p className="mt-1 text-sm text-black/50">
          الخدمات المضافة هنا تظهر فورًا في شريط البحث وفي نموذج إضافة إعلان،
          ضمن التصنيف الفرعي للقسم المرتبطة به.
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">القسم</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as AdditionalService["category"])}
            className="rounded-xl border border-black/10 px-4 py-2"
          >
            {SERVICE_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">اسم الخدمة</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-2"
          />
        </div>
        <button type="submit" className="rounded-xl bg-brand-primary px-6 py-2 font-bold text-white">
          إضافة
        </button>
      </form>

      <p className="text-sm text-black/40">
        التصنيفات الافتراضية المدمجة بالنظام تظهر دائمًا في النماذج؛ الخدمات
        المضافة هنا تُستخدم لتوسيعها.
      </p>

      {loading ? (
        <p className="text-black/40">جاري التحميل...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {SERVICE_CATEGORIES.map((c) => {
            const custom = services.filter((s) => s.category === c.key);
            const defaults = SUB_CATEGORIES[c.key as Exclude<AdCategory, "livestock">] || [];
            return (
              <div key={c.key} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <h3 className="mb-3 font-bold text-brand-primary">{CATEGORY_LABELS[c.key]}</h3>
                <div className="flex flex-wrap gap-2">
                  {defaults.map((d) => (
                    <span key={d} className="rounded-full bg-black/5 px-3 py-1 text-xs">
                      {d}
                    </span>
                  ))}
                  {custom.map((s) =>
                    editingId === s.id ? (
                      <span
                        key={s.id}
                        className="flex items-center gap-1 rounded-full bg-brand-secondary/20 px-2 py-1 text-xs text-brand-primary"
                      >
                        <input
                          autoFocus
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveEdit(s.id)}
                          className="w-24 rounded border border-brand-primary/30 bg-white px-1.5 py-0.5 outline-none"
                        />
                        <button onClick={() => saveEdit(s.id)} className="font-bold">
                          ✓
                        </button>
                        <button onClick={() => setEditingId(null)} className="font-bold">
                          ✕
                        </button>
                      </span>
                    ) : (
                      <span
                        key={s.id}
                        className="flex items-center gap-1 rounded-full bg-brand-secondary/20 px-3 py-1 text-xs text-brand-primary"
                      >
                        {s.name}
                        <button onClick={() => startEdit(s)} className="font-bold">
                          ✏️
                        </button>
                        <button onClick={() => handleRemove(s.id)} className="font-bold">
                          ✕
                        </button>
                      </span>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
