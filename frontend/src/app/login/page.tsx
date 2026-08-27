"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { loginUser, authErrorMessage } from "@/lib/auth";
import { getUserProfile } from "@/lib/users";
import { useAuth } from "@/contexts/AuthContext";
import BackButton from "@/components/BackButton";
import PasswordInput from "@/components/PasswordInput";

export default function LoginPage() {
  const router = useRouter();
  const { firebaseUser, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && firebaseUser) {
      router.replace("/profile");
    }
  }, [authLoading, firebaseUser, router]);

  if (authLoading || firebaseUser) {
    return <p className="py-24 text-center text-black/40">جاري التحميل...</p>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await loginUser(email, password);
      const profile = await getUserProfile(user.uid);
      if (profile?.banned) {
        // Don't navigate or show a success toast — AuthContext's own live
        // profile listener (already firing in parallel off the same
        // onAuthStateChanged) is the single source of truth that signs a
        // banned account back out and shows the one "تم حظر..." message.
        return;
      }
      toast.success("تم تسجيل الدخول بنجاح");
      router.push("/profile");
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <BackButton />
      <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-extrabold text-brand-primary">
          تسجيل الدخول
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">البريد الإلكتروني</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
              placeholder="example@mail.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">كلمة المرور</label>
            <PasswordInput
              required
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
            />
            <Link
              href="/forgot-password"
              className="mt-1.5 inline-block text-xs font-medium text-brand-primary hover:underline"
            >
              نسيت كلمة المرور؟
            </Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-xl bg-brand-primary py-3 font-bold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "جاري الدخول..." : "دخول"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-black/50">
          ليس لديك حساب؟{" "}
          <Link href="/register" className="font-bold text-brand-primary">
            إنشاء حساب جديد
          </Link>
        </p>
      </div>
    </div>
  );
}
