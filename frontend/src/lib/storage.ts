import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "./firebase";

// Cloud Storage layout (see storage.rules):
//   ad-images/{uid}/{uuid}.jpg          — public read, owner write
//   commission-receipts/{uid}/{uuid}.jpg — owner read (admin opens the
//                                          tokened getDownloadURL link), owner write
//
// Every uploaded blob is already compressed client-side by
// fileToCompressedBlob() in ./image.ts, so these helpers just place it and
// hand back the long-lived download URL that gets stored on the Firestore doc.

async function upload(path: string, blob: Blob): Promise<string> {
  const objectRef = ref(storage, path);
  await uploadBytes(objectRef, blob, { contentType: blob.type || "image/jpeg" });
  return getDownloadURL(objectRef);
}

export function uploadAdImage(uid: string, blob: Blob): Promise<string> {
  return upload(`ad-images/${uid}/${crypto.randomUUID()}.jpg`, blob);
}

export function uploadCommissionReceipt(uid: string, blob: Blob): Promise<string> {
  return upload(`commission-receipts/${uid}/${crypto.randomUUID()}.jpg`, blob);
}

// Best-effort cleanup when a seller removes an image before saving, or swaps
// a receipt. A no-op for anything that isn't one of our Storage URLs — most
// importantly a legacy Base64 data-URI on an ad created before this change,
// which has no object to delete.
export async function deleteByUrl(url: string): Promise<void> {
  if (!url || !url.startsWith("https://")) return;
  try {
    await deleteObject(ref(storage, url));
  } catch {
    // already gone, or not ours — nothing to do
  }
}
