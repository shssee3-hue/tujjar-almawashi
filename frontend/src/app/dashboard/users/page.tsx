"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { listAllUsersAdmin, setUserBanned, deleteUserPermanently } from "@/lib/users";
import { UserProfile } from "@/lib/types";
import OwnerGuard from "@/components/OwnerGuard";

type PendingAction = { type: "ban" | "delete"; user: UserProfile };

// A callable Cloud Function's HttpsError carries our own Arabic message
// straight through to err.message on the client.
function callableErrorMessage(error: unknown): string {
  const err = error as { message?: string };
  return err?.message || "حدث خطأ غير متوقع، حاول مرة أخرى";
}

const ROLE_LABEL: Record<string, string> = {
  owner: "مالك النظام",
  admin: "مشرف",
  user: "مستخدم",
};

function UsersContent() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    listAllUsersAdmin()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) =>
    `${u.name} ${u.email} ${u.phoneNumber}`.toLowerCase().includes(search.toLowerCase())
  );

  // Unbanning (restoring access) doesn't need a confirmation — only the two
  // destructive actions (ban, permanent delete) do, matching the spec.
  async function unban(u: UserProfile) {
    await setUserBanned(u.id, false);
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, banned: false } : x)));
    toast.success("تم رفع الحظر");
  }

  async function confirmPendingAction() {
    if (!pending) return;
    setWorking(true);
    try {
      if (pending.type === "ban") {
        await setUserBanned(pending.user.id, true);
        setUsers((prev) =>
          prev.map((x) => (x.id === pending.user.id ? { ...x, banned: true } : x))
        );
        toast.success("تم حظر المستخدم");
      } else {
        await deleteUserPermanently(pending.user.id);
        setUsers((prev) => prev.filter((x) => x.id !== pending.user.id));
        toast.success("تم حذف الحساب نهائيًا");
      }
      setPending(null);
    } catch (err) {
      toast.error(callableErrorMessage(err));
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-brand-bg-dark">إدارة المستخدمين</h1>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالاسم أو البريد أو الجوال..."
          className="w-72 rounded-xl border border-black/10 px-4 py-2 text-sm outline-none focus:border-brand-secondary"
        />
      </div>

      {loading ? (
        <p className="text-black/40">جاري التحميل...</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-right">
              <tr>
                <th className="px-4 py-3">الاسم</th>
                <th className="px-4 py-3">البريد</th>
                <th className="px-4 py-3">الجوال</th>
                <th className="px-4 py-3">نوع الحساب</th>
                <th className="px-4 py-3">الدور</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">حظر المستخدم</th>
                <th className="px-4 py-3">حذف الحساب نهائيًا</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3" dir="ltr">
                    {u.phoneNumber}
                  </td>
                  <td className="px-4 py-3">{u.accountType === "trader" ? "تاجر" : "فرد"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-bold ${
                        u.role === "owner"
                          ? "bg-brand-secondary/20 text-brand-primary"
                          : u.role === "admin"
                            ? "bg-brand-primary/10 text-brand-primary"
                            : "bg-black/5 text-black/50"
                      }`}
                    >
                      {ROLE_LABEL[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-bold ${
                        u.banned ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
                      }`}
                    >
                      {u.banned ? "محظور" : "نشط"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.role !== "owner" &&
                      (u.banned ? (
                        <button
                          onClick={() => unban(u)}
                          className="text-xs font-bold text-brand-primary"
                        >
                          رفع الحظر
                        </button>
                      ) : (
                        <button
                          onClick={() => setPending({ type: "ban", user: u })}
                          className="text-xs font-bold text-red-600"
                        >
                          حظر
                        </button>
                      ))}
                  </td>
                  <td className="px-4 py-3">
                    {u.role !== "owner" && (
                      <button
                        onClick={() => setPending({ type: "delete", user: u })}
                        className="text-xs font-bold text-red-700"
                      >
                        🗑️ حذف نهائي
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="py-10 text-center text-black/40">لا يوجد مستخدمون مطابقون</p>
          )}
        </div>
      )}

      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !working && setPending(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-lg font-extrabold text-brand-bg-dark">
              {pending.type === "ban"
                ? "هل تريد حظر هذا المستخدم؟"
                : "هل أنت متأكد أنك تريد حذف هذا الحساب نهائيًا؟"}
            </h3>
            <p className="mb-1 text-sm font-medium text-black/60">{pending.user.name}</p>
            <p className="mb-5 text-sm text-black/50">
              {pending.type === "ban"
                ? "لن يتمكن من تسجيل الدخول أو إضافة إعلانات."
                : "لن يمكن استعادته بعد الحذف."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmPendingAction}
                disabled={working}
                className="flex-1 rounded-xl bg-red-600 py-2.5 font-bold text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {working ? "جاري التنفيذ..." : pending.type === "ban" ? "نعم، حظر" : "نعم، حذف"}
              </button>
              <button
                onClick={() => setPending(null)}
                disabled={working}
                className="flex-1 rounded-xl border border-black/10 py-2.5 font-bold text-black/60 disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <OwnerGuard>
      <UsersContent />
    </OwnerGuard>
  );
}
