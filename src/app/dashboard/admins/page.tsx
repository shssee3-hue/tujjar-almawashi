"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { listAllUsersAdmin, setUserRole } from "@/lib/users";
import { UserProfile } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import OwnerGuard from "@/components/OwnerGuard";

function AdminsContent() {
  const { firebaseUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  function refresh() {
    listAllUsersAdmin()
      .then(setUsers)
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  const admins = users.filter((u) => u.role === "admin");

  async function promoteByEmail(e: React.FormEvent) {
    e.preventDefault();
    const target = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!target) {
      toast.error("لا يوجد مستخدم مسجّل بهذا البريد");
      return;
    }
    await setUserRole(target.id, "admin");
    toast.success(`تمت ترقية ${target.name} إلى مشرف`);
    setEmail("");
    refresh();
  }

  async function demote(u: UserProfile) {
    if (u.id === firebaseUser?.uid) {
      toast.error("لا يمكنك إلغاء صلاحيتك الخاصة");
      return;
    }
    await setUserRole(u.id, "user");
    toast.success("تم إلغاء صلاحية الإشراف");
    refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-brand-bg-dark">إدارة المشرفين</h1>

      <form
        onSubmit={promoteByEmail}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
      >
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">
            ترقية مستخدم لمشرف عبر البريد الإلكتروني
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full rounded-xl border border-black/10 px-4 py-2"
          />
        </div>
        <button type="submit" className="rounded-xl bg-brand-primary px-6 py-2 font-bold text-white">
          ترقية
        </button>
      </form>

      {loading ? (
        <p className="text-black/40">جاري التحميل...</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-right">
              <tr>
                <th className="px-4 py-3">الاسم</th>
                <th className="px-4 py-3">البريد</th>
                <th className="px-4 py-3">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {admins.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-medium">{a.name}</td>
                  <td className="px-4 py-3">{a.email}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => demote(a)} className="text-xs font-bold text-red-600">
                      إلغاء صلاحية الإشراف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {admins.length === 0 && (
            <p className="py-10 text-center text-black/40">لا يوجد مشرفون حاليًا</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminAdminsPage() {
  return (
    <OwnerGuard>
      <AdminsContent />
    </OwnerGuard>
  );
}
