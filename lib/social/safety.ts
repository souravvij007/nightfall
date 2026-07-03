import { prisma } from "@/lib/db/client";
import type { ReportInput } from "@/lib/validation/social";

/** Block a user: record the edge and sever any follow relationship in both directions. */
export async function block(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) return;
  await prisma.$transaction([
    prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    }),
    prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: blockerId, followingId: blockedId },
          { followerId: blockedId, followingId: blockerId },
        ],
      },
    }),
  ]);
}

export async function unblock(blockerId: string, blockedId: string) {
  await prisma.block.deleteMany({ where: { blockerId, blockedId } });
}

/** True if either user has blocked the other. */
export async function isBlockedEither(a: string, b: string): Promise<boolean> {
  const edge = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: a, blockedId: b },
        { blockerId: b, blockedId: a },
      ],
    },
  });
  return edge !== null;
}

/** All user IDs in a block relationship with the viewer (either direction). */
export async function blockedUserIds(userId: string): Promise<string[]> {
  const edges = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });
  const ids = new Set<string>();
  for (const e of edges) {
    ids.add(e.blockerId === userId ? e.blockedId : e.blockerId);
  }
  return [...ids];
}

/** File a moderation report (lands in the admin queue as PENDING). */
export async function report(reporterId: string, input: ReportInput) {
  await prisma.report.create({
    data: {
      reporterId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      detail: input.detail,
    },
  });
}
