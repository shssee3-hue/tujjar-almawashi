import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { AdditionalService, AdCategory } from "./types";

const servicesCol = collection(db, "additionalServices");

export async function listAdditionalServices(): Promise<AdditionalService[]> {
  const q = query(servicesCol, orderBy("category"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdditionalService, "id">) }));
}

export async function addAdditionalService(
  category: Exclude<AdCategory, "livestock" | "offers">,
  name: string
) {
  await addDoc(servicesCol, { category, name });
}

export async function updateAdditionalService(id: string, name: string) {
  await updateDoc(doc(db, "additionalServices", id), { name });
}

export async function removeAdditionalService(id: string) {
  await deleteDoc(doc(db, "additionalServices", id));
}
