import { Suspense } from "react";
import AdsExplorer from "@/components/AdsExplorer";

export default function AdsPage() {
  return (
    <Suspense fallback={<p className="py-20 text-center text-black/40">جاري التحميل...</p>}>
      <AdsExplorer title="جميع الإعلانات" />
    </Suspense>
  );
}
