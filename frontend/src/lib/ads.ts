import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as fsLimit,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";
import { Ad, AdCategory } from "./types";

const adsCol = collection(db, "ads");

export interface AdFilters {
  category?: AdCategory;
  subCategory?: string;
  animalType?: string;
  breed?: string;
  region?: string;
}

export async function createAd(data: Omit<Ad, "id" | "createdAt" | "updatedAt" | "views" | "reportsCount" | "status">) {
  const now = Date.now();
  const docRef = await addDoc(adsCol, {
    ...data,
    createdAt: now,
    updatedAt: now,
    views: 0,
    reportsCount: 0,
    status: "active",
  });
  return docRef.id;
}

export async function updateAd(id: string, data: Partial<Ad>) {
  await updateDoc(doc(db, "ads", id), { ...data, updatedAt: Date.now() });
}

export async function deleteAd(id: string) {
  await updateDoc(doc(db, "ads", id), { status: "deleted", updatedAt: Date.now() });
}

export async function hardDeleteAd(id: string) {
  await deleteDoc(doc(db, "ads", id));
}

export async function getAd(id: string): Promise<Ad | null> {
  const snap = await getDoc(doc(db, "ads", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Ad, "id">) };
}

export async function incrementViews(id: string) {
  try {
    await updateDoc(doc(db, "ads", id), { views: increment(1) });
  } catch {
    // non-critical
  }
}

export async function listAds(filters: AdFilters = {}, max = 300): Promise<Ad[]> {
  // Only the always-present status filter is applied server-side, alongside
  // a fixed newest-first order; every other filter (category/animalType/
  // breed/region) is applied client-side below — the search system only
  // ever narrows by section and region, so there's no need for more than
  // this one sort order and its one composite index.
  const q = query(
    adsCol,
    where("status", "==", "active"),
    orderBy("createdAt", "desc"),
    fsLimit(max)
  );
  const snap = await getDocs(q);
  let ads = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Ad, "id">) }));

  if (filters.category) ads = ads.filter((a) => (a.category || "livestock") === filters.category);
  if (filters.subCategory) ads = ads.filter((a) => a.subCategory === filters.subCategory);
  if (filters.animalType) ads = ads.filter((a) => a.animalType === filters.animalType);
  if (filters.breed) ads = ads.filter((a) => a.breed === filters.breed);
  if (filters.region) ads = ads.filter((a) => a.region === filters.region);

  return ads;
}

export async function listAdsBySeller(sellerId: string): Promise<Ad[]> {
  const q = query(adsCol, where("sellerId", "==", sellerId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Ad, "id">) }));
}

export async function listSimilarAds(ad: Ad, max = 4): Promise<Ad[]> {
  const q = query(
    adsCol,
    where("status", "==", "active"),
    where("category", "==", ad.category),
    fsLimit(max + 10)
  );
  const snap = await getDocs(q);
  let ads = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Ad, "id">) }))
    .filter((a) => a.id !== ad.id);
  if (ad.category === "livestock") {
    ads = ads.filter((a) => a.animalType === ad.animalType);
  }
  return ads.slice(0, max);
}

export async function listAllAdsAdmin(): Promise<Ad[]> {
  const q = query(adsCol, orderBy("createdAt", "desc"), fsLimit(500));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Ad, "id">) }));
}
