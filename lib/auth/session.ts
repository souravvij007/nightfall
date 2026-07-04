import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { hmac, randomToken, safeEqualHex } from "./crypto";
import type { User } from "@/lib/generated/prisma/client";

const SESSION_COOKIE = "nf_session";
const PENDING_COOKIE = "nf_pending_phone";
const OAUTH_STATE_COOKIE = "nf_oauth_state";
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const PENDING_TTL_MS = 10 * 60 * 1000; // 10 minutes

const baseCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

/** Create a DB-backed session for a user and set the session cookie. */
export async function createSession(userId: string, meta?: { userAgent?: string; ip?: string }) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.create({
    data: { userId, tokenHash: hmac(token), expiresAt, userAgent: meta?.userAgent, ip: meta?.ip },
  });
  (await cookies()).set(SESSION_COOKIE, token, { ...baseCookie, expires: expiresAt });
}

/** Resolve the signed-in user from the session cookie, or null. */
export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hmac(token) },
    include: { user: true },
  });
  if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) return null;
  if (session.user.status !== "ACTIVE") return null;
  return session.user;
}

/** Revoke the current session and clear the cookie. */
export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.updateMany({
      where: { tokenHash: hmac(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  store.delete(SESSION_COOKIE);
}

// ── Pending-phone cookie: bridges OTP verification → profile creation for new users. ──
// Value is `phone.hmac(phone)` so it can't be forged client-side.

export async function setPendingPhone(phone: string) {
  const value = `${phone}.${hmac(phone)}`;
  (await cookies()).set(PENDING_COOKIE, value, {
    ...baseCookie,
    expires: new Date(Date.now() + PENDING_TTL_MS),
  });
}

export async function getPendingPhone(): Promise<string | null> {
  const raw = (await cookies()).get(PENDING_COOKIE)?.value;
  if (!raw) return null;
  const idx = raw.lastIndexOf(".");
  if (idx < 0) return null;
  const phone = raw.slice(0, idx);
  const sig = raw.slice(idx + 1);
  return safeEqualHex(sig, hmac(phone)) ? phone : null;
}

export async function clearPendingPhone() {
  (await cookies()).delete(PENDING_COOKIE);
}

// ── OAuth CSRF state: a random value round-tripped through the provider and checked on callback. ──

export async function setOAuthState(state: string) {
  (await cookies()).set(OAUTH_STATE_COOKIE, state, {
    ...baseCookie,
    expires: new Date(Date.now() + OAUTH_STATE_TTL_MS),
  });
}

/** Returns true if the callback's state matches the stored cookie (constant-time), then clears it. */
export async function consumeOAuthState(state: string | null): Promise<boolean> {
  const store = await cookies();
  const stored = store.get(OAUTH_STATE_COOKIE)?.value ?? null;
  store.delete(OAUTH_STATE_COOKIE);
  if (!stored || !state) return false;
  return safeEqualHex(hmac(stored), hmac(state));
}
