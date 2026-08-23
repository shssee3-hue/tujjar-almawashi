"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { listBreeds, addBreed, removeBreed } from "@/lib/breeds";
import { Breed } from "@/lib/types";
import { ANIMAL_TYPES, DEFAULT_BREEDS } from "@/lib/constants";

export default function AdminBreedsPage() {
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [animalType, setAnimalType] = useState(ANIMAL_TYPES[0]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  function refresh() {
    listBreeds()
      .then(setBreeds)
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await addBreed(animalType, name.trim());
    toast.success("تمت إضافة السلالة");
    setName("");
    refresh();
  }

  async function handleRemove(id: string) {
    await removeBreed(id);
    setBreeds((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-brand-bg-dark">إدارة السلالات</h1>

      <form
        onSubmit={handleAdd}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">نوع الحيوان</label>
          <select
            value={animalType}
            onChange={(e) => setAnimalType(e.target.value)}
            className="rounded-xl border border-black/10 px-4 py-2"
          >
            {ANIMAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">اسم السلالة</label>
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
        السلالات الافتراضية المدمجة بالنظام تظهر دائمًا في النماذج؛ السلالات المضافة هنا تُستخدم لتوسيعها.
      </p>

      {loading ? (
        <p className="text-black/40">جاري التحميل...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {ANIMAL_TYPES.map((type) => {
            const custom = breeds.filter((b) => b.animalType === type);
            const defaults = DEFAULT_BREEDS[type] || [];
            return (
              <div key={type} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <h3 className="mb-3 font-bold text-brand-primary">{type}</h3>
                <div className="flex flex-wrap gap-2">
                  {defaults.map((d) => (
                    <span key={d} className="rounded-full bg-black/5 px-3 py-1 text-xs">
                      {d}
                    </span>
                  ))}
                  {custom.map((b) => (
                    <span
                      key={b.id}
                      className="flex items-center gap-1 rounded-full bg-brand-secondary/20 px-3 py-1 text-xs text-brand-primary"
                    >
                      {b.name}
                      <button onClick={() => handleRemove(b.id)} className="font-bold">
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
