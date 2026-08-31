"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { listAdsBySeller, deleteAd } from "@/lib/ads";
import { updateUserProfile } from "@/lib/users";
import { listCommentsForAds } from "@/lib/comments";
import { Ad, Comment } from "@/lib/types";
import AdCard from "@/components/AdCard";
import BackButton from "@/components/BackButton";

type TabKey = "active" | "featured" | "ended" | "flagged";

const TABS: { key: TabKey; label: string }[] = [
  { key: "active", label: "الإعلانات النشطة" },
  { key: "featured", label: "المميزة" },
  { key: "ended", label: "المنتهية" },
  { key: "flagged", label: "المخالفة" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { firebaseUser, profile, loading: authLoading } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [tab, setTab] = useState<TabKey>("active");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push("/login");
    }
  }, [authLoading, firebaseUser, router]);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhoneNumber(profile.phoneNumber);
    }
  }, [profile]);

  useEffect(() => {
    if (!firebaseUser) return;
    listAdsBySeller(firebaseUser.uid).then(setAds);
  }, [firebaseUser]);

  useEffect(() => {
    if (ads.length === 0) {
      setComments([]);
      return;
    }
    listCommentsForAds(ads.map((a) => a.id)).then((res) =>
      setComments(res.filter((c) => !c.hidden))
    );
  }, [ads]);

  const adTitleById = Object.fromEntries(ads.map((a) => [a.id, a.title]));

  if (authLoading || !profile) {
    return <p className="py-24 text-center text-black/40">جاري التحميل...</p>;
  }

  const filtered = ads.filter((a) => {
    if (tab === "active") return a.status === "active" && !a.featured;
    if (tab === "featured") return a.status === "active" && a.featured;
    if (tab === "ended") return a.status === "ended";
    if (tab === "flagged") return a.status === "flagged";
    return true;
  });

  async function saveProfile() {
    await updateUserProfile(profile!.id, { name, phoneNumber });
    toast.success("تم تحديث البيانات");
    setEditing(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("هل تريد حذف هذا الإعلان؟")) return;
    await deleteAd(id);
    setAds((prev) => prev.map((a) => (a.id === id ? { ...a, status: "deleted" } : a)));
    toast.success("تم حذف الإعلان");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <BackButton />
      <div className="mb-8 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10 text-2xl font-bold text-brand-primary">
              {profile.name?.[0] || "؟"}
            </div>
            <div>
              <h1 className="text-xl font-extrabold">{profile.name}</h1>
              <p className="text-sm text-black/50">
                {profile.accountType === "trader" ? "تاجر" : "فرد"} ·{" "}
                {profile.ratingCount
                  ? `تقييم ${profile.rating.toFixed(1)}/5 (${profile.ratingCount})`
                  : "لا تقييم بعد"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setEditing((v) => !v)}
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-bold text-brand-primary"
          >
            {editing ? "إلغاء" : "تعديل البيانات"}
          </button>
        </div>

        {editing ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">الاسم</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">رقم الجوال</label>
              <input
                dir="ltr"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-right"
              />
            </div>
            <button
              onClick={saveProfile}
              className="sm:col-span-2 rounded-xl bg-brand-primary py-3 font-bold text-white"
            >
              حفظ التعديلات
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-black/40">البريد الإلكتروني</p>
              <p className="font-bold">{profile.email}</p>
            </div>
            <div>
              <p className="text-black/40">رقم الجوال</p>
              <p className="font-bold" dir="ltr">
                {profile.phoneNumber}
              </p>
            </div>
            <div>
              <p className="text-black/40">عدد الإعلانات</p>
              <p className="font-bold">{ads.length}</p>
            </div>
            <div>
              <p className="text-black/40">البلاغات عليك</p>
              <p className="font-bold">{profile.reportsCount}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              tab === t.key
                ? "bg-brand-primary text-white"
                : "bg-white text-black/50 hover:bg-black/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 py-16 text-center text-black/40">
          لا توجد إعلانات في هذا القسم
          <div className="mt-3">
            <Link href="/add-ad" className="font-bold text-brand-primary">
              + إضافة إعلان جديد
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ad) => (
            <div key={ad.id} className="relative">
              <AdCard ad={ad} />
              <div className="mt-2 flex justify-end gap-3 text-sm">
                <Link href={`/add-ad?edit=${ad.id}`} className="font-medium text-brand-primary">
                  تعديل
                </Link>
                <button onClick={() => handleDelete(ad.id)} className="font-medium text-red-600">
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {comments.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-bold text-brand-bg-dark">
            الردود على إعلاناتك ({comments.length})
          </h2>
          <div className="flex flex-col gap-3">
            {comments.map((c) => (
              <Link
                key={c.id}
                href={`/ad?id=${c.adId}`}
                className="flex flex-col gap-1 rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-brand-primary">
                    {adTitleById[c.adId] || "إعلان"}
                  </span>
                  <span className="text-xs text-black/30">
                    {new Date(c.createdAt).toLocaleString("ar-SA")}
                  </span>
                </div>
                <p className="text-sm text-black/70">
                  <span className="font-bold">{c.userName}</span>: {c.text}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
