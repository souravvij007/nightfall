import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

const secret = process.env.AUTH_SECRET ?? "";
if (!secret) {
  // Fail loudly at import time in any real run — signing with an empty secret is unsafe.
  console.warn("[auth] AUTH_SECRET is not set; sessions and OTPs will be insecure.");
}

/** Deterministic keyed hash — used to store OTP codes and session tokens (never the raw value). */
export function hmac(value: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

/** Constant-time comparison of two hex digests. */
export function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** Cryptographically-random opaque token (session id material). */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

/** Random N-digit numeric OTP code, zero-padded. */
export function randomNumericCode(digits = 6): string {
  const max = 10 ** digits;
  return randomInt(0, max).toString().padStart(digits, "0");
}
