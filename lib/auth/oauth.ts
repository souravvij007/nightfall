import "server-only";

// Provider-agnostic OAuth 2.0 (authorization-code) helpers for Google and Discord.
// We never persist third-party access tokens — we exchange the code, read the profile once,
// and discard the token. Configured entirely via env; unconfigured providers are hidden in the UI.

export type OAuthProvider = "google" | "discord";

interface ProviderConfig {
  clientId?: string;
  clientSecret?: string;
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
}

const PROVIDERS: Record<OAuthProvider, ProviderConfig> = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    scope: "openid email profile",
  },
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    authorizeUrl: "https://discord.com/oauth2/authorize",
    tokenUrl: "https://discord.com/api/oauth2/token",
    userInfoUrl: "https://discord.com/api/users/@me",
    scope: "identify email",
  },
};

export function isOAuthProvider(value: string): value is OAuthProvider {
  return value === "google" || value === "discord";
}

/**
 * The exact redirect URI to register with the provider and send on token exchange.
 * Prefers NEXT_PUBLIC_APP_URL (set this to your canonical domain in prod) so it stays
 * stable behind proxies; falls back to the request's own origin.
 */
export function oauthCallbackUrl(req: Request, provider: OAuthProvider): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "") || new URL(req.url).origin;
  return `${base}/api/auth/${provider}/callback`;
}

/** True when both client id and secret are set for the provider. */
export function isProviderConfigured(provider: OAuthProvider): boolean {
  const c = PROVIDERS[provider];
  return Boolean(c.clientId && c.clientSecret);
}

/** Build the provider's authorization URL to redirect the user to. */
export function getAuthorizeUrl(
  provider: OAuthProvider,
  opts: { state: string; redirectUri: string },
): string {
  const c = PROVIDERS[provider];
  const params = new URLSearchParams({
    client_id: c.clientId ?? "",
    redirect_uri: opts.redirectUri,
    response_type: "code",
    scope: c.scope,
    state: opts.state,
  });
  if (provider === "google") {
    // Ensure we always get a fresh consent-scoped grant; no refresh token needed.
    params.set("prompt", "select_account");
  }
  return `${c.authorizeUrl}?${params.toString()}`;
}

/** Normalized profile returned to the login layer. */
export interface OAuthProfile {
  providerAccountId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

/** Exchange an authorization code for the user's profile. Throws on any failure. */
export async function exchangeCodeForProfile(
  provider: OAuthProvider,
  opts: { code: string; redirectUri: string },
): Promise<OAuthProfile> {
  const c = PROVIDERS[provider];

  const tokenRes = await fetch(c.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: opts.code,
      redirect_uri: opts.redirectUri,
      client_id: c.clientId ?? "",
      client_secret: c.clientSecret ?? "",
    }).toString(),
  });
  if (!tokenRes.ok) {
    throw new Error(`${provider} token exchange failed (${tokenRes.status})`);
  }
  const token = (await tokenRes.json()) as { access_token?: string };
  if (!token.access_token) throw new Error(`${provider} returned no access token`);

  const infoRes = await fetch(c.userInfoUrl, {
    headers: { Authorization: `Bearer ${token.access_token}`, Accept: "application/json" },
  });
  if (!infoRes.ok) throw new Error(`${provider} userinfo failed (${infoRes.status})`);
  const info = (await infoRes.json()) as Record<string, unknown>;

  return provider === "google" ? mapGoogle(info) : mapDiscord(info);
}

function mapGoogle(info: Record<string, unknown>): OAuthProfile {
  return {
    providerAccountId: String(info.sub),
    email: typeof info.email === "string" ? info.email : null,
    name: typeof info.name === "string" ? info.name : null,
    avatarUrl: typeof info.picture === "string" ? info.picture : null,
  };
}

function mapDiscord(info: Record<string, unknown>): OAuthProfile {
  const id = String(info.id);
  const avatar = typeof info.avatar === "string" ? info.avatar : null;
  const name =
    (typeof info.global_name === "string" && info.global_name) ||
    (typeof info.username === "string" ? info.username : null);
  return {
    providerAccountId: id,
    email: typeof info.email === "string" ? info.email : null,
    name,
    avatarUrl: avatar ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png` : null,
  };
}
