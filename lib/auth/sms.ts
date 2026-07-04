import "server-only";

// Minimal Twilio SMS sender using the REST API directly (no SDK dependency).
// Configured via env; if unset we treat SMS as unavailable and callers fall back to dev mode.
//
//   TWILIO_ACCOUNT_SID           – "AC..." account sid
//   TWILIO_AUTH_TOKEN            – account auth token
//   TWILIO_FROM                 – a Twilio sender number in E.164 ("+1...")
//   TWILIO_MESSAGING_SERVICE_SID – alternative to TWILIO_FROM ("MG..."); takes precedence

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM = process.env.TWILIO_FROM;
const MESSAGING_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID;

/** True when Twilio credentials + a sender (number or messaging service) are configured. */
export function isSmsConfigured(): boolean {
  return Boolean(ACCOUNT_SID && AUTH_TOKEN && (FROM || MESSAGING_SERVICE_SID));
}

/** Send an SMS via Twilio. Throws if not configured or the API rejects the request. */
export async function sendSms(to: string, body: string): Promise<void> {
  if (!isSmsConfigured()) {
    throw new Error("Twilio is not configured (set TWILIO_ACCOUNT_SID/AUTH_TOKEN and a sender).");
  }

  const params = new URLSearchParams({ To: to, Body: body });
  if (MESSAGING_SERVICE_SID) params.set("MessagingServiceSid", MESSAGING_SERVICE_SID);
  else params.set("From", FROM!);

  const auth = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString("base64");
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Twilio send failed (${res.status}): ${detail.slice(0, 300)}`);
  }
}
