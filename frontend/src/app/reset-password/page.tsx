"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  verifyResetCode,
  completePasswordReset,
  resetConfirmErrorMessage,
} from "@/lib/passwordReset";
import BackButton from "@/components/BackButton";
import PasswordInput from "@/components/PasswordInput";

type Status = "checking" | "valid" | "invalid" | "done";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode") || "";
  const [status, setStatus] = useState<Status>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!oobCode) {
      setStatus("invalid");
      return;
    }
    verifyResetCode(oobCode)
      .then((addr) => {
        setEmail(addr);
        setStatus("valid");
      })
      .catch(() => setStatus("invalid"));
  }, [oobCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }
    setSubmitting(true);
    try {
      await completePasswordReset(oobCode, password);
      setStatus("done");
    } catch (err) {
      toast.error(resetConfirmErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <BackButton fallbackHref="/login" />
      <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
        {status === "checking" && (
          <p className="py-10 text-center text-black/58">جاري التحقّق من الرابط...</p>
        )}

        {status === "invalid" && (
          <>
            <h1 className="mb-2 text-center text-2xl font-extrabold text-brand-primary">
              الرابط غير صالح
            </h1>
            <p className="mb-6 text-center text-sm leading-relaxed text-black/78">
              انتهت صلاحية رابط إعادة التعيين أو تم استخدامه من قبل. يرجى طلب
              رابط جديد.
            </p>
            <Link
              href="/forgot-password"
              className="block rounded-xl bg-brand-primary py-3 text-center font-bold text-white transition hover:brightness-110"
            >
              طلب رابط جديد
            </Link>
          </>
        )}

        {status === "done" && (
          <>
            <h1 className="mb-2 text-center text-2xl font-extrabold text-brand-primary">
              تم تعيين كلمة المرور
            </h1>
            <p className="mb-6 text-center text-sm leading-relaxed text-black/78">
              يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
            </p>
            <Link
              href="/login"
              className="block rounded-xl bg-brand-primary py-3 text-center font-bold text-white transition hover:brightness-110"
            >
              تسجيل الدخول
            </Link>
          </>
        )}

        {status === "valid" && (
          <>
            <h1 className="mb-2 text-center text-2xl font-extrabold text-brand-primary">
              تعيين كلمة مرور جديدة
            </h1>
            <p className="mb-6 text-center text-sm text-black/68">
              للحساب <bdi dir="ltr">{email}</bdi>
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">كلمة المرور الجديدة</label>
                <PasswordInput required minLength={6} value={password} onChange={setPassword} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">تأكيد كلمة المرور</label>
                <PasswordInput
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="mt-2 rounded-xl bg-brand-primary py-3 font-bold text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {submitting ? "جاري الحفظ..." : "حفظ كلمة المرور"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="py-24 text-center text-black/58">جاري التحميل...</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
