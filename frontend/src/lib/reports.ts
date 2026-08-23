import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDocs,
  query,
  orderBy,
  limit as fsLimit,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";
import { Report } from "./types";

const reportsCol = collection(db, "reports");

export async function createReport(data: {
  adId: string;
  adTitle: string;
  reporterId: string;
  reason: string;
}) {
  await addDoc(reportsCol, {
    ...data,
    createdAt: Date.now(),
    status: "open",
  });
  await updateDoc(doc(db, "ads", data.adId), { reportsCount: increment(1) });
}

export async function listRecentReportsAdmin(max = 20): Promise<Report[]> {
  const q = query(reportsCol, orderBy("createdAt", "desc"), fsLimit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Report, "id">) }));
}

export async function closeReport(id: string) {
  await updateDoc(doc(db, "reports", id), { status: "closed" });
}
