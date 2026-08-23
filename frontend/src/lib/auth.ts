import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
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

export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code || "";
  const map: Record<string, string> = {
    "auth/email-already-in-use": "هذا البريد الإلكتروني مستخدم بالفعل",
    "auth/invalid-email": "صيغة البريد الإلكتروني غير صحيحة",
    "auth/weak-password": "كلمة المرور ضعيفة، يجب ألا تقل عن 6 أحرف",
    "auth/user-not-found": "لا يوجد حساب بهذا البريد الإلكتروني",
    "auth/wrong-password": "كلمة المرور غير صحيحة",
    "auth/invalid-credential": "بيانات الدخول غير صحيحة",
    "auth/too-many-requests": "محاولات كثيرة، حاول لاحقًا",
  };
  return map[code] || "حدث خطأ غير متوقع، حاول مرة أخرى";
}
