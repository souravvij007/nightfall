import { NextResponse, type NextRequest } from "next/server";
import { randomToken } from "@/lib/auth/crypto";
import {
  getAuthorizeUrl,
  isOAuthProvider,
  isProviderConfigured,
  oauthCallbackUrl,
} from "@/lib/auth/oauth";
import { setOAuthState } from "@/lib/auth/session";

// GET /api/auth/:provider/start — begin the OAuth flow: set a CSRF state cookie and
// redirect the user to the provider's consent screen.
export async function GET(req: NextRequest, ctx: RouteContext<"/api/auth/[provider]/start">) {
  const { provider } = await ctx.params;

  if (!isOAuthProvider(provider) || !isProviderConfigured(provider)) {
    return NextResponse.redirect(new URL("/login?error=provider_unavailable", req.url));
  }

  const state = randomToken(16);
  await setOAuthState(state);

  const url = getAuthorizeUrl(provider, { state, redirectUri: oauthCallbackUrl(req, provider) });
  return NextResponse.redirect(url);
}
