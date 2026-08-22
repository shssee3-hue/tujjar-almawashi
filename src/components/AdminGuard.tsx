"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { firebaseUser, profile, loading, isAdmin } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) {
      router.replace("/login");
      return;
    }
    if (profile && !isAdmin) {
      router.replace("/");
    }
  }, [loading, firebaseUser, profile, isAdmin, router]);

  if (loading || !profile || !isAdmin) {
    return <p className="py-24 text-center text-black/40">جاري التحقق من الصلاحيات...</p>;
  }

  return <>{children}</>;
}
