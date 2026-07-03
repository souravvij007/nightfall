import { prisma } from "@/lib/db/client";

export interface Earnings {
  grossCents: number;
  hostShareCents: number;
  platformShareCents: number;
  bookingIds: string[];
  tripBookingIds: string[];
}

/**
 * A host's unpaid earnings: the frozen host-shares of their CONFIRMED meetup + trip bookings that
 * haven't been rolled into a payout yet. Nothing is recomputed — splits were frozen at booking.
 */
export async function hostUnpaidEarnings(hostId: string): Promise<Earnings> {
  const [meetupBookings, tripBookings] = await Promise.all([
    prisma.booking.findMany({
      where: { status: "CONFIRMED", payoutId: null, meetup: { hostId } },
      select: { id: true, amountCents: true, hostShareCents: true, platformShareCents: true },
    }),
    prisma.tripBooking.findMany({
      where: { status: "CONFIRMED", payoutId: null, trip: { hostId } },
      select: { id: true, amountCents: true, hostShareCents: true, platformShareCents: true },
    }),
  ]);
  const all = [...meetupBookings, ...tripBookings];
  return {
    grossCents: all.reduce((s, b) => s + b.amountCents, 0),
    hostShareCents: all.reduce((s, b) => s + b.hostShareCents, 0),
    platformShareCents: all.reduce((s, b) => s + b.platformShareCents, 0),
    bookingIds: meetupBookings.map((b) => b.id),
    tripBookingIds: tripBookings.map((b) => b.id),
  };
}

/** Hosts who currently have unpaid earnings, for the finance dashboard. */
export async function hostsWithUnpaidEarnings() {
  const [meetupHosts, tripHosts] = await Promise.all([
    prisma.booking.findMany({
      where: { status: "CONFIRMED", payoutId: null },
      select: { meetup: { select: { hostId: true } } },
    }),
    prisma.tripBooking.findMany({
      where: { status: "CONFIRMED", payoutId: null },
      select: { trip: { select: { hostId: true } } },
    }),
  ]);
  const hostIds = new Set<string>([
    ...meetupHosts.map((b) => b.meetup.hostId),
    ...tripHosts.map((b) => b.trip.hostId),
  ]);

  const rows = await Promise.all(
    [...hostIds].map(async (hostId) => {
      const host = await prisma.user.findUnique({
        where: { id: hostId },
        select: { id: true, handle: true, displayName: true },
      });
      const earnings = await hostUnpaidEarnings(hostId);
      return { host: host!, earnings };
    }),
  );
  return rows.filter((r) => r.earnings.hostShareCents > 0);
}

/** Create a PENDING payout batch covering all of a host's current unpaid earnings. */
export async function createPayout(hostId: string): Promise<string | null> {
  const earnings = await hostUnpaidEarnings(hostId);
  if (earnings.hostShareCents <= 0) return null;

  return prisma.$transaction(async (tx) => {
    const payout = await tx.payout.create({
      data: {
        hostId,
        grossCents: earnings.grossCents,
        platformCutCents: earnings.platformShareCents,
        netCents: earnings.hostShareCents,
      },
    });
    if (earnings.bookingIds.length) {
      await tx.booking.updateMany({ where: { id: { in: earnings.bookingIds } }, data: { payoutId: payout.id } });
    }
    if (earnings.tripBookingIds.length) {
      await tx.tripBooking.updateMany({ where: { id: { in: earnings.tripBookingIds } }, data: { payoutId: payout.id } });
    }
    return payout.id;
  });
}

export async function listPayouts() {
  return prisma.payout.findMany({
    orderBy: { createdAt: "desc" },
    include: { host: { select: { handle: true, displayName: true } } },
  });
}

/** Human-gated release: mark a pending payout PAID (in production this triggers the real transfer). */
export async function approvePayout(staffId: string, payoutId: string) {
  await prisma.payout.updateMany({
    where: { id: payoutId, status: "PENDING" },
    data: { status: "PAID", approvedById: staffId, approvedAt: new Date(), paidAt: new Date() },
  });
}

export async function hostPayouts(hostId: string) {
  return prisma.payout.findMany({ where: { hostId }, orderBy: { createdAt: "desc" } });
}
