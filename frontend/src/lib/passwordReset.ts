import {
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";
import { auth } from "./firebase";

// Free-plan password reset: Firebase sends the email; the "set a new
// password" page is our own /reset-password (handleCodeInApp: true) rather
// than Firebase's default firebaseapp.com-hosted page — so this flow has no
// dependency on Firebase Hosting at all, and works whether that site is
// enabled, stale, or disabled. No Cloud Functions, no phone/SMS, no Blaze
// plan. (The old phone/OTP flow needed the Admin SDK to set a password for a
// signed-out user; that lives in functions/ and is not deployed.)
export async function sendResetEmail(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim(), {
    url: `${window.location.origin}/reset-password`,
    handleCodeInApp: true,
  });
}

const MESSAGES: Record<string, string> = {
  "auth/invalid-email": "صيغة البريد الإلكتروني غير صحيحة",
  "auth/missing-email": "يرجى إدخال البريد الإلكتروني",
  "auth/too-many-requests": "محاولات كثيرة، حاول لاحقًا",
};

// "auth/user-not-found" is handled at the call site by showing the same
// neutral success message, so it never becomes an account-enumeration oracle.
export function resetEmailErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code || "";
  return MESSAGES[code] || "حدث خطأ غير متوقع، حاول مرة أخرى";
}

// Step 2 of the same flow, run on /reset-password after the user opens the
// emailed link: confirm the code is still valid and return the account
// email so the page can show "تعيين كلمة مرور جديدة لـ <email>".
export async function verifyResetCode(oobCode: string): Promise<string> {
  return verifyPasswordResetCode(auth, oobCode);
}

export async function completePasswordReset(
  oobCode: string,
  newPassword: string
): Promise<void> {
  await confirmPasswordReset(auth, oobCode, newPassword);
}

const CONFIRM_MESSAGES: Record<string, string> = {
  "auth/expired-action-code": "انتهت صلاحية رابط إعادة التعيين، يرجى طلب رابط جديد",
  "auth/invalid-action-code": "الرابط غير صالح أو استُخدم من قبل، يرجى طلب رابط جديد",
  "auth/user-disabled": "تم إيقاف هذا الحساب",
  "auth/user-not-found": "لا يوجد حساب مرتبط بهذا الرابط",
  "auth/weak-password": "كلمة المرور ضعيفة، يجب ألا تقل عن 6 أحرف",
};

export function resetConfirmErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code || "";
  return CONFIRM_MESSAGES[code] || "حدث خطأ غير متوقع، حاول مرة أخرى";
}
