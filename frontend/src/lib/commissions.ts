import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import { Commission, CommissionStatus } from "./types";

const commissionsCol = collection(db, "commissions");

export async function createCommission(
  data: Omit<Commission, "id" | "createdAt" | "status">
) {
  await addDoc(commissionsCol, {
    ...data,
    status: "pending",
    createdAt: Date.now(),
  });
}

export async function listCommissionsAdmin(): Promise<Commission[]> {
  const q = query(commissionsCol, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Commission, "id">) }));
}

export async function setCommissionStatus(id: string, status: CommissionStatus) {
  await updateDoc(doc(db, "commissions", id), { status, reviewedAt: Date.now() });
}
