"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getSiteSettings, saveSiteSettings } from "@/lib/settings";
import { SiteSettings } from "@/lib/types";
import OwnerGuard from "@/components/OwnerGuard";

function OathTextContent() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSiteSettings().then(setSettings);
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    if (!settings.oathText.trim()) {
      toast.error("لا يمكن حفظ نص فارغ");
      return;
    }
    setSaving(true);
    try {
      await saveSiteSettings(settings);
      toast.success("تم حفظ النص — سيظهر فورًا لجميع المستخدمين");
    } catch {
      toast.error("تعذر حفظ النص");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return <p className="py-10 text-center text-black/40">جاري التحميل...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-bg-dark">
          نص القسم الإلزامي قبل نشر الإعلان
        </h1>
        <p className="mt-1 text-sm text-black/50">
          هذا النص يظهر كخانة موافقة إلزامية في شاشة معاينة كل إعلان، في جميع
          الأقسام، ولا يمكن لأي مستخدم نشر إعلانه قبل تفعيلها.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="flex flex-col gap-4 rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:max-w-xl"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">النص</label>
          <textarea
            required
            rows={5}
            value={settings.oathText}
            onChange={(e) => setSettings({ ...settings, oathText: e.target.value })}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-brand-primary py-3 font-bold text-white disabled:opacity-50"
        >
          {saving ? "جاري الحفظ..." : "حفظ"}
        </button>
      </form>
    </div>
  );
}

export default function OathTextPage() {
  return (
    <OwnerGuard>
      <OathTextContent />
    </OwnerGuard>
  );
}
