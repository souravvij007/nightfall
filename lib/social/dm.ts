import { prisma } from "@/lib/db/client";
import { isBlockedEither } from "./safety";

const userSelect = { id: true, handle: true, displayName: true, avatarUrl: true } as const;

/** Canonical ordered pair so a conversation maps to exactly one row. */
function pair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/** Find (or create) the 1:1 thread between two users. Throws if either has blocked the other. */
export async function getOrCreateThread(me: string, other: string): Promise<string> {
  if (me === other) throw new Error("Cannot message yourself");
  if (await isBlockedEither(me, other)) throw new Error("Blocked");

  const [userAId, userBId] = pair(me, other);
  const thread = await prisma.dmThread.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    create: { userAId, userBId },
    update: {},
    select: { id: true },
  });
  return thread.id;
}

/** Threads for the inbox, newest activity first, with the other participant + last message. */
export async function listThreads(userId: string) {
  const threads = await prisma.dmThread.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    orderBy: { lastMessageAt: "desc" },
    include: {
      userA: { select: userSelect },
      userB: { select: userSelect },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  return threads.map((t) => ({
    id: t.id,
    other: t.userAId === userId ? t.userB : t.userA,
    lastMessage: t.messages[0] ?? null,
    lastMessageAt: t.lastMessageAt,
  }));
}

/** A single thread the user participates in, with messages oldest-first. Null if not a participant. */
export async function getThread(userId: string, threadId: string) {
  const thread = await prisma.dmThread.findUnique({
    where: { id: threadId },
    include: {
      userA: { select: userSelect },
      userB: { select: userSelect },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!thread || (thread.userAId !== userId && thread.userBId !== userId)) return null;

  const other = thread.userAId === userId ? thread.userB : thread.userA;
  return { id: thread.id, other, messages: thread.messages };
}

/** Send a message. Verifies participation and that neither party has blocked the other. */
export async function sendMessage(senderId: string, threadId: string, body: string) {
  const thread = await prisma.dmThread.findUnique({ where: { id: threadId } });
  if (!thread || (thread.userAId !== senderId && thread.userBId !== senderId)) {
    throw new Error("Not a participant");
  }
  const otherId = thread.userAId === senderId ? thread.userBId : thread.userAId;
  if (await isBlockedEither(senderId, otherId)) throw new Error("Blocked");

  await prisma.$transaction([
    prisma.message.create({ data: { threadId, senderId, body } }),
    prisma.dmThread.update({ where: { id: threadId }, data: { lastMessageAt: new Date() } }),
  ]);
  // Clients pick up new messages via polling (/api/poll) — see components/realtime/RealtimeRefresh.
}
