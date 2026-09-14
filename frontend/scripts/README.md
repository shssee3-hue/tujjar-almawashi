# scripts/

One-off maintenance scripts. **Not** part of the app bundle or CI — run by hand,
with a service-account key, against a known project. All run fine on the free
(Spark) plan.

## backfill-ad-category.mjs

Sets `ads/{id}.category = "livestock"` on any ad missing the field, so the
server-side equality filter in `src/lib/ads.ts` finds legacy ads. Idempotent.

```bash
cd frontend/scripts
npm install
export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/serviceAccountKey.json
node backfill-ad-category.mjs --dry-run   # review
node backfill-ad-category.mjs             # apply
```

Service-account key: Firebase console → Project settings → Service accounts →
*Generate new private key*.

## backfill-ads-private-contact.mjs

Moves `phoneNumber` / `whatsapp` off each public `ads/{id}` document into the
access-controlled `adsPrivate/{id}` document, then strips them from the ad.
Run once after deploying the `adsPrivate` rules so pre-existing ads stop
leaking seller numbers via the SDK. Idempotent.

```bash
cd frontend/scripts
npm install
export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/serviceAccountKey.json
node backfill-ads-private-contact.mjs --dry-run   # review
node backfill-ads-private-contact.mjs             # apply
```

## process-images.mjs

Build-time helper that turns raw source images in `public/images/` into the
`.webp` category icons / hero used by the static site. Unrelated to ad data.

## backup-firestore.mjs

Exports every Firestore collection to a single JSON file and uploads it to a
**private** Cloudflare R2 bucket, pruning anything past the most recent 30
backups. Runs daily via `.github/workflows/backup.yml` — this is the
Spark-plan-compatible stand-in for Firebase's own scheduled export (which
needs Blaze + Cloud Scheduler). Since **this repo is public**, the exported
data (PII, bank-receipt images) never touches git or workflow logs/artifacts;
it goes straight from the Admin SDK to R2 over the S3 API.

### One-time setup (owner)

1. **Create a private R2 bucket** — Cloudflare dashboard → R2 → Create
   bucket (e.g. `tujjar-backups`). Do **not** enable public access on it.
2. **Create an R2 API token** — R2 → Manage API tokens → Create API token,
   scoped to that bucket, "Object Read & Write". Note the Access Key ID,
   Secret Access Key, and your Account ID (shown on the R2 overview page).
3. **Add GitHub Actions secrets** — repo → Settings → Secrets and variables →
   Actions → New repository secret:
   - `FIREBASE_SERVICE_ACCOUNT_JSON` — paste the *full contents* of a
     service-account key (Firebase console → Project settings → Service
     accounts → Generate new private key).
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
     `R2_BUCKET_NAME` — from steps 1–2.
4. The workflow then runs automatically every day at 01:00 UTC, or on demand
   from the Actions tab ("Firestore backup" → Run workflow).

### Manual run

```bash
cd frontend/scripts
npm install
export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/serviceAccountKey.json
export R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_BUCKET_NAME=...
node backup-firestore.mjs
```

### Restoring from a backup

There's no restore script (never needed yet) — a backup file is a JSON object
`{ exportedAt, collections: { <name>: [{ id, ...fields }] } }`. Restoring
means writing each collection's array back with the Admin SDK
(`db.collection(name).doc(id).set(fields)`), which is a few lines with the
same `firebase-admin` dependency already in this folder.
