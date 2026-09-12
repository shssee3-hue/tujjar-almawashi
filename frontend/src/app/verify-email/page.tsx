"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { completeEmailVerification, verifyEmailErrorMessage } from "@/lib/auth";
import BackButton from "@/components/BackButton";

type Status = "checking" | "done" | "invalid";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode") || "";
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!oobCode) {
      setStatus("invalid");
      return;
    }
    completeEmailVerification(oobCode)
      .then(() => setStatus("done"))
      .catch((err) => {
        setError(verifyEmailErrorMessage(err));
        setStatus("invalid");
      });
  }, [oobCode]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <BackButton fallbackHref="/profile" />
      <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
        {status === "checking" && (
          <p className="py-10 text-black/58">جاري تأكيد بريدك الجديد...</p>
        )}

        {status === "done" && (
          <>
            <h1 className="mb-2 text-2xl font-extrabold text-brand-primary">
              تم تأكيد بريدك الجديد
            </h1>
            <p className="mb-6 text-sm leading-relaxed text-black/78">
              أصبح بريد الدخول الجديد فعّالًا. استخدمه في تسجيل الدخول من الآن.
            </p>
            <Link
              href="/login"
              className="block rounded-xl bg-brand-primary py-3 font-bold text-white transition hover:brightness-110"
            >
              تسجيل الدخول
            </Link>
          </>
        )}

        {status === "invalid" && (
          <>
            <h1 className="mb-2 text-2xl font-extrabold text-brand-primary">
              تعذّر تأكيد البريد
            </h1>
            <p className="mb-6 text-sm leading-relaxed text-black/78">
              {error || "الرابط غير صالح."} يمكنك طلب تغيير البريد من جديد من
              صفحة حسابك.
            </p>
            <Link
              href="/profile"
              className="block rounded-xl bg-brand-primary py-3 font-bold text-white transition hover:brightness-110"
            >
              العودة لحسابي
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p className="py-24 text-center text-black/58">جاري التحميل...</p>}>
      <VerifyEmailInner />
    </Suspense>
  );
}
