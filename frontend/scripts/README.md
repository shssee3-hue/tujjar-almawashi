# scripts/

One-off maintenance scripts. **Not** part of the app bundle or CI — run by hand,
with a service-account key, against a known project.

## migrate-images-to-storage.mjs

Moves the legacy Base64 image data-URIs that live inside Firestore documents
into Cloud Storage, rewriting each to its download URL:

| Field | Before | After |
|---|---|---|
| `ads/{id}.images[]` | `data:image/jpeg;base64,…` | `https://firebasestorage.googleapis.com/…` |
| `commissions/{id}.receiptFile` | `data:image/jpeg;base64,…` | `https://firebasestorage.googleapis.com/…` |

It also backfills `ads/{id}.category = "livestock"` when that field is missing,
which the server-side filter in `src/lib/ads.ts` now relies on.

The script only touches `data:` entries, so it is **idempotent** — safe to
re-run, and safe to run while a few new (already-migrated) ads exist.

### Prerequisites

1. The Firebase project is on the **Blaze** plan (Storage requires it).
2. `storage.rules` has been deployed (`firebase deploy --only storage`).
3. A service-account key JSON (Firebase console → Project settings → Service
   accounts → *Generate new private key*).
4. Ideally, a fresh Firestore export or a staging copy to run against first.

### Run

```bash
cd frontend/scripts
npm install

export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/serviceAccountKey.json
export FIREBASE_STORAGE_BUCKET=tujjar-almawashi.firebasestorage.app

# 1. Review what would change — no writes, no uploads:
node migrate-images-to-storage.mjs --dry-run

# 2. Apply:
node migrate-images-to-storage.mjs
```

Every changed document is printed. After it finishes, spot-check a few old ads
in the app: their photos should still render, and the ad doc's `images[]` should
now hold `https://…` URLs instead of `data:` blobs.
