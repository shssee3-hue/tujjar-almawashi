/**
 * Adapter for Authentica (https://authentica.sa) — a Saudi OTP-as-a-service
 * platform: unlike a generic SMS API (Unifonic, Twilio, ...), Authentica
 * generates AND verifies the code itself, so this project never generates
 * or stores the raw 6-digit code — only the send/verify round trip.
 *
 * IMPORTANT: no Authentica account existed to test against while writing
 * this, so the endpoint paths, header name, and request/response field
 * names below are a best-effort default based on their published
 * "OTP-as-a-service" model — NOT verified live. Once you have an account,
 * check its API reference (usually under a "Developers" / "API Keys"
 * section of the dashboard) and adjust AUTHENTICA_BASE_URL / the field
 * names in sendOtp()/verifyOtp() to match exactly before relying on this
 * in production. The rest of index.ts doesn't need to change either way —
 * it only calls these two functions.
 */

const AUTHENTICA_BASE_URL = "https://api.authentica.sa/api/v1";

export class AuthenticaError extends Error {
  constructor(
    message: string,
    public readonly kind: "invalid" | "expired" | "other" = "other"
  ) {
    super(message);
  }
}

async function authenticaFetch(path: string, apiKey: string, body: Record<string, unknown>) {
  const res = await fetch(`${AUTHENTICA_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Authorization": apiKey,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data: data as Record<string, unknown> };
}

/** Sends a 6-digit OTP to `phone` via Authentica. Throws on failure. */
export async function sendOtp(apiKey: string, phone: string): Promise<void> {
  const { ok, status, data } = await authenticaFetch("/send-otp", apiKey, {
    phone,
    method: "sms",
  });
  if (!ok) {
    throw new AuthenticaError(
      `تعذر إرسال رمز التحقق (${status}): ${JSON.stringify(data)}`
    );
  }
}

/** Verifies `otp` for `phone` against Authentica. Throws AuthenticaError on rejection. */
export async function verifyOtp(apiKey: string, phone: string, otp: string): Promise<void> {
  const { ok, status, data } = await authenticaFetch("/verify-otp", apiKey, {
    phone,
    otp,
  });
  if (ok) return;

  const message = String(data?.message || "").toLowerCase();
  if (status === 410 || message.includes("expir")) {
    throw new AuthenticaError("انتهت صلاحية الرمز، يرجى طلب رمز جديد", "expired");
  }
  throw new AuthenticaError("الرمز غير صحيح", "invalid");
}
