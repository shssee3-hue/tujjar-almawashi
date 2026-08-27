"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { resetPasswordWithOtp, passwordResetErrorMessage } from "@/lib/passwordReset";
import BackButton from "@/components/BackButton";
import PasswordInput from "@/components/PasswordInput";

function validatePassword(pw: string): string | null {
  if (pw.length < 6) return "كلمة المرور يجب ألا تقل عن 6 خانات";
  if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) return "يجب أن تحتوي على أرقام وحروف";
  return null;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [resetId, setResetId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setResetId(sp.get("resetId") || "");
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validatePassword(password);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (password !== confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }
    if (!resetId) {
      toast.error("طلب غير صالح، يرجى البدء من جديد");
      return;
    }
    setLoading(true);
    try {
      await resetPasswordWithOtp(resetId, password);
      toast.success("تم تغيير كلمة المرور بنجاح، يمكنك الآن تسجيل الدخول");
      router.push("/login");
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
        <h1 className="mb-6 text-center text-2xl font-extrabold text-brand-primary">
          إعادة تعيين كلمة المرور
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">كلمة المرور الجديدة</label>
            <PasswordInput
              required
              minLength={6}
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-black/40">
              6 خانات على الأقل، وتحتوي على أرقام وحروف
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">تأكيد كلمة المرور</label>
            <PasswordInput
              required
              minLength={6}
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-xl bg-brand-primary py-3 font-bold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "جاري الحفظ..." : "حفظ كلمة المرور الجديدة"}
          </button>
        </form>
      </div>
    </div>
  );
}
