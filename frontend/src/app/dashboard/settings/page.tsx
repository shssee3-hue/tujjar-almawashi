"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getSiteSettings, saveSiteSettings } from "@/lib/settings";
import { SiteSettings } from "@/lib/types";
import OwnerGuard from "@/components/OwnerGuard";

function SettingsContent() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSiteSettings().then(setSettings);
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      await saveSiteSettings(settings);
      toast.success("تم حفظ الإعدادات");
    } catch {
      toast.error("تعذر حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return <p className="py-10 text-center text-black/40">جاري التحميل...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-brand-bg-dark">إعدادات الموقع</h1>

      <form
        onSubmit={handleSave}
        className="flex flex-col gap-5 rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:max-w-lg"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">اسم الموقع</label>
          <input
            value={settings.siteName}
            onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">سعر الإعلان المميز (ريال)</label>
          <input
            type="number"
            value={settings.featuredAdPrice}
            onChange={(e) =>
              setSettings({ ...settings, featuredAdPrice: Number(e.target.value) })
            }
            className="w-full rounded-xl border border-black/10 px-4 py-2.5"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">رقم الدعم الفني</label>
          <input
            dir="ltr"
            value={settings.supportPhone}
            onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-right"
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={settings.maintenanceMode}
            onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
          />
          وضع الصيانة (إخفاء الموقع مؤقتًا عن الزوار)
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-brand-primary py-3 font-bold text-white disabled:opacity-50"
        >
          {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </button>
      </form>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <OwnerGuard>
      <SettingsContent />
    </OwnerGuard>
  );
}
