"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { requestPasswordResetOtp, passwordResetErrorMessage } from "@/lib/passwordReset";
import BackButton from "@/components/BackButton";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { resetId, expiresAt } = await requestPasswordResetOtp(phone.trim());
      toast.success("تم إرسال رمز التحقق عبر رسالة نصية");
      router.push(
        `/forgot-password/verify?resetId=${encodeURIComponent(resetId)}&phone=${encodeURIComponent(
          phone.trim()
        )}&expiresAt=${expiresAt}`
      );
    } catch (err) {
      toast.error(passwordResetErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <BackButton fallbackHref="/login" />
      <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-center text-2xl font-extrabold text-brand-primary">
          نسيت كلمة المرور؟
        </h1>
        <p className="mb-6 text-center text-sm text-black/50">
          أدخل رقم جوالك المسجّل في المنصة، وسنرسل لك رمز تحقق لإعادة تعيين كلمة المرور.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">رقم الجوال</label>
            <input
              type="tel"
              required
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05xxxxxxxx"
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-xl bg-brand-primary py-3 font-bold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "جاري الإرسال..." : "إرسال رمز التحقق"}
          </button>
        </form>
      </div>
    </div>
  );
}
