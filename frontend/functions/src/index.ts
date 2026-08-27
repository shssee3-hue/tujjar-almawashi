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
 * OTP delivery/verification: delegated entirely to Authentica
 * (https://authentica.sa), a Saudi OTP-as-a-service platform — it
 * generates and checks the 6-digit code itself, so this project never
 * generates or stores the raw code. See authentica.ts for the adapter and
 * an important note on its (unverified-live) API shape. Requires a secret,
 * set via `firebase functions:secrets:set AUTHENTICA_API_KEY`.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { sendOtp, verifyOtp, AuthenticaError } from "./authentica";

initializeApp();
const db = getFirestore();

const AUTHENTICA_API_KEY = defineSecret("AUTHENTICA_API_KEY");

const RESET_SESSION_TTL_MS = 3 * 60 * 1000; // 3 minutes, per spec
const MAX_VERIFY_ATTEMPTS = 5; // defense-in-depth on top of Authentica's own limits

/**
 * Step 1: seller enters their phone number on the "forgot password" page.
 * Looks the number up against users/{uid}.phoneNumber, then asks
 * Authentica to generate and text a 6-digit OTP to it.
 */
export const requestPasswordResetOtp = onCall(
  { secrets: [AUTHENTICA_API_KEY], region: "us-central1" },
  async (request) => {
    const phone = String(request.data?.phone || "").trim();
    if (!phone) {
      throw new HttpsError("invalid-argument", "يرجى إدخال رقم الجوال");
    }

    const usersSnap = await db
      .collection("users")
      .where("phoneNumber", "==", phone)
      .limit(1)
      .get();
    if (usersSnap.empty) {
      throw new HttpsError("not-found", "هذا الرقم غير مسجّل في المنصة");
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

    try {
      await sendOtp(AUTHENTICA_API_KEY.value(), phone);
    } catch (err) {
      throw new HttpsError(
        "internal",
        err instanceof AuthenticaError ? err.message : "تعذر إرسال رمز التحقق"
      );
    }

    const createdAt = Date.now();
    const expiresAt = createdAt + RESET_SESSION_TTL_MS;
    const resetRef = await db.collection("password_resets").add({
      phone,
      uid: userDoc.id,
      createdAt,
      expiresAt,
      used: false,
      verified: false,
      attempts: 0,
    });

    return { resetId: resetRef.id, expiresAt };
  }
);

/**
 * Step 2: seller enters the 6-digit code. It's checked against Authentica
 * (which generated it in step 1), never against anything stored here. On
 * success, marks the record "verified" (not yet "used" — that only happens
 * once the password is actually changed) so step 3 doesn't need the code
 * again.
 */
export const verifyPasswordResetOtp = onCall(
  { secrets: [AUTHENTICA_API_KEY], region: "us-central1" },
  async (request) => {
    const resetId = String(request.data?.resetId || "");
    const otp = String(request.data?.otp || "");
    if (!resetId || !otp) {
      throw new HttpsError("invalid-argument", "بيانات غير مكتملة");
    }

    const ref = db.collection("password_resets").doc(resetId);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "طلب غير صالح، يرجى طلب رمز جديد");
    }
    const data = snap.data() as {
      phone: string;
      used: boolean;
      verified: boolean;
      expiresAt: number;
      attempts: number;
    };

    if (data.used) {
      throw new HttpsError("failed-precondition", "انتهت صلاحية الرمز، يرجى طلب رمز جديد");
    }
    if (Date.now() > data.expiresAt) {
      throw new HttpsError("deadline-exceeded", "انتهت صلاحية الرمز، يرجى طلب رمز جديد");
    }
    if (data.attempts >= MAX_VERIFY_ATTEMPTS) {
      await ref.update({ used: true });
      throw new HttpsError("resource-exhausted", "محاولات كثيرة، يرجى طلب رمز جديد");
    }

    try {
      await verifyOtp(AUTHENTICA_API_KEY.value(), data.phone, otp);
    } catch (err) {
      if (err instanceof AuthenticaError && err.kind === "expired") {
        await ref.update({ used: true });
        throw new HttpsError("deadline-exceeded", err.message);
      }
      await ref.update({ attempts: (data.attempts || 0) + 1 });
      throw new HttpsError(
        "invalid-argument",
        err instanceof AuthenticaError ? err.message : "الرمز غير صحيح"
      );
    }

    await ref.update({ verified: true });
    return { success: true };
  }
);

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
 * ratings, and commission records, plus (the part only Admin SDK can do)
 * their actual Firebase Auth account.
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

  const [adsSnap, ratingsSnap, commissionsSnap] = await Promise.all([
    db.collection("ads").where("sellerId", "==", targetUid).get(),
    db.collection("ratings").where("userId", "==", targetUid).get(),
    db.collection("commissions").where("sellerId", "==", targetUid).get(),
  ]);

  const batch = db.batch();
  adsSnap.docs.forEach((d) => batch.delete(d.ref));
  ratingsSnap.docs.forEach((d) => batch.delete(d.ref));
  commissionsSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(db.collection("users").doc(targetUid));
  await batch.commit();

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
