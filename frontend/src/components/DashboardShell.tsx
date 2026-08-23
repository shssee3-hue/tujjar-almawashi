"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminGuard from "@/components/AdminGuard";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/contexts/AuthContext";

const NAV = [
  { href: "/dashboard", label: "نظرة عامة", icon: "📊" },
  { href: "/dashboard/ads", label: "إدارة الإعلانات", icon: "🐐" },
  { href: "/dashboard/users", label: "إدارة المستخدمين", icon: "👥", ownerOnly: true },
  { href: "/dashboard/reports", label: "إدارة البلاغات", icon: "🚩" },
  { href: "/dashboard/breeds", label: "إدارة السلالات", icon: "🧬" },
  { href: "/dashboard/regions", label: "المناطق والمدن", icon: "🗺️" },
  { href: "/dashboard/admins", label: "المشرفون", icon: "🛡️", ownerOnly: true },
  { href: "/dashboard/settings", label: "إعدادات الموقع", icon: "⚙️", ownerOnly: true },
  { href: "/dashboard/oath-text", label: "نص الإقرار الإلزامي", icon: "📜", ownerOnly: true },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isSystemOwner } = useAuth();

  return (
    <AdminGuard>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 md:grid-cols-[240px_1fr]">
        <aside className="h-fit rounded-2xl border border-black/5 bg-white p-3 shadow-sm">
          <nav className="flex flex-col gap-1">
            {NAV.filter((item) => !item.ownerOnly || isSystemOwner).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  pathname === item.href
                    ? "bg-brand-primary text-white"
                    : "text-black/60 hover:bg-black/5"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>
        <div>
          <BackButton fallbackHref="/dashboard" />
          {children}
        </div>
      </div>
    </AdminGuard>
  );
}
