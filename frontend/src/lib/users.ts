import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit as fsLimit,
} from "firebase/firestore";
import { db } from "./firebase";
import { UserProfile } from "./types";

export async function createUserProfile(
  uid: string,
  data: Omit<UserProfile, "id" | "createdAt" | "rating" | "adsCount" | "reportsCount" | "role">
) {
  await setDoc(doc(db, "users", uid), {
    ...data,
    role: "user",
    rating: 0,
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
