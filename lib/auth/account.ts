import "server-only";
import { prisma } from "@/lib/db/client";
import type { OAuthProfile, OAuthProvider } from "./oauth";
import type { User } from "@/lib/generated/prisma/client";

/** Derive a valid @handle base (see handleSchema: [a-z][a-z0-9_]{2,19}) from a name/email. */
function baseHandle(profile: OAuthProfile): string {
  const seed = profile.name || profile.email?.split("@")[0] || "user";
  let h = seed
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .replace(/^[^a-z]+/, ""); // must start with a letter
  if (h.length < 3) h = `user${h}`;
  return h.slice(0, 15); // leave room for a uniqueness suffix
}

/** Pick a handle not already taken, appending a numeric suffix if needed. */
async function uniqueHandle(profile: OAuthProfile): Promise<string> {
  const base = baseHandle(profile);
  for (let attempt = 0; attempt < 12; attempt++) {
    const candidate = attempt === 0 ? base : `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    const taken = await prisma.user.findUnique({ where: { handle: candidate } });
    if (!taken) return candidate;
  }
  // Extremely unlikely fallback.
  return `user${Date.now().toString(36)}`.slice(0, 20);
}

export interface OAuthLoginResult {
  user: User;
  isNew: boolean;
}

/**
 * Resolve (or create) the Nightfall user behind an OAuth profile:
 *   1. Already-linked account → that user.
 *   2. Same email as an existing user → link this provider to them.
 *   3. Otherwise → create a fresh user with a generated handle.
 */
export async function loginWithOAuth(
  provider: OAuthProvider,
  profile: OAuthProfile,
): Promise<OAuthLoginResult> {
  // 1. Existing link.
  const linked = await prisma.oAuthAccount.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId: profile.providerAccountId } },
    include: { user: true },
  });
  if (linked) return { user: linked.user, isNew: false };

  // 2. Match by verified email → link to the existing account.
  if (profile.email) {
    const byEmail = await prisma.user.findUnique({ where: { email: profile.email } });
    if (byEmail) {
      await prisma.oAuthAccount.create({
        data: { userId: byEmail.id, provider, providerAccountId: profile.providerAccountId },
      });
      return { user: byEmail, isNew: false };
    }
  }

  // 3. Brand-new user.
  const handle = await uniqueHandle(profile);
  const user = await prisma.user.create({
    data: {
      handle,
      displayName: profile.name?.slice(0, 50) || handle,
      email: profile.email ?? undefined,
      avatarUrl: profile.avatarUrl ?? undefined,
      oauthAccounts: {
        create: { provider, providerAccountId: profile.providerAccountId },
      },
    },
  });
  return { user, isNew: true };
}
