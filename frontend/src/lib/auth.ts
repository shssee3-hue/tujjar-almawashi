import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail,
  applyActionCode,
} from "firebase/auth";
import { auth } from "./firebase";
import { createUserProfile } from "./users";
import { AccountType } from "./types";

export async function registerUser(params: {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  accountType: AccountType;
}) {
  const cred = await createUserWithEmailAndPassword(auth, params.email, params.password);
  await updateProfile(cred.user, { displayName: params.name });
  await createUserProfile(cred.user.uid, {
    name: params.name,
    email: params.email,
    phoneNumber: params.phoneNumber,
    accountType: params.accountType,
  });
  return cred.user;
}

export async function loginUser(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

// Confirms the signed-in user's identity by re-checking their current
// password — required by Firebase before any sensitive account change
// (email swap) and whenever the session is older than a few minutes.
export async function reauthenticate(currentPassword: string) {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("no-session");
  const cred = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, cred);
}

// Starts a login-email change: after re-auth, Firebase emails a verification
// link to the NEW address, and the login email only actually changes once
// that link is opened. The users/{uid}.email copy is reconciled from
// firebaseUser.email on the next profile load, not here.
//
// handleCodeInApp points the link at our own /verify-email page instead of
// Firebase's default firebaseapp.com-hosted handler, so this flow — like
// password reset — has no dependency on Firebase Hosting.
export async function changeLoginEmail(newEmail: string, currentPassword: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("no-session");
  await reauthenticate(currentPassword);
  await verifyBeforeUpdateEmail(user, newEmail.trim(), {
    url: `${window.location.origin}/verify-email`,
    handleCodeInApp: true,
  });
}

export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code || "";
  const map: Record<string, string> = {
    "auth/email-already-in-use": "هذا البريد مسجّل مسبقًا",
    "auth/invalid-email": "صيغة البريد الإلكتروني غير صحيحة",
    "auth/weak-password": "كلمة المرور ضعيفة، يجب ألا تقل عن 6 أحرف",
    "auth/user-not-found": "لا يوجد حساب بهذا البريد الإلكتروني",
    "auth/wrong-password": "كلمة المرور غير صحيحة",
    "auth/invalid-credential": "كلمة المرور الحالية غير صحيحة",
    "auth/requires-recent-login": "يرجى إدخال كلمة المرور الحالية لتأكيد هويتك",
    "auth/operation-not-allowed": "تغيير البريد غير مُفعّل حاليًا، تواصل مع الدعم",
    "auth/too-many-requests": "محاولات كثيرة، حاول لاحقًا",
  };
  return map[code] || "حدث خطأ غير متوقع، حاول مرة أخرى";
}

// Step 2 of changeLoginEmail, run on /verify-email after the user opens the
// link emailed to their new address — completes the pending email change.
export async function completeEmailVerification(oobCode: string): Promise<void> {
  await applyActionCode(auth, oobCode);
}

const VERIFY_MESSAGES: Record<string, string> = {
  "auth/expired-action-code": "انتهت صلاحية الرابط، يرجى طلب تغيير البريد من جديد",
  "auth/invalid-action-code": "الرابط غير صالح أو استُخدم من قبل",
  "auth/user-disabled": "تم إيقاف هذا الحساب",
  "auth/user-not-found": "لا يوجد حساب مرتبط بهذا الرابط",
};

export function verifyEmailErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code || "";
  return VERIFY_MESSAGES[code] || "حدث خطأ غير متوقع، حاول مرة أخرى";
}
