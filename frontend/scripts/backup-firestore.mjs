/**
 * Exports every Firestore collection to a single JSON file and uploads it to
 * a private Cloudflare R2 bucket. Meant to run on a schedule (see
 * .github/workflows/backup.yml) as a Spark-plan-compatible substitute for
 * Firebase's own scheduled export (which requires Blaze + Cloud Scheduler).
 *
 * The repo (shssee3-hue/tujjar-almawashi) is PUBLIC, so this script never
 * writes the exported data anywhere git-tracked and never logs document
 * contents (users/adsPrivate/commissions carry PII and bank-receipt images).
 * The only destination is the private R2 bucket named by R2_BUCKET_NAME.
 *
 * Env vars (all required):
 *   GOOGLE_APPLICATION_CREDENTIALS  path to a Firebase service-account key
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 *
 * Usage (manual, from frontend/scripts/):
 *   npm install
 *   export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/serviceAccountKey.json
 *   export R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_BUCKET_NAME=...
 *   node backup-firestore.mjs
 *
 * In CI this runs via .github/workflows/backup.yml with the same env vars
 * sourced from GitHub Actions secrets.
 */

import { gzipSync } from "node:zlib";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// Every collection actually written by the app (see firestore.rules).
// Excludes: ratings (feature disabled, no live docs) and password_resets
// (short-lived OTPs, not meant to be retained).
const COLLECTIONS = [
  "users",
  "ads",
  "adsPrivate",
  "comments",
  "reports",
  "commissions",
  "deletionRequests",
  "settings",
  "breeds",
  "regions",
  "additionalServices",
  "counters",
];

const KEEP_LAST = 30; // ~1 month of daily backups

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

async function exportFirestore() {
  initializeApp({ credential: applicationDefault() });
  const db = getFirestore();

  const collections = {};
  for (const name of COLLECTIONS) {
    const snap = await db.collection(name).get();
    collections[name] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    console.log(`  ${name}: ${snap.size} doc(s)`);
  }
  return { exportedAt: new Date().toISOString(), collections };
}

async function uploadAndPrune(payload) {
  const accountId = requireEnv("R2_ACCOUNT_ID");
  const bucket = requireEnv("R2_BUCKET_NAME");
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  });

  const json = JSON.stringify(payload);
  const body = gzipSync(Buffer.from(json, "utf-8"));
  const key = `backups/firestore-${payload.exportedAt.replace(/[:.]/g, "-")}.json.gz`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "application/json",
      ContentEncoding: "gzip",
    })
  );
  console.log(`Uploaded ${key} (${(body.length / 1024).toFixed(1)} KB)`);

  // Retention: keep only the most recent KEEP_LAST backups.
  const list = await s3.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: "backups/" })
  );
  const objects = (list.Contents ?? []).sort((a, b) =>
    (a.Key ?? "").localeCompare(b.Key ?? "")
  );
  const toDelete = objects.slice(0, Math.max(0, objects.length - KEEP_LAST));
  for (const obj of toDelete) {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: obj.Key }));
    console.log(`Pruned old backup: ${obj.Key}`);
  }
}

async function main() {
  console.log("Exporting Firestore collections...");
  const payload = await exportFirestore();
  await uploadAndPrune(payload);
  console.log("Backup complete.");
}

main().catch((err) => {
  console.error("Backup failed:", err.message);
  process.exit(1);
});
