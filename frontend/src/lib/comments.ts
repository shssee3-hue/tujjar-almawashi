import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import { Comment } from "./types";

const commentsCol = collection(db, "comments");

export async function createComment(data: {
  adId: string;
  userId: string;
  userName: string;
  text: string;
}) {
  await addDoc(commentsCol, { ...data, createdAt: Date.now() });
}

export async function listComments(adId: string): Promise<Comment[]> {
  const q = query(commentsCol, where("adId", "==", adId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Comment, "id">) }));
}

// Comments across several ads at once — used to surface all replies a seller
// has received on their own listings in one place (their profile page),
// since otherwise they'd only see them by opening each ad individually.
// Firestore's "in" filter caps out at 10 values per query, hence the chunking.
export async function listCommentsForAds(adIds: string[]): Promise<Comment[]> {
  if (adIds.length === 0) return [];
  const chunks: string[][] = [];
  for (let i = 0; i < adIds.length; i += 10) chunks.push(adIds.slice(i, i + 10));

  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const q = query(commentsCol, where("adId", "in", chunk));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Comment, "id">) }));
    })
  );
  return results.flat().sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteComment(id: string) {
  await deleteDoc(doc(db, "comments", id));
}
