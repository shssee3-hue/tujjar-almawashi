import { Suspense } from "react";
import AdsExplorer from "@/components/AdsExplorer";

export default function AdsPage() {
  return (
    <Suspense fallback={<p className="py-20 text-center text-black/58">جاري التحميل...</p>}>
      <AdsExplorer />
    </Suspense>
  );
}
