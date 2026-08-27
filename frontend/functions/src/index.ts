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
 * SMS delivery: wired up for Unifonic (https://unifonic.com), the most
 * commonly used SMS provider for Saudi numbers — good local delivery,
 * Arabic support, a straightforward REST API. Requires two secrets, set via
 * `firebase functions:secrets:set UNIFONIC_APP_SID` and
 * `firebase functions:secrets:set UNIFONIC_SENDER_ID` (see the setup notes
 * in the project's README/report for exactly how to get these from a
 * Unifonic account). Until both secrets are set, sendOtpSms() throws a
 * clear "SMS not configured" error rather than silently pretending to send.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { randomInt } from "crypto";

initializeApp();
const db = getFirestore();

const UNIFONIC_APP_SID = defineSecret("UNIFONIC_APP_SID");
const UNIFONIC_SENDER_ID = defineSecret("UNIFONIC_SENDER_ID");

const OTP_TTL_MS = 3 * 60 * 1000; // 3 minutes, per spec
const MAX_VERIFY_ATTEMPTS = 5;

function sixDigitOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

async function sendOtpSms(appSid: string, senderId: string, phone: string, otp: string) {
  if (!appSid || !senderId) {
    throw new HttpsError(
      "failed-precondition",
      "لم يتم إعداد مزوّد الرسائل النصية بعد. راجع الإدارة."
    );
  }
  const body = new URLSearchParams({
    AppSid: appSid,
    SenderID: senderId,
    Body: `رمز التحقق الخاص بك في تجّار المواشي: ${otp}\nصالح لمدة 3 دقائق.`,
    Recipient: phone,
  });
  const res = await fetch("https://el.cloud.unifonic.com/rest/SMS/messages", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new HttpsError("internal", `تعذر إرسال الرسالة النصية (${res.status}): ${text}`);
  }
}

/**
 * Step 1: seller enters their phone number on the "forgot password" page.
 * Looks the number up against users/{uid}.phoneNumber, generates a 6-digit
 * OTP, stores it in password_resets, and texts it. Never returns the OTP
 * itself to the client.
 */
export const requestPasswordResetOtp = onCall(
  { secrets: [UNIFONIC_APP_SID, UNIFONIC_SENDER_ID], region: "us-central1" },
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

    // Invalidate any earlier still-pending OTPs for this number so only the
    // most recent request can ever be verified.
    const pendingSnap = await db
      .collection("password_resets")
      .where("phone", "==", phone)
      .where("used", "==", false)
      .get();
    await Promise.all(
      pendingSnap.docs.map((d) => d.ref.update({ used: true }))
    );

    const otp = sixDigitOtp();
    const createdAt = Date.now();
    const expiresAt = createdAt + OTP_TTL_MS;

    const resetRef = await db.collection("password_resets").add({
      phone,
      otp,
      uid: userDoc.id,
      createdAt,
      expiresAt,
      used: false,
      verified: false,
      attempts: 0,
    });

    await sendOtpSms(
      UNIFONIC_APP_SID.value(),
      UNIFONIC_SENDER_ID.value(),
      phone,
      otp
    );

    return { resetId: resetRef.id, expiresAt };
  }
);

/**
 * Step 2: seller enters the 6-digit code. On success, marks the record
 * "verified" (but not yet "used" — that only happens once the password is
 * actually changed) so the next step doesn't need the phone/OTP again.
 */
export const verifyPasswordResetOtp = onCall({ region: "us-central1" }, async (request) => {
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
    otp: string;
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
  if (data.otp !== otp) {
    await ref.update({ attempts: FieldValue.increment(1) });
    throw new HttpsError("invalid-argument", "الرمز غير صحيح");
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

  await getAuth().deleteUser(targetUid).catch((err) => {
    // The Firestore side is already gone at this point; surface the Auth
    // failure clearly rather than silently reporting overall success.
    throw new HttpsError("internal", `تم حذف بيانات المستخدم، لكن تعذر حذف حسابه من Auth: ${err.message}`);
  });

  return { success: true };
});
