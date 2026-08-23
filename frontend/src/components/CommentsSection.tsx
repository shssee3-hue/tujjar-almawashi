"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGate } from "@/lib/useAuthGate";
import { createComment, listComments, deleteComment, setCommentHidden } from "@/lib/comments";
import { Comment } from "@/lib/types";
import AuthGateModal from "@/components/AuthGateModal";

export default function CommentsSection({ adId, sellerId }: { adId: string; sellerId: string }) {
  const { firebaseUser, profile, isAdmin } = useAuth();
  const { modalOpen, closeModal, handleSuccess, guard } = useAuthGate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const isSeller = firebaseUser?.uid === sellerId;

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

  async function submitReply(parentId: string) {
    if (!firebaseUser || !profile || !replyText.trim()) return;
    try {
      await createComment({
        adId,
        userId: firebaseUser.uid,
        userName: profile.name,
        text: replyText.trim(),
        replyToId: parentId,
      });
      setReplyText("");
      setReplyingTo(null);
      refresh();
    } catch {
      toast.error("تعذر إرسال الرد");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف هذا التعليق؟")) return;
    await deleteComment(id);
    setComments((prev) => prev.filter((c) => c.id !== id));
  }

  async function toggleHidden(c: Comment) {
    const next = !c.hidden;
    await setCommentHidden(c.id, next);
    setComments((prev) => prev.map((x) => (x.id === c.id ? { ...x, hidden: next } : x)));
    toast.success(next ? "تم إخفاء التعليق" : "تم إظهار التعليق");
  }

  const topLevel = comments
    .filter((c) => !c.replyToId)
    .filter((c) => isAdmin || !c.hidden);

  function repliesFor(parentId: string) {
    return comments
      .filter((c) => c.replyToId === parentId)
      .filter((c) => isAdmin || !c.hidden)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  function CommentRow({ c, isReply }: { c: Comment; isReply?: boolean }) {
    return (
      <div className={`flex gap-3 ${isReply ? "mr-8" : ""}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-sm font-bold text-brand-primary">
          {c.userName?.[0] || "؟"}
        </div>
        <div className="flex-1">
          <div
            className={`rounded-xl px-4 py-2.5 ${
              c.hidden ? "bg-red-50 opacity-60" : isReply ? "bg-brand-secondary/10" : "bg-black/5"
            }`}
          >
            <div className="mb-0.5 flex items-center justify-between gap-2">
              <span className="text-sm font-bold">
                {c.userName}
                {c.userId === sellerId && (
                  <span className="mr-1 rounded-full bg-brand-primary/10 px-2 py-0.5 text-[10px] font-bold text-brand-primary">
                    البائع
                  </span>
                )}
                {c.hidden && (
                  <span className="mr-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                    مخفي
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => toggleHidden(c)}
                    className="text-xs text-black/50 hover:underline"
                  >
                    {c.hidden ? "إظهار" : "إخفاء"}
                  </button>
                )}
                {(isAdmin || c.userId === firebaseUser?.uid) && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    حذف
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-black/70">{c.text}</p>
          </div>

          {!isReply && isSeller && (
            <div className="mt-1.5">
              {replyingTo === c.id ? (
                <div className="flex gap-2">
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="اكتب ردك..."
                    autoFocus
                    className="flex-1 rounded-lg border border-black/10 px-3 py-1.5 text-sm outline-none focus:border-brand-secondary"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitReply(c.id);
                    }}
                  />
                  <button
                    onClick={() => submitReply(c.id)}
                    className="rounded-lg bg-brand-primary px-3 text-sm font-bold text-white"
                  >
                    رد
                  </button>
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText("");
                    }}
                    className="text-sm text-black/40"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setReplyingTo(c.id)}
                  className="text-xs font-bold text-brand-primary hover:underline"
                >
                  رد
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="mb-4 text-lg font-bold text-brand-bg-dark">
        التعليقات {topLevel.length > 0 && `(${topLevel.length})`}
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
      ) : topLevel.length === 0 ? (
        <p className="text-sm text-black/40">لا توجد تعليقات بعد — كن أول من يعلّق.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {topLevel.map((c) => (
            <div key={c.id} className="flex flex-col gap-3">
              <CommentRow c={c} />
              {repliesFor(c.id).map((r) => (
                <CommentRow key={r.id} c={r} isReply />
              ))}
            </div>
          ))}
        </div>
      )}

      <AuthGateModal open={modalOpen} onClose={closeModal} onSuccess={handleSuccess} />
    </section>
  );
}
