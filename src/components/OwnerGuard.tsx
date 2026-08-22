"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function OwnerGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading, isSystemOwner } = useAuth();

  useEffect(() => {
    if (!loading && !isSystemOwner) {
      router.replace("/dashboard");
    }
  }, [loading, isSystemOwner, router]);

  if (loading || !isSystemOwner) {
    return <p className="py-24 text-center text-black/40">جاري التحقق من الصلاحيات...</p>;
  }

  return <>{children}</>;
}
