import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./firebase";

// Free-plan password reset: Firebase sends the email and hosts the
// "set a new password" page itself — no Cloud Functions, no phone/SMS, no
// Blaze plan. (The old phone/OTP flow needed the Admin SDK to set a password
// for a signed-out user; that lives in functions/ and is not deployed.)
export async function sendResetEmail(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
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
