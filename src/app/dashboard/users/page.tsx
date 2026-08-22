"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { listAllUsersAdmin, setUserBanned, setUserRole } from "@/lib/users";
import { UserProfile } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminUsersPage() {
  const { firebaseUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    listAllUsersAdmin()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) =>
    `${u.name} ${u.email} ${u.phoneNumber}`.toLowerCase().includes(search.toLowerCase())
  );

  async function toggleBan(u: UserProfile) {
    await setUserBanned(u.id, !u.banned);
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, banned: !x.banned } : x)));
    toast.success(u.banned ? "تم رفع الحظر" : "تم حظر المستخدم");
  }

  async function toggleAdmin(u: UserProfile) {
    if (u.id === firebaseUser?.uid) {
      toast.error("لا يمكنك تغيير صلاحياتك الخاصة");
      return;
    }
    const role = u.role === "admin" ? "user" : "admin";
    await setUserRole(u.id, role);
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role } : x)));
    toast.success(role === "admin" ? "تمت الترقية لمشرف" : "تم إلغاء صلاحية الإشراف");
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
                <th className="px-4 py-3">إجراءات</th>
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
                        u.role === "admin" ? "bg-brand-primary/10 text-brand-primary" : "bg-black/5 text-black/50"
                      }`}
                    >
                      {u.role === "admin" ? "مشرف" : "مستخدم"}
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
                    <div className="flex gap-3">
                      <button onClick={() => toggleAdmin(u)} className="text-xs font-bold text-brand-primary">
                        {u.role === "admin" ? "إلغاء الإشراف" : "ترقية لمشرف"}
                      </button>
                      <button
                        onClick={() => toggleBan(u)}
                        className="text-xs font-bold text-red-600"
                      >
                        {u.banned ? "رفع الحظر" : "حظر"}
                      </button>
                    </div>
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
    </div>
  );
}
