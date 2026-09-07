/**
 * One-time migration: move each ad's phone/WhatsApp out of the public
 * ads/{id} document and into the access-controlled adsPrivate/{id} document.
 *
 * The public ads collection is world-readable, so any `phoneNumber` /
 * `whatsapp` still stored there can be harvested via the SDK even after the
 * app stopped writing them (see firestore.rules -> match /adsPrivate).
 * createAd()/updateAd() in src/lib/ads.ts already write new ads the new way;
 * this backfills every ad created before that change.
 *
 * For each ad that still has phoneNumber or whatsapp on it:
 *   1. upsert adsPrivate/{id} with
 *      { sellerId, phoneNumber, whatsapp, showCallButton, showWhatsappButton }
 *   2. delete phoneNumber + whatsapp from ads/{id}
 *
 * Idempotent — an ad with neither field is skipped, so it is safe to re-run.
 *
 * Usage (from frontend/scripts/):
 *   npm install
 *   export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/serviceAccountKey.json
 *   node backfill-ads-private-contact.mjs --dry-run   # review first
 *   node backfill-ads-private-contact.mjs             # apply
 *
 * A service-account key comes from Firebase console -> Project settings ->
 * Service accounts -> Generate new private key. Runs fine on the free plan.
 */

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const DRY_RUN = process.argv.includes("--dry-run");

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

async function main() {
  const snap = await db.collection("ads").get();
  let touched = 0;
  for (const doc of snap.docs) {
    const d = doc.data();
    const hasPhone = typeof d.phoneNumber === "string" && d.phoneNumber !== "";
    const hasWa = typeof d.whatsapp === "string" && d.whatsapp !== "";
    if (!hasPhone && !hasWa) continue;
    touched++;
    console.log(
      `ads/${doc.id}: -> adsPrivate/${doc.id} (phone:${hasPhone} whatsapp:${hasWa}), strip from ad`
    );
    if (DRY_RUN) continue;

    await db
      .collection("adsPrivate")
      .doc(doc.id)
      .set(
        {
          sellerId: d.sellerId,
          phoneNumber: d.phoneNumber ?? "",
          whatsapp: d.whatsapp ?? "",
          showCallButton: d.showCallButton ?? false,
          showWhatsappButton: d.showWhatsappButton ?? false,
        },
        { merge: true }
      );
    await doc.ref.update({
      phoneNumber: FieldValue.delete(),
      whatsapp: FieldValue.delete(),
    });
  }
  console.log(`\n${touched} ad(s) ${DRY_RUN ? "would be" : "were"} migrated.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
