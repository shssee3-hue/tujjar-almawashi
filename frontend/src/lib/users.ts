import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit as fsLimit,
  writeBatch,
  type DocumentReference,
} from "firebase/firestore";
import { db } from "./firebase";
import { UserProfile } from "./types";

export async function createUserProfile(
  uid: string,
  data: Omit<UserProfile, "id" | "createdAt" | "adsCount" | "reportsCount" | "role">
) {
  await setDoc(doc(db, "users", uid), {
    ...data,
    role: "user",
    adsCount: 0,
    reportsCount: 0,
    createdAt: Date.now(),
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<UserProfile, "id">) };
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  await updateDoc(doc(db, "users", uid), data);
}

export async function listAllUsersAdmin(): Promise<UserProfile[]> {
  const q = query(collection(db, "users"), orderBy("createdAt", "desc"), fsLimit(500));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<UserProfile, "id">) }));
}

export async function setUserRole(uid: string, role: "user" | "admin") {
  await updateDoc(doc(db, "users", uid), { role });
}

export async function setUserBanned(uid: string, banned: boolean) {
  await updateDoc(doc(db, "users", uid), { banned });
}

// Owner-only. Deletes the user's Firestore data directly — firestore.rules
// grants isSystemOwner() delete on users/ads/comments/commissions/reports.
// The Firebase Auth login itself can only be removed with the Admin SDK
// (Cloud Function + Blaze plan, not used here), so it stays until removed by
// hand from Firebase console -> Authentication.
export async function deleteUserPermanently(uid: string) {
  const cols: [string, string][] = [
    ["ads", "sellerId"],
    ["comments", "userId"],
    ["commissions", "sellerId"],
    ["reports", "reporterId"],
  ];
  const refs: DocumentReference[] = [];
  for (const [col, field] of cols) {
    const snap = await getDocs(query(collection(db, col), where(field, "==", uid)));
    snap.forEach((d) => refs.push(d.ref));
  }
  refs.push(doc(db, "users", uid));

  // Client write batches cap at 500 operations.
  for (let i = 0; i < refs.length; i += 450) {
    const batch = writeBatch(db);
    refs.slice(i, i + 450).forEach((r) => batch.delete(r));
    await batch.commit();
  }
}
