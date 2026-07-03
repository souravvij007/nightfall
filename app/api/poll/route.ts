import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

// Lightweight polling endpoint for serverless-friendly realtime. Returns a cheap `version` string
// that changes whenever the relevant data changes; the client compares it and refreshes the RSC.
// Short-lived request (no long-lived connections) so it works on Vercel serverless.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const topic = searchParams.get("topic");
  const id = searchParams.get("id");

  let version = "0";

  if (topic === "dm" && id) {
    // Scoped to the viewer's participation, so non-participants can't probe a thread.
    const [count, latest] = await Promise.all([
      prisma.message.count({
        where: { threadId: id, thread: { OR: [{ userAId: user.id }, { userBId: user.id }] } },
      }),
      prisma.message.findFirst({
        where: { threadId: id, thread: { OR: [{ userAId: user.id }, { userBId: user.id }] } },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);
    version = `${count}:${latest?.createdAt.getTime() ?? 0}`;
  } else if (topic === "dm") {
    // Inbox: newest activity across the viewer's threads.
    const threads = await prisma.dmThread.findMany({
      where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
      select: { lastMessageAt: true },
    });
    const max = threads.reduce((m, t) => Math.max(m, t.lastMessageAt.getTime()), 0);
    version = `${threads.length}:${max}`;
  } else if (topic === "room" && id) {
    const [room, parts] = await Promise.all([
      prisma.room.findUnique({ where: { id }, select: { status: true } }),
      prisma.roomParticipant.findMany({ where: { roomId: id, leftAt: null }, select: { joinedAt: true } }),
    ]);
    const max = parts.reduce((m, p) => Math.max(m, p.joinedAt.getTime()), 0);
    version = `${room?.status ?? "GONE"}:${parts.length}:${max}`;
  }

  return Response.json({ version });
}
