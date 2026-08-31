/**
 * One-time migration: move Base64 image data-URIs that are currently stored
 * inside Firestore documents into Cloud Storage, replacing each with its
 * download URL.
 *
 *   ads/{id}.images[]        data:image/... -> ad-images/{sellerId}/{id}-{n}.jpg
 *   commissions/{id}.receiptFile  data:image/... -> commission-receipts/{sellerId}/{id}.jpg
 *
 * Also backfills ads/{id}.category = "livestock" when the field is missing,
 * so the server-side equality filter in src/lib/ads.ts finds legacy ads.
 *
 * Idempotent: entries that are already https:// URLs are left untouched, so
 * the script is safe to re-run.
 *
 * Usage (from frontend/scripts/):
 *   npm install
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
 *   export FIREBASE_STORAGE_BUCKET=tujjar-almawashi.firebasestorage.app
 *   node migrate-images-to-storage.mjs --dry-run   # review first
 *   node migrate-images-to-storage.mjs             # apply
 *
 * Prerequisites: the Blaze plan is active and storage.rules has been
 * deployed. Take a Firestore export / run against a copy first if you can.
 */

import { randomUUID } from "node:crypto";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const DRY_RUN = process.argv.includes("--dry-run");
const BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET ||
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
  "tujjar-almawashi.firebasestorage.app";

initializeApp({ credential: applicationDefault(), storageBucket: BUCKET });
const db = getFirestore();
const bucket = getStorage().bucket();

// Only data: URIs are migrated; anything else (notably an https:// URL from a
// previous run) is passed through untouched, which makes the script re-runnable.
const isDataUri = (v) => typeof v === "string" && v.startsWith("data:");

function parseDataUri(uri) {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(uri);
  if (!match) return null;
  const contentType = match[1] || "image/jpeg";
  const isBase64 = !!match[2];
  const data = Buffer.from(
    decodeURIComponent(match[3]),
    isBase64 ? "base64" : "utf8"
  );
  return { contentType, data };
}

async function uploadDataUri(uri, objectPath) {
  const parsed = parseDataUri(uri);
  if (!parsed) throw new Error("unparseable data URI");
  const token = randomUUID();
  const file = bucket.file(objectPath);
  await file.save(parsed.data, {
    resumable: false,
    contentType: parsed.contentType,
    metadata: { metadata: { firebaseStorageDownloadTokens: token } },
  });
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
    objectPath
  )}?alt=media&token=${token}`;
}

async function migrateAds() {
  const snap = await db.collection("ads").get();
  let touched = 0;
  for (const doc of snap.docs) {
    const ad = doc.data();
    const update = {};

    if (Array.isArray(ad.images) && ad.images.some(isDataUri)) {
      const sellerId = ad.sellerId || "unknown";
      const next = [];
      for (let i = 0; i < ad.images.length; i++) {
        const entry = ad.images[i];
        if (isDataUri(entry)) {
          const path = `ad-images/${sellerId}/${doc.id}-${i}.jpg`;
          next.push(DRY_RUN ? `<upload:${path}>` : await uploadDataUri(entry, path));
        } else {
          next.push(entry);
        }
      }
      update.images = next;
    }

    if (ad.category === undefined || ad.category === null || ad.category === "") {
      update.category = "livestock";
    }

    if (Object.keys(update).length === 0) continue;
    touched++;
    console.log(`ads/${doc.id}: ${Object.keys(update).join(", ")}`);
    if (!DRY_RUN) await doc.ref.update(update);
  }
  console.log(`ads: ${touched} document(s) ${DRY_RUN ? "would be" : ""} updated\n`);
}

async function migrateCommissions() {
  const snap = await db.collection("commissions").get();
  let touched = 0;
  for (const doc of snap.docs) {
    const c = doc.data();
    if (!isDataUri(c.receiptFile)) continue;
    const sellerId = c.sellerId || "unknown";
    const path = `commission-receipts/${sellerId}/${doc.id}.jpg`;
    const url = DRY_RUN ? `<upload:${path}>` : await uploadDataUri(c.receiptFile, path);
    touched++;
    console.log(`commissions/${doc.id}: receiptFile`);
    if (!DRY_RUN) await doc.ref.update({ receiptFile: url });
  }
  console.log(
    `commissions: ${touched} document(s) ${DRY_RUN ? "would be" : ""} updated\n`
  );
}

async function main() {
  console.log(
    `${DRY_RUN ? "DRY RUN — " : ""}migrating Base64 images to gs://${BUCKET}\n`
  );
  await migrateAds();
  await migrateCommissions();
  console.log("done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
