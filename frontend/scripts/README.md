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
