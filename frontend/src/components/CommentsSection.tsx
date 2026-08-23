"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGate } from "@/lib/useAuthGate";
import { createComment, listComments, deleteComment } from "@/lib/comments";
import { Comment } from "@/lib/types";
import AuthGateModal from "@/components/AuthGateModal";

export default function CommentsSection({ adId }: { adId: string }) {
  const { firebaseUser, profile, isAdmin } = useAuth();
  const { modalOpen, closeModal, handleSuccess, guard } = useAuthGate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  function refresh() {
    listComments(adId)
      .then(setComments)
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [adId]);

  async function submit() {
    if (!firebaseUser || !profile) return;
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await createComment({
        adId,
        userId: firebaseUser.uid,
        userName: profile.name,
        text: text.trim(),
      });
      setText("");
      refresh();
    } catch {
      toast.error("تعذر إرسال التعليق");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف هذا التعليق؟")) return;
    await deleteComment(id);
    setComments((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <section className="mt-8">
      <h2 className="mb-4 text-lg font-bold text-brand-bg-dark">
        التعليقات {comments.length > 0 && `(${comments.length})`}
      </h2>

      <div className="mb-5 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="أضف تعليقًا..."
          className="flex-1 rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
          onKeyDown={(e) => {
            if (e.key === "Enter") guard(submit);
          }}
        />
        <button
          onClick={() => guard(submit)}
          disabled={submitting}
          className="rounded-xl bg-brand-primary px-5 font-bold text-white disabled:opacity-50"
        >
          إرسال
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-black/40">جاري التحميل...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-black/40">لا توجد تعليقات بعد — كن أول من يعلّق.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-sm font-bold text-brand-primary">
                {c.userName?.[0] || "؟"}
              </div>
              <div className="flex-1 rounded-xl bg-black/5 px-4 py-2.5">
                <div className="mb-0.5 flex items-center justify-between gap-2">
                  <span className="text-sm font-bold">{c.userName}</span>
                  {(isAdmin || c.userId === firebaseUser?.uid) && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      حذف
                    </button>
                  )}
                </div>
                <p className="text-sm text-black/70">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <AuthGateModal open={modalOpen} onClose={closeModal} onSuccess={handleSuccess} />
    </section>
  );
}
