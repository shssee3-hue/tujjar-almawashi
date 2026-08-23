"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGate } from "@/lib/useAuthGate";
import { submitRating, getMyRating, getAverageRating } from "@/lib/ratings";
import AuthGateModal from "@/components/AuthGateModal";

export default function RatingStars({ adId, sellerId }: { adId: string; sellerId: string }) {
  const { firebaseUser } = useAuth();
  const isOwnAd = firebaseUser?.uid === sellerId;
  const { modalOpen, closeModal, handleSuccess, guard } = useAuthGate();
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [hover, setHover] = useState(0);

  function refresh() {
    getAverageRating(adId).then(({ average, count }) => {
      setAverage(average);
      setCount(count);
    });
    if (firebaseUser) {
      getMyRating(adId, firebaseUser.uid).then(setMyRating);
    }
  }

  useEffect(refresh, [adId, firebaseUser]);

  async function rate(value: number) {
    if (!firebaseUser || isOwnAd) return;
    try {
      await submitRating(adId, firebaseUser.uid, value);
      setMyRating(value);
      toast.success("شكرًا على تقييمك");
      refresh();
    } catch {
      toast.error("تعذر إرسال التقييم");
    }
  }

  const displayValue = hover || myRating || 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex" onMouseLeave={() => setHover(isOwnAd ? hover : 0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={isOwnAd}
            onMouseEnter={() => !isOwnAd && setHover(n)}
            onClick={() => !isOwnAd && guard(() => rate(n))}
            className={`text-xl leading-none ${isOwnAd ? "cursor-not-allowed" : ""} ${
              n <= (displayValue || Math.round(average)) ? "text-brand-secondary" : "text-black/20"
            }`}
            aria-label={`تقييم ${n} من 5`}
          >
            ★
          </button>
        ))}
      </div>
      <span className="text-sm text-black/50">
        {count > 0 ? `${average.toFixed(1)} (${count} تقييم)` : "لا يوجد تقييم بعد"}
      </span>
      {isOwnAd && (
        <span className="text-xs text-black/40">لا يمكنك تقييم إعلانك الخاص</span>
      )}

      <AuthGateModal open={modalOpen} onClose={closeModal} onSuccess={handleSuccess} />
    </div>
  );
}
