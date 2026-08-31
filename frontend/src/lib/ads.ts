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
  startAfter,
  increment,
  runTransaction,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { Ad, AdCategory } from "./types";

const adsCol = collection(db, "ads");

// Generates a human-readable, sequential ad code like "AD-2026-001245" —
// AD + the current year + a 6-digit zero-padded sequence number that resets
// each year. Backed by a single counters/adCode document incremented inside
// a transaction so concurrent ad creations never collide on the same
// number; firestore.rules constrains the counter update to a strict +1 (or
// reset-to-1 on a year change) so a client can't rewind or corrupt it.
async function generateAdCode(): Promise<string> {
  const year = new Date().getFullYear();
  const counterRef = doc(db, "counters", "adCode");
  const seq = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const prev = snap.exists() ? (snap.data() as { year: number; seq: number }) : null;
    const nextSeq = prev && prev.year === year ? prev.seq + 1 : 1;
    tx.set(counterRef, { year, seq: nextSeq });
    return nextSeq;
  });
  return `AD-${year}-${String(seq).padStart(6, "0")}`;
}

export interface AdFilters {
  category?: AdCategory;
  subCategory?: string;
  animalType?: string;
  breed?: string;
  region?: string;
}

export interface AdsPage {
  ads: Ad[];
  // Pass back into listAds({ cursor }) to fetch the next page; null once the
  // last page has been reached.
  cursor: QueryDocumentSnapshot<DocumentData> | null;
}

export const ADS_PAGE_SIZE = 12;

export async function createAd(data: Omit<Ad, "id" | "adCode" | "createdAt" | "updatedAt" | "views" | "reportsCount" | "status">) {
  const now = Date.now();
  const adCode = await generateAdCode();
  const docRef = await addDoc(adsCol, {
    ...data,
    adCode,
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

export async function listAds(
  filters: AdFilters = {},
  opts: {
    pageSize?: number;
    cursor?: QueryDocumentSnapshot<DocumentData> | null;
  } = {}
): Promise<AdsPage> {
  const pageSize = opts.pageSize ?? ADS_PAGE_SIZE;

  // section (category OR animalType) and region are filtered server-side —
  // backed by the composite indexes in firestore.indexes.json — so a
  // section/region page fetches roughly one screenful of ads instead of the
  // entire active set. breed/subCategory are a rarely-used tertiary
  // refinement that would multiply the index count, so they stay a
  // client-side narrowing of the fetched page (a page may therefore show
  // fewer than pageSize rows when one is active). Legacy ads written before
  // the `category` field existed are normalised to "livestock" by
  // scripts/backfill-ad-category.mjs so the equality filter still finds them.
  const constraints: QueryConstraint[] = [where("status", "==", "active")];
  if (filters.category) constraints.push(where("category", "==", filters.category));
  if (filters.animalType) constraints.push(where("animalType", "==", filters.animalType));
  if (filters.region) constraints.push(where("region", "==", filters.region));
  constraints.push(orderBy("createdAt", "desc"));
  if (opts.cursor) constraints.push(startAfter(opts.cursor));
  constraints.push(fsLimit(pageSize));

  const snap = await getDocs(query(adsCol, ...constraints));
  let ads = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Ad, "id">) }));

  if (filters.subCategory) ads = ads.filter((a) => a.subCategory === filters.subCategory);
  if (filters.breed) ads = ads.filter((a) => a.breed === filters.breed);

  const cursor = snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : null;
  return { ads, cursor };
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
