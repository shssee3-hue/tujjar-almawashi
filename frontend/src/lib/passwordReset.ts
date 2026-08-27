import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  signOut,
} from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "./firebase";

export async function startPhoneReset(
  phone: string
): Promise<{ resetId: string; expiresAt: number }> {
  const fn = httpsCallable(functions, "startPhoneReset");
  const res = await fn({ phone });
  return res.data as { resetId: string; expiresAt: number };
}

let recaptchaVerifier: RecaptchaVerifier | null = null;

// Firebase Phone Auth needs a reCAPTCHA bound to a DOM element before it
// will send an SMS — this creates (once) or reuses one attached to
// #recaptcha-container, which every step of the forgot-password page keeps
// mounted for exactly this reason.
function getRecaptcha(): RecaptchaVerifier {
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
    });
  }
  return recaptchaVerifier;
}

// Sends the actual SMS — Google's own infrastructure, no third-party
// account or secret involved. Returns a ConfirmationResult that must be
// kept in memory (component state) until confirmOtp() is called; it can't
// be serialized across a page navigation.
export async function sendPhoneOtp(phone: string): Promise<ConfirmationResult> {
  return signInWithPhoneNumber(auth, phone, getRecaptcha());
}

// Confirms the 6-digit code with Firebase directly (throws
// auth/invalid-verification-code or auth/code-expired on failure), then
// tells our own backend this reset session's phone is now verified. Signs
// the temporary phone-auth session back out immediately after — it's only
// ever a vehicle for proving phone ownership, never a real login.
export async function confirmPhoneOtp(
  confirmationResult: ConfirmationResult,
  otp: string,
  resetId: string
): Promise<void> {
  await confirmationResult.confirm(otp);
  try {
    const fn = httpsCallable(functions, "completePhoneReset");
    await fn({ resetId });
  } finally {
    await signOut(auth);
  }
}

export async function resetPasswordWithOtp(resetId: string, newPassword: string): Promise<void> {
  const fn = httpsCallable(functions, "resetPasswordWithOtp");
  await fn({ resetId, newPassword });
}

const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-verification-code": "الرمز غير صحيح",
  "auth/code-expired": "انتهت صلاحية الرمز، يرجى طلب رمز جديد",
  "auth/invalid-phone-number": "رقم الجوال غير صحيح",
  "auth/too-many-requests": "محاولات كثيرة، حاول لاحقًا",
  "auth/missing-phone-number": "يرجى إدخال رقم الجوال",
};

// Covers both a callable Cloud Function's HttpsError (its message is our
// own Arabic string, thrown server-side verbatim) and a Firebase Auth
// SDK error from the phone sign-in/confirm calls (mapped above by code).
export function passwordResetErrorMessage(error: unknown): string {
  const err = error as { code?: string; message?: string };
  if (err?.code && FIREBASE_ERROR_MESSAGES[err.code]) {
    return FIREBASE_ERROR_MESSAGES[err.code];
  }
  return err?.message || "حدث خطأ غير متوقع، حاول مرة أخرى";
}
