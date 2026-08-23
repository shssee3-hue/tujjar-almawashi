import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { Rating } from "./types";

const ratingsCol = collection(db, "ratings");

function ratingId(adId: string, userId: string) {
  return `${adId}_${userId}`;
}

export async function submitRating(adId: string, userId: string, value: number) {
  await setDoc(doc(db, "ratings", ratingId(adId, userId)), {
    adId,
    userId,
    value,
    createdAt: Date.now(),
  });
}

export async function getMyRating(adId: string, userId: string): Promise<number | null> {
  const snap = await getDoc(doc(db, "ratings", ratingId(adId, userId)));
  if (!snap.exists()) return null;
  return (snap.data() as Rating).value;
}

export async function listRatings(adId: string): Promise<Rating[]> {
  const q = query(ratingsCol, where("adId", "==", adId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Rating, "id">) }));
}

export async function getAverageRating(adId: string): Promise<{ average: number; count: number }> {
  const ratings = await listRatings(adId);
  if (ratings.length === 0) return { average: 0, count: 0 };
  const sum = ratings.reduce((acc, r) => acc + r.value, 0);
  return { average: sum / ratings.length, count: ratings.length };
}
