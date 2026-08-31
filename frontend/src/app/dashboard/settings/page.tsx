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

        <hr className="border-black/10" />
        <h2 className="-mb-2 font-bold text-brand-bg-dark">نظام العمولة</h2>

        <div>
          <label className="mb-1 block text-sm font-medium">نسبة العمولة (%)</label>
          <input
            type="number"
            step="0.1"
            value={settings.commissionRate}
            onChange={(e) =>
              setSettings({ ...settings, commissionRate: Number(e.target.value) })
            }
            className="w-full rounded-xl border border-black/10 px-4 py-2.5"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">رقم الحساب البنكي</label>
          <input
            dir="ltr"
            value={settings.bankAccountNumber}
            onChange={(e) => setSettings({ ...settings, bankAccountNumber: e.target.value })}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-right"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">رابط Apple Pay</label>
          <input
            dir="ltr"
            value={settings.applePayLink}
            onChange={(e) => setSettings({ ...settings, applePayLink: e.target.value })}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-right"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            الصيغة القانونية المعتمدة للعمولة
          </label>
          <textarea
            rows={8}
            value={settings.commissionText}
            onChange={(e) => setSettings({ ...settings, commissionText: e.target.value })}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5"
          />
        </div>

        <hr className="border-black/10" />
        <h2 className="-mb-2 font-bold text-brand-bg-dark">
          نص إلزامي — قسمَي «خدمات» و«نقل مواشي»
        </h2>
        <p className="-mt-3 text-xs text-black/40">
          يظهر كخانة ثابتة غير قابلة للتعديل داخل نموذج إضافة الإعلان، فقط
          عند اختيار أحد هذين القسمين — لا يقدر المستخدم يمسحه أو يغيّره،
          ولا يمكن نشر الإعلان بدونه.
        </p>
        <div>
          <label className="mb-1 block text-sm font-medium">النص</label>
          <textarea
            rows={5}
            value={settings.servicesTransportNoticeText}
            onChange={(e) =>
              setSettings({ ...settings, servicesTransportNoticeText: e.target.value })
            }
            className="w-full rounded-xl border border-black/10 px-4 py-2.5"
          />
        </div>

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
