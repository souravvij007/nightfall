import { prisma } from "@/lib/db/client";

/** Follow another user (idempotent). No-op on self-follow. */
export async function follow(followerId: string, followingId: string) {
  if (followerId === followingId) return;
  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId, followingId } },
    create: { followerId, followingId },
    update: {},
  });
}

/** Unfollow (idempotent). */
export async function unfollow(followerId: string, followingId: string) {
  await prisma.follow.deleteMany({ where: { followerId, followingId } });
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const edge = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  return edge !== null;
}

export async function followCounts(userId: string) {
  const [followers, following] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);
  return { followers, following };
}

/** IDs the user follows, including themselves — the author set for their feed. */
export async function feedAuthorIds(userId: string): Promise<string[]> {
  const edges = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  return [userId, ...edges.map((e) => e.followingId)];
}
