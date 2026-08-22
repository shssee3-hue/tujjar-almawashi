"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { registerUser, authErrorMessage } from "@/lib/auth";
import { AccountType } from "@/lib/types";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) {
      toast.error("يجب الموافقة على الشروط والأحكام");
      return;
    }
    setLoading(true);
    try {
      await registerUser({ name, email, password, phoneNumber, accountType });
      toast.success("تم إنشاء الحساب بنجاح");
      router.push("/profile");
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-extrabold text-brand-primary">
          إنشاء حساب جديد
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">الاسم الكامل</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">البريد الإلكتروني</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">رقم الجوال</label>
            <input
              required
              dir="ltr"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="05xxxxxxxx"
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-right outline-none focus:border-brand-secondary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">نوع الحساب</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAccountType("individual")}
                className={`flex-1 rounded-xl border py-2.5 text-sm font-medium ${
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
                className={`flex-1 rounded-xl border py-2.5 text-sm font-medium ${
                  accountType === "trader"
                    ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                    : "border-black/10 text-black/50"
                }`}
              >
                تاجر
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">كلمة المرور</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
            />
          </div>
          <label className="flex items-start gap-2 text-sm text-black/60">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1"
            />
            <span>
              أوافق على{" "}
              <Link href="/terms" className="font-bold text-brand-primary underline">
                الشروط والأحكام
              </Link>
            </span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-xl bg-brand-primary py-3 font-bold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "جاري الإنشاء..." : "إنشاء الحساب"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-black/50">
          لديك حساب بالفعل؟{" "}
          <Link href="/login" className="font-bold text-brand-primary">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
