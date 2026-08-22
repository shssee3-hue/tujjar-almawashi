import { Suspense } from "react";
import AdDetailsClient from "@/components/AdDetailsClient";

export default function AdDetailsPage() {
  return (
    <Suspense fallback={<p className="py-24 text-center text-black/40">جاري التحميل...</p>}>
      <AdDetailsClient />
    </Suspense>
  );
}
