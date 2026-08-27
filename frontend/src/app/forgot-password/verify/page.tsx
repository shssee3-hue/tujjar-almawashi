"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  passwordResetErrorMessage,
} from "@/lib/passwordReset";
import BackButton from "@/components/BackButton";

const RESEND_COOLDOWN_SEC = 30;

export default function VerifyOtpPage() {
  const router = useRouter();
  const [resetId, setResetId] = useState("");
  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SEC);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setResetId(sp.get("resetId") || "");
    setPhone(sp.get("phone") || "");
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  function handleDigitChange(i: number, raw: string) {
    const v = raw.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
    if (v && i < 5) inputsRef.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    setDigits(Array.from({ length: 6 }, (_, i) => text[i] || ""));
    inputsRef.current[Math.min(text.length, 5)]?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length !== 6 || !resetId) return;
    setVerifying(true);
    try {
      await verifyPasswordResetOtp(resetId, otp);
      router.push(`/forgot-password/reset?resetId=${encodeURIComponent(resetId)}`);
    } catch (err) {
      toast.error(passwordResetErrorMessage(err));
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    if (!phone) return;
    setResending(true);
    try {
      const res = await requestPasswordResetOtp(phone);
      setResetId(res.resetId);
      setDigits(Array(6).fill(""));
      setSecondsLeft(RESEND_COOLDOWN_SEC);
      toast.success("تم إرسال رمز جديد");
      inputsRef.current[0]?.focus();
    } catch (err) {
      toast.error(passwordResetErrorMessage(err));
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <BackButton fallbackHref="/forgot-password" />
      <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-center text-2xl font-extrabold text-brand-primary">
          أدخل رمز التحقق
        </h1>
        <p className="mb-6 text-center text-sm text-black/50">
          أرسلنا رمزًا مكوّنًا من 6 أرقام إلى <bdi dir="ltr">{phone || "رقمك"}</bdi>، صالح لمدة 3 دقائق.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div dir="ltr" className="flex justify-center gap-2">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputsRef.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                className="h-12 w-10 rounded-xl border border-black/10 text-center text-xl font-bold outline-none focus:border-brand-secondary"
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={verifying || digits.join("").length !== 6}
            className="rounded-xl bg-brand-primary py-3 font-bold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {verifying ? "جاري التحقق..." : "تحقق"}
          </button>
        </form>
        <div className="mt-4 text-center">
          {secondsLeft > 0 ? (
            <p className="text-xs text-black/40">
              يمكنك طلب رمز جديد خلال {secondsLeft} ثانية
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-sm font-bold text-brand-primary hover:underline disabled:opacity-50"
            >
              {resending ? "جاري الإرسال..." : "إعادة إرسال الرمز"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
