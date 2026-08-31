/**
 * Server-side (Admin SDK) operations for تجّار المواشي.
 *
 * Everything else in this app runs entirely client-side against Firestore
 * directly — these are the only operations that genuinely require
 * privileged access a browser can never safely hold:
 *   - Setting a NEW password on an account the caller isn't currently
 *     signed into (the whole point of "forgot password").
 *   - Deleting a DIFFERENT user's Firebase Auth account.
 *
 * OTP delivery/verification: Firebase Phone Authentication (Google's own —
 * no third-party SMS provider account needed). The client calls
 * signInWithPhoneNumber()/confirmationResult.confirm() directly against
 * Firebase; this file never generates, sends, or checks a raw code itself.
 * See src/lib/passwordReset.ts and src/app/forgot-password/page.tsx on the
 * client side for that part of the flow.
 */

import { randomUUID } from "node:crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

initializeApp();
const db = getFirestore();

const RESET_SESSION_TTL_MS = 3 * 60 * 1000; // 3 minutes, per spec

// Firestore caps `in` filters at 30 values and a write batch at 500 ops;
// most helpers below fan work out in chunks to stay under those limits.
function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Step 1: seller enters their phone number on the "forgot password" page.
 * Looks the number up against users/{uid}.phoneNumber and opens a reset
 * session — the client sends the actual SMS itself right after this
 * succeeds, via Firebase Phone Auth (signInWithPhoneNumber), which needs
 * no server-side involvement at all.
 */
export const startPhoneReset = onCall({ region: "us-central1" }, async (request) => {
  const phone = String(request.data?.phone || "").trim();
  if (!phone) {
    throw new HttpsError("invalid-argument", "يرجى إدخال رقم الجوال");
  }

  const usersSnap = await db
    .collection("users")
    .where("phoneNumber", "==", phone)
    .limit(1)
    .get();
  // Do NOT reveal whether the number is registered (that would be a phone
  // enumeration oracle). For an unknown number, return a normally-shaped
  // response with an opaque resetId that no later step can act on — the
  // client still runs the Firebase Phone Auth SMS step, and the flow simply
  // fails generically at completePhoneReset ("طلب غير صالح").
  if (usersSnap.empty) {
    return {
      resetId: randomUUID(),
      expiresAt: Date.now() + RESET_SESSION_TTL_MS,
    };
  }
  const userDoc = usersSnap.docs[0];

  // Invalidate any earlier still-pending reset sessions for this number so
  // only the most recently requested one can ever be completed.
  const pendingSnap = await db
    .collection("password_resets")
    .where("phone", "==", phone)
    .where("used", "==", false)
    .get();
  await Promise.all(pendingSnap.docs.map((d) => d.ref.update({ used: true })));

  const createdAt = Date.now();
  const expiresAt = createdAt + RESET_SESSION_TTL_MS;
  const resetRef = await db.collection("password_resets").add({
    phone,
    uid: userDoc.id,
    createdAt,
    expiresAt,
    used: false,
    verified: false,
  });

  return { resetId: resetRef.id, expiresAt };
});

/**
 * Step 2: after the client itself confirms the 6-digit code with Firebase
 * Phone Auth (confirmationResult.confirm(code)), it calls this function —
 * now authenticated as a temporary phone-credential Firebase user, whose ID
 * token carries a verified `phone_number` claim straight from Google. This
 * cross-checks that claim against the reset session before marking it
 * verified, so a phone verified for one session can't complete a different
 * (or already-expired) one.
 */
