"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createReport } from "@/lib/reports";
import { REPORT_REASONS } from "@/lib/constants";

export default function ReportButton({ adId, adTitle }: { adId: string; adTitle: string }) {
  const { firebaseUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!firebaseUser) {
      toast.error("يجب تسجيل الدخول لتقديم بلاغ");
      return;
    }
    setLoading(true);
    try {
      await createReport({ adId, adTitle, reporterId: firebaseUser.uid, reason });
      toast.success("تم البلاغ");
      setOpen(false);
    } catch {
      toast.error("تعذر إرسال البلاغ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-red-600 underline hover:text-red-700"
      >
        🚩 إبلاغ عن هذا الإعلان
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <h3 className="mb-4 font-bold text-brand-bg-dark">سبب البلاغ</h3>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mb-4 w-full rounded-lg border border-black/10 px-3 py-2"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={submit}
                disabled={loading}
                className="flex-1 rounded-lg bg-red-600 py-2 font-bold text-white disabled:opacity-50"
              >
                {loading ? "جاري الإرسال..." : "إرسال البلاغ"}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-black/10 py-2 font-medium"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
