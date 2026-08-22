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
import { Breed } from "./types";

const breedsCol = collection(db, "breeds");

export async function listBreeds(): Promise<Breed[]> {
  const q = query(breedsCol, orderBy("animalType"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Breed, "id">) }));
}

export async function addBreed(animalType: string, name: string) {
  await addDoc(breedsCol, { animalType, name });
}

export async function removeBreed(id: string) {
  await deleteDoc(doc(db, "breeds", id));
}
