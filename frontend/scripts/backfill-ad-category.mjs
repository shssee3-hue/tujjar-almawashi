/**
 * One-time backfill: set ads/{id}.category = "livestock" on any ad that is
 * missing the field.
 *
 * src/lib/ads.ts filters the listing by an equality on `category`
 * server-side, so a legacy ad written before the field existed would not
 * show up under the livestock sections until this runs.
 *
 * Idempotent — ads that already have a category are skipped, so it is safe
 * to re-run.
 *
 * Usage (from frontend/scripts/):
 *   npm install
 *   export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/serviceAccountKey.json
 *   node backfill-ad-category.mjs --dry-run   # review first
 *   node backfill-ad-category.mjs             # apply
 *
 * A service-account key comes from Firebase console -> Project settings ->
 * Service accounts -> Generate new private key. Runs fine on the free plan.
 */

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const DRY_RUN = process.argv.includes("--dry-run");

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

async function main() {
  const snap = await db.collection("ads").get();
  let touched = 0;
  for (const doc of snap.docs) {
    const c = doc.data().category;
    if (c !== undefined && c !== null && c !== "") continue;
    touched++;
    console.log(`ads/${doc.id}: category -> "livestock"`);
    if (!DRY_RUN) await doc.ref.update({ category: "livestock" });
  }
  console.log(
    `\n${touched} ad(s) ${DRY_RUN ? "would be" : "were"} updated.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
