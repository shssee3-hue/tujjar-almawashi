"use client";

import toast from "react-hot-toast";
import { useAuthGate } from "@/lib/useAuthGate";
import AuthGateModal from "@/components/AuthGateModal";

export default function ShareButton({ title }: { title: string }) {
  const { modalOpen, closeModal, handleSuccess, guard } = useAuthGate();

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled the share sheet — not an error
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("تم نسخ رابط الإعلان");
  }

  return (
    <>
      <button
        onClick={() => guard(share)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline"
      >
        <span aria-hidden>🔗</span>
        مشاركة
      </button>
      <AuthGateModal open={modalOpen} onClose={closeModal} onSuccess={handleSuccess} />
    </>
  );
}
