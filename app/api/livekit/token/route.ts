import { AccessToken } from "livekit-server-sdk";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

export const runtime = "nodejs";

/**
 * Mints a LiveKit access token for a room the caller is a participant of. Publish rights follow
 * the participant's role (host/speaker can speak; listeners subscribe only).
 *
 * Returns 501 with `configured: false` until LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET
 * are set in the environment — so the whole room flow works today and A/V lights up the moment
 * you add keys, with no code changes.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env;
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    return Response.json(
      {
        configured: false,
        error: "LiveKit is not configured.",
        hint: "Add LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET to .env to enable audio/video.",
      },
      { status: 501 },
    );
  }

  const { roomId } = await request.json();
  const participant = await prisma.roomParticipant.findUnique({
    where: { roomId_userId: { roomId, userId: user.id } },
  });
  if (!participant || participant.leftAt) {
    return new Response("Not a participant of this room", { status: 403 });
  }

  const canPublish = participant.role === "HOST" || participant.role === "SPEAKER";
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: user.id,
    name: user.displayName,
  });
  at.addGrant({ roomJoin: true, room: roomId, canPublish, canSubscribe: true });

  return Response.json({ configured: true, url: LIVEKIT_URL, token: await at.toJwt() });
}
