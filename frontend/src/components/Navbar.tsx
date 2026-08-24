"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const links = [
  { href: "/", label: "الرئيسية" },
  { href: "/ads", label: "الإعلانات" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { firebaseUser, profile, signOut, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-brand-primary text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-xl font-extrabold">
          <span className="text-2xl">🐪</span>
          <span>تجّار المواشي</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition hover:text-brand-secondary ${
                pathname === l.href ? "text-brand-secondary" : "text-white/90"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/add-ad"
            className="rounded-full bg-brand-secondary px-4 py-2 text-sm font-bold text-brand-bg-dark transition hover:brightness-95"
          >
            + إضافة إعلان
          </Link>
          {firebaseUser ? (
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-white/90 hover:text-brand-secondary"
                >
                  لوحة التحكم
                </Link>
              )}
              <Link
                href="/profile"
                className="text-sm font-medium text-white/90 hover:text-brand-secondary"
              >
                {profile?.name || "حسابي"}
              </Link>
              <button
                onClick={async () => {
                  await signOut();
                  router.push("/");
                }}
                className="text-sm font-medium text-white/70 hover:text-white"
              >
                خروج
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-full border border-white/40 px-4 py-2 text-sm font-medium hover:bg-white/10"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-primary hover:bg-white/90"
              >
                حساب جديد
              </Link>
            </div>
          )}
        </div>

        <button
          className="text-2xl md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="القائمة"
        >
          ☰
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-brand-primary px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-3 pt-3">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <Link href="/add-ad" onClick={() => setOpen(false)} className="font-bold text-brand-secondary">
              + إضافة إعلان
            </Link>
            {firebaseUser ? (
              <>
                {isAdmin && (
                  <Link href="/dashboard" onClick={() => setOpen(false)}>
                    لوحة التحكم
                  </Link>
                )}
                <Link href="/profile" onClick={() => setOpen(false)}>
                  حسابي
                </Link>
                <button
                  className="text-start text-white/70"
                  onClick={async () => {
                    await signOut();
                    setOpen(false);
                    router.push("/");
                  }}
                >
                  خروج
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)}>
                  تسجيل الدخول
                </Link>
                <Link href="/register" onClick={() => setOpen(false)}>
                  حساب جديد
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
