import { NextResponse, type NextRequest } from "next/server";
import {
  exchangeCodeForProfile,
  isOAuthProvider,
  isProviderConfigured,
  oauthCallbackUrl,
} from "@/lib/auth/oauth";
import { loginWithOAuth } from "@/lib/auth/account";
import { consumeOAuthState, createSession } from "@/lib/auth/session";

// GET /api/auth/:provider/callback — the provider redirects here with ?code & ?state.
// Verify state, exchange the code for a profile, sign the user in, and land on /me.
export async function GET(req: NextRequest, ctx: RouteContext<"/api/auth/[provider]/callback">) {
  const { provider } = await ctx.params;
  const url = new URL(req.url);
  const loginError = (reason: string) =>
    NextResponse.redirect(new URL(`/login?error=${reason}`, req.url));

  if (!isOAuthProvider(provider) || !isProviderConfigured(provider)) {
    return loginError("provider_unavailable");
  }

  // The user denied consent, or the provider returned an error.
  if (url.searchParams.get("error")) return loginError("oauth_cancelled");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code) return loginError("oauth_cancelled");

  // CSRF: the state must match the cookie we set at /start.
  if (!(await consumeOAuthState(state))) return loginError("oauth_state");

  try {
    const profile = await exchangeCodeForProfile(provider, {
      code,
      redirectUri: oauthCallbackUrl(req, provider),
    });
    const { user } = await loginWithOAuth(provider, profile);
    await createSession(user.id, { userAgent: req.headers.get("user-agent") ?? undefined });
  } catch (err) {
    console.error(`[oauth:${provider}]`, err);
    return loginError("oauth_failed");
  }

  return NextResponse.redirect(new URL("/me", req.url));
}