export const completePhoneReset = onCall({ region: "us-central1" }, async (request) => {
  const resetId = String(request.data?.resetId || "");
  if (!resetId) {
    throw new HttpsError("invalid-argument", "بيانات غير مكتملة");
  }
  const verifiedPhone = request.auth?.token?.phone_number;
  if (!request.auth || !verifiedPhone) {
    throw new HttpsError("unauthenticated", "يجب التحقق من رقم الجوال أولًا");
  }

  // One generic failure for every "this session can't be completed" case
  // (unknown/opaque resetId, already used, expired, phone mismatch) so the
  // response never distinguishes a registered number from an unknown one.
  const invalid = () =>
    new HttpsError("failed-precondition", "تعذّر التحقق، يرجى طلب رمز جديد");

  const ref = db.collection("password_resets").doc(resetId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw invalid();
  }
  const data = snap.data() as { phone: string; used: boolean; expiresAt: number };

  if (data.used) {
    throw invalid();
  }
  if (Date.now() > data.expiresAt) {
    await ref.update({ used: true });
    throw invalid();
  }
  if (data.phone !== verifiedPhone) {
    throw invalid();
  }

  await ref.update({ verified: true });
  return { success: true };
});

/**
 * Step 3: seller sets their new password. Requires a resetId that was
 * already verified in step 2 and not yet consumed — the actual privileged
 * operation (admin.auth().updateUser with a new password) only Admin SDK
 * code can perform.
 */
export const resetPasswordWithOtp = onCall({ region: "us-central1" }, async (request) => {
  const resetId = String(request.data?.resetId || "");
  const newPassword = String(request.data?.newPassword || "");

  if (newPassword.length < 6 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    throw new HttpsError(
      "invalid-argument",
      "كلمة المرور يجب ألا تقل عن 6 خانات وتحتوي على أرقام وحروف"
    );
  }

  const ref = db.collection("password_resets").doc(resetId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "طلب غير صالح، يرجى طلب رمز جديد");
  }
  const data = snap.data() as { uid: string; used: boolean; verified: boolean };

  if (data.used || !data.verified) {
    throw new HttpsError(
      "failed-precondition",
      "يجب التحقق من رمز صحيح قبل تغيير كلمة المرور"
    );
  }

  await getAuth().updateUser(data.uid, { password: newPassword });
  await ref.update({ used: true });

  return { success: true };
});

/**
 * Owner-only: permanently deletes a user — their Firestore profile, ads,
 * comments, filed reports, ratings (both the ones they left and the ones
 * left on their ads), commission records, and uploaded Storage files, plus
 * (the part only Admin SDK can do) their actual Firebase Auth account.
 */
export const deleteUserCompletely = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "يجب تسجيل الدخول");
  }
  const targetUid = String(request.data?.targetUid || "");
  if (!targetUid) {
    throw new HttpsError("invalid-argument", "بيانات غير مكتملة");
  }

  const callerDoc = await db.collection("users").doc(request.auth.uid).get();
  if (callerDoc.data()?.role !== "owner") {
    throw new HttpsError("permission-denied", "هذا الإجراء متاح لمالك النظام فقط");
  }
  if (targetUid === request.auth.uid) {
    throw new HttpsError("failed-precondition", "لا يمكنك حذف حسابك الخاص من هنا");
  }

  const [adsSnap, ratingsByUserSnap, commissionsSnap, commentsSnap, reportsSnap] =
    await Promise.all([
      db.collection("ads").where("sellerId", "==", targetUid).get(),
      db.collection("ratings").where("userId", "==", targetUid).get(),
      db.collection("commissions").where("sellerId", "==", targetUid).get(),
      db.collection("comments").where("userId", "==", targetUid).get(),
      db.collection("reports").where("reporterId", "==", targetUid).get(),
    ]);

  // Ratings left by other users ON the target's ads would otherwise be
  // orphaned; fetch them via the ad ids (chunked — `in` caps at 30).
  const adIds = adsSnap.docs.map((d) => d.id);
  const ratingsOnAdsDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
  for (const group of chunk(adIds, 30)) {
    const s = await db.collection("ratings").where("adId", "in", group).get();
    ratingsOnAdsDocs.push(...s.docs);
  }

  // Dedupe by path (a rating can match both queries) then delete in
  // batches of 400 to stay under the 500-op limit for a prolific seller.
  const refs = new Map<string, FirebaseFirestore.DocumentReference>();
  for (const d of [
    ...adsSnap.docs,
    ...ratingsByUserSnap.docs,
    ...ratingsOnAdsDocs,
    ...commissionsSnap.docs,
    ...commentsSnap.docs,
    ...reportsSnap.docs,
  ]) {
    refs.set(d.ref.path, d.ref);
  }
  refs.set(`users/${targetUid}`, db.collection("users").doc(targetUid));

  for (const group of chunk([...refs.values()], 400)) {
    const batch = db.batch();
    group.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  // The seller's uploaded ad photos and payment receipts. Best-effort —
  // the Firestore records are already gone and Auth deletion still follows.
  await Promise.all([
    getStorage()
      .bucket()
      .deleteFiles({ prefix: `ad-images/${targetUid}/` })
      .catch(() => undefined),
    getStorage()
      .bucket()
      .deleteFiles({ prefix: `commission-receipts/${targetUid}/` })
      .catch(() => undefined),
  ]);

  // Ratings deleted above fire recomputeSellerRating for the affected ads,
  // which self-heals the *other* sellers' aggregates.

  await getAuth()
    .deleteUser(targetUid)
    .catch((err) => {
      // The Firestore side is already gone at this point; surface the Auth
      // failure clearly rather than silently reporting overall success.
      throw new HttpsError(
        "internal",
        `تم حذف بيانات المستخدم، لكن تعذر حذف حسابه من Auth: ${err.message}`
      );
    });

  return { success: true };
});

