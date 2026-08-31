"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { sendResetEmail, resetEmailErrorMessage } from "@/lib/passwordReset";
import BackButton from "@/components/BackButton";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await sendResetEmail(email);
      setSent(true);
    } catch (err) {
      // Don't reveal whether the email is registered.
      if ((err as { code?: string })?.code === "auth/user-not-found") {
        setSent(true);
      } else {
        toast.error(resetEmailErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <BackButton fallbackHref="/login" />
      <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
        {sent ? (
          <>
            <h1 className="mb-2 text-center text-2xl font-extrabold text-brand-primary">
              تحقّق من بريدك
            </h1>
            <p className="mb-6 text-center text-sm leading-relaxed text-black/60">
              إن كان <bdi dir="ltr">{email.trim()}</bdi> مسجّلًا لدينا، فقد أرسلنا
              إليه رابطًا لإعادة تعيين كلمة المرور. افتح الرابط من بريدك (وتحقّق من
              مجلّد المهملات) لضبط كلمة مرور جديدة.
            </p>
            <Link
              href="/login"
              className="block rounded-xl bg-brand-primary py-3 text-center font-bold text-white transition hover:brightness-110"
            >
              العودة لتسجيل الدخول
            </Link>
          </>
        ) : (
          <>
            <h1 className="mb-2 text-center text-2xl font-extrabold text-brand-primary">
              نسيت كلمة المرور؟
            </h1>
            <p className="mb-6 text-center text-sm text-black/50">
              أدخل بريدك الإلكتروني المسجّل وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-left outline-none focus:border-brand-secondary"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-2 rounded-xl bg-brand-primary py-3 font-bold text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {loading ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
