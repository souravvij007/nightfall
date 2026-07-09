import { prisma } from "@/lib/db/client";
import { blockedUserIds } from "@/lib/social/safety";

const userSelect = {
  id: true,
  handle: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  level: true,
  rank: true,
} as const;

const hostSelect = { id: true, handle: true, displayName: true } as const;

export interface SearchResults {
  query: string;
  users: Awaited<ReturnType<typeof searchUsers>>;
  meetups: Awaited<ReturnType<typeof searchMeetups>>;
  trips: Awaited<ReturnType<typeof searchTrips>>;
}

/** Users matching handle or display name (excludes self + blocked, either direction). */
export async function searchUsers(viewerId: string, q: string, take = 10) {
  const blocked = await blockedUserIds(viewerId);
  return prisma.user.findMany({
    where: {
      id: { notIn: [viewerId, ...blocked] },
      status: "ACTIVE",
      OR: [
        { handle: { contains: q, mode: "insensitive" } },
        { displayName: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: [{ level: "desc" }, { pointsBalance: "desc" }],
    take,
    select: userSelect,
  });
}

/** Approved, upcoming meetups matching title, city, or venue. */
export async function searchMeetups(q: string, take = 10) {
  return prisma.meetup.findMany({
    where: {
      status: "APPROVED",
      startsAt: { gte: new Date() },
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { venue: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { startsAt: "asc" },
    take,
    include: {
      host: { select: hostSelect },
      _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
    },
  });
}

/** Approved trips matching title or destination. */
export async function searchTrips(q: string, take = 10) {
  return prisma.trip.findMany({
    where: {
      status: "APPROVED",
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { destination: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { startsAt: "asc" },
    take,
    include: {
      host: { select: hostSelect },
      _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
    },
  });
}

/** Unified search across people, meetups, and trips. Empty query → empty results. */
export async function searchAll(viewerId: string, rawQuery: string): Promise<SearchResults> {
  const query = rawQuery.trim();
  if (query.length === 0) {
    return { query, users: [], meetups: [], trips: [] };
  }
  const [users, meetups, trips] = await Promise.all([
    searchUsers(viewerId, query),
    searchMeetups(query),
    searchTrips(query),
  ]);
  return { query, users, meetups, trips };
}