/**
 * Keeps a seller's reputation score in sync. A rating lives at
 * ratings/{adId}_{userId} and is really a rating of the *seller* via one of
 * their ads, so whenever any rating for any of a seller's ads is created,
 * changed, or deleted we recompute the average across ALL their ads and
 * write it to users/{sellerId}.rating (+ ratingCount), mirroring it onto
 * every one of that seller's ad docs as sellerRating (+ sellerRatingCount)
 * so ad cards/pages can show it without a users lookup.
 *
 * This is the only writer of those fields — firestore.rules pins them to 0
 * at creation and blocks sellers from editing them, and this function runs
 * with Admin privileges that bypass the rules. The per-ad average shown by
 * <RatingStars> is a separate, deliberately narrower number.
 */
export const recomputeSellerRating = onDocumentWritten(
  { document: "ratings/{ratingId}", region: "us-central1" },
  async (event) => {
    const adId = (event.data?.after.data()?.adId ??
      event.data?.before.data()?.adId) as string | undefined;
    if (!adId) return;

    const adSnap = await db.collection("ads").doc(adId).get();
    const sellerId = adSnap.get("sellerId") as string | undefined;
    if (!sellerId) return;

    const sellerAdsSnap = await db
      .collection("ads")
      .where("sellerId", "==", sellerId)
      .get();
    const sellerAdIds = sellerAdsSnap.docs.map((d) => d.id);

    let sum = 0;
    let count = 0;
    for (const group of chunk(sellerAdIds, 30)) {
      const rs = await db.collection("ratings").where("adId", "in", group).get();
      rs.forEach((r) => {
        const value = r.get("value");
        if (typeof value === "number") {
          sum += value;
          count += 1;
        }
      });
    }
    const rating = count ? Math.round((sum / count) * 10) / 10 : 0;

    const targets: FirebaseFirestore.DocumentReference[] = [
      db.collection("users").doc(sellerId),
      ...sellerAdsSnap.docs.map((d) => d.ref),
    ];
    for (const group of chunk(targets, 400)) {
      const batch = db.batch();
      for (const ref of group) {
        if (ref.parent.id === "users") {
          batch.set(ref, { rating, ratingCount: count }, { merge: true });
        } else {
          batch.update(ref, { sellerRating: rating, sellerRatingCount: count });
        }
      }
      await batch.commit();
    }
  }
);
