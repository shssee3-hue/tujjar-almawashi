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

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

initializeApp();
const db = getFirestore();

const RESET_SESSION_TTL_MS = 3 * 60 * 1000; // 3 minutes, per spec

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

  const ref = db.collection("password_resets").doc(resetId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "طلب غير صالح، يرجى طلب رمز جديد");
  }
  const data = snap.data() as { phone: string; used: boolean; expiresAt: number };

  if (data.used) {
    throw new HttpsError("failed-precondition", "انتهت صلاحية الرمز، يرجى طلب رمز جديد");
  }
  if (Date.now() > data.expiresAt) {
    await ref.update({ used: true });
    throw new HttpsError("deadline-exceeded", "انتهت صلاحية الرمز، يرجى طلب رمز جديد");
  }
  if (data.phone !== verifiedPhone) {
    throw new HttpsError("permission-denied", "رقم الجوال المتحقق منه لا يطابق هذا الطلب");
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
