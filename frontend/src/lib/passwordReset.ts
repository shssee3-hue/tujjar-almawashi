import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

export async function requestPasswordResetOtp(
  phone: string
): Promise<{ resetId: string; expiresAt: number }> {
  const fn = httpsCallable(functions, "requestPasswordResetOtp");
  const res = await fn({ phone });
  return res.data as { resetId: string; expiresAt: number };
}

export async function verifyPasswordResetOtp(resetId: string, otp: string): Promise<void> {
  const fn = httpsCallable(functions, "verifyPasswordResetOtp");
  await fn({ resetId, otp });
}

export async function resetPasswordWithOtp(resetId: string, newPassword: string): Promise<void> {
  const fn = httpsCallable(functions, "resetPasswordWithOtp");
  await fn({ resetId, newPassword });
}

// A callable function's HttpsError carries the exact Arabic message we threw
// server-side straight through to err.message on the client — this just
// covers the genuinely-unexpected case (network drop, etc).
export function passwordResetErrorMessage(error: unknown): string {
  const err = error as { message?: string };
  return err?.message || "حدث خطأ غير متوقع، حاول مرة أخرى";
}
