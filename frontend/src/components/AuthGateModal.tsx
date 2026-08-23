"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { loginUser, registerUser, authErrorMessage } from "@/lib/auth";
import { AccountType } from "@/lib/types";

export default function AuthGateModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [agreed, setAgreed] = useState(false);

  if (!open) return null;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await loginUser(email, password);
      toast.success("تم تسجيل الدخول بنجاح");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) {
      toast.error("يجب الموافقة على الشروط والأحكام");
      return;
    }
    setLoading(true);
    try {
      await registerUser({ name, email, password, phoneNumber, accountType });
      toast.success("تم إنشاء الحساب بنجاح");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-brand-primary">
            {tab === "login" ? "تسجيل الدخول" : "إنشاء حساب جديد"}
          </h3>
          <button onClick={onClose} className="text-black/40 hover:text-black/70">
            ✕
          </button>
        </div>

        <p className="mb-4 text-sm text-black/50">
          يجب تسجيل الدخول أولًا لإتمام هذا الإجراء.
        </p>

        <div className="mb-5 flex rounded-xl bg-black/5 p-1">
          <button
            onClick={() => setTab("login")}
            className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${
              tab === "login" ? "bg-white text-brand-primary shadow-sm" : "text-black/50"
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            onClick={() => setTab("register")}
            className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${
              tab === "register" ? "bg-white text-brand-primary shadow-sm" : "text-black/50"
            }`}
          >
            حساب جديد
          </button>
        </div>

        {tab === "login" ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="البريد الإلكتروني"
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
            />
            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-xl bg-brand-primary py-3 font-bold text-white disabled:opacity-50"
            >
              {loading ? "جاري الدخول..." : "دخول"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="الاسم الكامل"
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="البريد الإلكتروني"
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
            />
            <input
              required
              dir="ltr"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="05xxxxxxxx"
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-right outline-none focus:border-brand-secondary"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAccountType("individual")}
                className={`flex-1 rounded-xl border py-2 text-sm font-medium ${
                  accountType === "individual"
                    ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                    : "border-black/10 text-black/50"
                }`}
              >
                فرد
              </button>
              <button
                type="button"
                onClick={() => setAccountType("trader")}
                className={`flex-1 rounded-xl border py-2 text-sm font-medium ${
                  accountType === "trader"
                    ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                    : "border-black/10 text-black/50"
                }`}
              >
                تاجر
              </button>
            </div>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
            />
            <label className="flex items-start gap-2 text-xs text-black/60">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                أوافق على{" "}
                <Link href="/terms" target="_blank" className="font-bold text-brand-primary underline">
                  الشروط والأحكام
                </Link>
              </span>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-xl bg-brand-primary py-3 font-bold text-white disabled:opacity-50"
            >
              {loading ? "جاري الإنشاء..." : "إنشاء الحساب"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
