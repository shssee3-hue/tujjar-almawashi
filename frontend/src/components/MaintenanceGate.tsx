"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getSiteSettings } from "@/lib/settings";
import { useAuth } from "@/contexts/AuthContext";

export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAdmin, loading } = useAuth();
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    getSiteSettings().then((s) => setMaintenance(s.maintenanceMode));
  }, []);

  const isDashboard = pathname?.startsWith("/dashboard");
  const isLogin = pathname === "/login";

  if (maintenance && !loading && !isAdmin && !isDashboard && !isLogin) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 text-6xl">🚧</div>
        <h1 className="mb-2 text-2xl font-extrabold text-brand-primary">
          الموقع تحت الصيانة حاليًا
        </h1>
        <p className="text-black/50">نعمل على تحسين الخدمة، سنعود قريبًا.</p>
      </div>
    );
  }

  return <>{children}</>;
}
