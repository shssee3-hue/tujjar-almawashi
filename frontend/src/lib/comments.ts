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

export async function deleteComment(id: string) {
  await deleteDoc(doc(db, "comments", id));
}
