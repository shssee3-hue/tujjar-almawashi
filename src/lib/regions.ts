import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "./firebase";
import { RegionCity } from "./types";

const regionsCol = collection(db, "regions");

export async function listRegions(): Promise<RegionCity[]> {
  const q = query(regionsCol, orderBy("region"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RegionCity, "id">) }));
}

export async function addRegionCity(region: string, city: string) {
  await addDoc(regionsCol, { region, city });
}

export async function removeRegionCity(id: string) {
  await deleteDoc(doc(db, "regions", id));
}
