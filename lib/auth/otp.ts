import { prisma } from "@/lib/db/client";
import { hmac, randomNumericCode, safeEqualHex } from "./crypto";

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;
const DEV_MODE = process.env.OTP_DEV_MODE === "true";

export interface RequestOtpResult {
  /** In dev mode the code is returned so the login UI can display it (no SMS provider needed). */
  devCode?: string;
}

/**
 * Issue an OTP for a phone number. Invalidates any prior un-consumed codes, stores a hash of the
 * new code, and "delivers" it — via SMS in production, or the server console (+ returned) in dev.
 */
export async function requestOtp(phone: string): Promise<RequestOtpResult> {
  const code = randomNumericCode(6);

  // Retire outstanding codes for this phone so only the newest is valid.
  await prisma.phoneOtp.updateMany({
    where: { phone, purpose: "LOGIN", consumedAt: null },
    data: { consumedAt: new Date() },
  });

  await prisma.phoneOtp.create({
    data: {
      phone,
      codeHash: hmac(code),
      purpose: "LOGIN",
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  if (DEV_MODE) {
    console.log(`[auth] OTP for ${phone}: ${code}`);
    return { devCode: code };
  }
  // TODO(phase-1): integrate an SMS provider (e.g. Twilio) to deliver `code`.
  return {};
}

export type VerifyOtpResult =
  | { ok: true }
  | { ok: false; reason: "expired" | "invalid" | "too_many_attempts" };

/** Verify a submitted code against the newest outstanding OTP for the phone. */
export async function verifyOtp(phone: string, code: string): Promise<VerifyOtpResult> {
  const otp = await prisma.phoneOtp.findFirst({
    where: { phone, purpose: "LOGIN", consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || otp.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };
  if (otp.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "too_many_attempts" };

  if (!safeEqualHex(otp.codeHash, hmac(code))) {
    await prisma.phoneOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, reason: "invalid" };
  }

  await prisma.phoneOtp.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });
  return { ok: true };
}
