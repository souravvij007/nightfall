import { prisma } from "@/lib/db/client";
import { blockedUserIds } from "./safety";

const userSelect = {
  id: true,
  handle: true,
  displayName: true,
  avatarUrl: true,
  level: true,
  rank: true,
} as const;

const hostSelect = { id: true, handle: true, displayName: true } as const;

/** People the viewer doesn't follow yet (excludes self + already-followed + blocked), top by level. */
export async function suggestedUsers(viewerId: string, take = 5) {
  const [following, blocked] = await Promise.all([
    prisma.follow.findMany({ where: { followerId: viewerId }, select: { followingId: true } }),
    blockedUserIds(viewerId),
  ]);
  const exclude = new Set<string>([viewerId, ...following.map((f) => f.followingId), ...blocked]);

  return prisma.user.findMany({
    where: { id: { notIn: [...exclude] }, status: "ACTIVE" },
    orderBy: [{ level: "desc" }, { pointsBalance: "desc" }],
    take,
    select: userSelect,
  });
}

/** Upcoming approved meetups to sign up for. */
export async function suggestedMeetups(take = 3) {
  return prisma.meetup.findMany({
    where: { status: "APPROVED", startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    take,
    include: {
      host: { select: hostSelect },
      _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
    },
  });
}
