import {
  collection,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
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

// Thrown by createReport when this user has already filed a report for this
// ad. The UI turns it into a specific message.
export const ALREADY_REPORTED = "already-reported";

// One report per (ad, reporter): the document id is a fixed
// `${adId}_${uid}` so a second attempt hits the same doc. firestore.rules
// also enforces the id shape and keeps `update` admin-only, so a repeat
// write is rejected server-side even if this client check is bypassed.
export async function createReport(data: {
  adId: string;
  adTitle: string;
  reporterId: string;
  reason: string;
}) {
  const reportId = `${data.adId}_${data.reporterId}`;
  const ref = doc(db, "reports", reportId);

  const existing = await getDoc(ref);
  if (existing.exists()) {
    throw new Error(ALREADY_REPORTED);
  }

  await setDoc(ref, {
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

export async function deleteReport(id: string) {
  await deleteDoc(doc(db, "reports", id));
}
