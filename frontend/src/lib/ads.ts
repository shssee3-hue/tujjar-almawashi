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
import { Ad } from "./types";

const adsCol = collection(db, "ads");

export interface AdFilters {
  animalType?: string;
  breed?: string;
  region?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  q?: string;
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
  // Only the always-present status filter is applied server-side alongside
  // the sort field; every other filter (animalType/breed/region/city/price/q)
  // is applied client-side below. Combining several equality filters with a
  // differently-sorted orderBy would each need its own Firestore composite
  // index (a combinatorial number of them for this many optional filters),
  // so this keeps the index footprint to exactly one per sort option.
  let sortField: "createdAt" | "price" | "views" = "createdAt";
  let sortDir: "asc" | "desc" = "desc";
  if (filters.sort === "price_asc") {
    sortField = "price";
    sortDir = "asc";
  } else if (filters.sort === "price_desc") {
    sortField = "price";
    sortDir = "desc";
  } else if (filters.sort === "views") {
    sortField = "views";
    sortDir = "desc";
  }

  const q = query(
    adsCol,
    where("status", "==", "active"),
    orderBy(sortField, sortDir),
    fsLimit(max)
  );
  const snap = await getDocs(q);
  let ads = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Ad, "id">) }));

  if (filters.animalType) ads = ads.filter((a) => a.animalType === filters.animalType);
  if (filters.breed) ads = ads.filter((a) => a.breed === filters.breed);
  if (filters.region) ads = ads.filter((a) => a.region === filters.region);
  if (filters.minPrice !== undefined) ads = ads.filter((a) => a.price >= filters.minPrice!);
  if (filters.maxPrice !== undefined) ads = ads.filter((a) => a.price <= filters.maxPrice!);
  if (filters.city) {
    const needleCity = filters.city.trim().toLowerCase();
    ads = ads.filter((a) => a.city.toLowerCase().includes(needleCity));
  }
  if (filters.q) {
    const needle = filters.q.trim().toLowerCase();
    ads = ads.filter(
      (a) =>
        a.title.toLowerCase().includes(needle) ||
        a.description.toLowerCase().includes(needle) ||
        a.breed.toLowerCase().includes(needle)
    );
  }

  return ads;
}

export async function listFeaturedAds(max = 8): Promise<Ad[]> {
  const q = query(
    adsCol,
    where("status", "==", "active"),
    where("featured", "==", true),
    orderBy("createdAt", "desc"),
    fsLimit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Ad, "id">) }));
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
    where("animalType", "==", ad.animalType),
    fsLimit(max + 1)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Ad, "id">) }))
    .filter((a) => a.id !== ad.id)
    .slice(0, max);
}

export async function listAllAdsAdmin(): Promise<Ad[]> {
  const q = query(adsCol, orderBy("createdAt", "desc"), fsLimit(500));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Ad, "id">) }));
}
