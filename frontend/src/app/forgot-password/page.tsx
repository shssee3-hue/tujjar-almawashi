"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmationResult } from "firebase/auth";
import toast from "react-hot-toast";
import {
  startPhoneReset,
  sendPhoneOtp,
  confirmPhoneOtp,
  resetPasswordWithOtp,
  passwordResetErrorMessage,
} from "@/lib/passwordReset";
import BackButton from "@/components/BackButton";
import PasswordInput from "@/components/PasswordInput";

const RESEND_COOLDOWN_SEC = 30;

type Step = "phone" | "otp" | "reset";

function validatePassword(pw: string): string | null {
  if (pw.length < 6) return "كلمة المرور يجب ألا تقل عن 6 خانات";
  if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) return "يجب أن تحتوي على أرقام وحروف";
  return null;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [resetId, setResetId] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SEC);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step !== "otp" || secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, secondsLeft]);

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const trimmed = phone.trim();
      const { resetId: id } = await startPhoneReset(trimmed);
      const conf = await sendPhoneOtp(trimmed);
      setResetId(id);
      setConfirmation(conf);
      setDigits(Array(6).fill(""));
      setSecondsLeft(RESEND_COOLDOWN_SEC);
      setStep("otp");
      toast.success("تم إرسال رمز التحقق عبر رسالة نصية");
    } catch (err) {
      toast.error(passwordResetErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

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

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length !== 6 || !confirmation) return;
    setLoading(true);
    try {
      await confirmPhoneOtp(confirmation, otp, resetId);
      setStep("reset");
    } catch (err) {
      toast.error(passwordResetErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setLoading(true);
    try {
      const conf = await sendPhoneOtp(phone.trim());
      setConfirmation(conf);
      setDigits(Array(6).fill(""));
      setSecondsLeft(RESEND_COOLDOWN_SEC);
      toast.success("تم إرسال رمز جديد");
      inputsRef.current[0]?.focus();
    } catch (err) {
      toast.error(passwordResetErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResetSubmit(e: React.FormEvent) {
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
        {step === "phone" && (
          <>
            <h1 className="mb-2 text-center text-2xl font-extrabold text-brand-primary">
              نسيت كلمة المرور؟
            </h1>
            <p className="mb-6 text-center text-sm text-black/50">
              أدخل رقم جوالك. إن كان مسجّلاً لدينا فستصلك رسالة نصية برمز تحقق
              لإعادة تعيين كلمة المرور.
            </p>
            <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4">
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
          </>
        )}

        {step === "otp" && (
          <>
            <h1 className="mb-2 text-center text-2xl font-extrabold text-brand-primary">
              أدخل رمز التحقق
            </h1>
            <p className="mb-6 text-center text-sm text-black/50">
              أرسلنا رمزًا مكوّنًا من 6 أرقام إلى <bdi dir="ltr">{phone}</bdi>، صالح لمدة 3 دقائق.
            </p>
            <form onSubmit={handleOtpSubmit} className="flex flex-col gap-5">
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
                disabled={loading || digits.join("").length !== 6}
                className="rounded-xl bg-brand-primary py-3 font-bold text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {loading ? "جاري التحقق..." : "تحقق"}
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
                  disabled={loading}
                  className="text-sm font-bold text-brand-primary hover:underline disabled:opacity-50"
                >
                  إعادة إرسال الرمز
                </button>
              )}
            </div>
          </>
        )}

        {step === "reset" && (
          <>
            <h1 className="mb-6 text-center text-2xl font-extrabold text-brand-primary">
              إعادة تعيين كلمة المرور
            </h1>
            <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
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
          </>
        )}
      </div>

      {/* Firebase Phone Auth's invisible reCAPTCHA attaches here — must stay
          mounted for the whole flow, not just the "phone" step, since a
          resend on the "otp" step also needs it. */}
      <div id="recaptcha-container" />
    </div>
  );
}
