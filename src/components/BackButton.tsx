"use client";

import { useRouter } from "next/navigation";

export default function BackButton({
  fallbackHref = "/",
  className = "",
}: {
  fallbackHref?: string;
  className?: string;
}) {
  const router = useRouter();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-primary hover:underline ${className}`}
    >
      <span aria-hidden>→</span>
      رجوع
    </button>
  );
}
