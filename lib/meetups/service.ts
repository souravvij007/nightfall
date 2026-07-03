import { prisma } from "@/lib/db/client";
import { hasFeature } from "@/lib/gamification/levels";
import type { CreateMeetupInput } from "@/lib/validation/meetups";

const hostSelect = { id: true, handle: true, displayName: true, level: true } as const;

export interface HostContext {
  id: string;
  level: number;
  isStaff: boolean;
}

/**
 * Create a meetup. Staff create Nightfall-official meetups (auto-approved); Level 10+ users
 * submit their own, which land PENDING for admin approval. Below that, hosting is locked.
 */
export async function createMeetup(host: HostContext, input: CreateMeetupInput) {
  const canHostAsUser = hasFeature(host.level, "HOST_MEETUP");
  if (!host.isStaff && !canHostAsUser) {
    throw new Error("Reach Level 10 to host a meetup.");
  }

  const feeCents = Math.round(input.fee * 100);
  return prisma.meetup.create({
    data: {
      hostId: host.id,
      title: input.title,
      description: input.description,
      city: input.city,
      venue: input.venue,
      startsAt: input.startsAt,
      feeCents,
      capacity: input.capacity,
      isOfficial: host.isStaff,
      status: host.isStaff ? "APPROVED" : "PENDING",
      approvedById: host.isStaff ? host.id : null,
      approvedAt: host.isStaff ? new Date() : null,
    },
  });
}

/** Public discovery: approved, upcoming meetups, optionally filtered by city and/or date. */
export async function listApprovedMeetups(filter: { city?: string; date?: string } = {}) {
  const where: Record<string, unknown> = { status: "APPROVED", startsAt: { gte: new Date() } };
  if (filter.city) where.city = { contains: filter.city, mode: "insensitive" };
  if (filter.date) {
    const start = new Date(`${filter.date}T00:00:00`);
    const end = new Date(`${filter.date}T23:59:59.999`);
    if (!Number.isNaN(start.getTime())) where.startsAt = { gte: start, lte: end };
  }

  return prisma.meetup.findMany({
    where,
    orderBy: { startsAt: "asc" },
    include: {
      host: { select: hostSelect },
      _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
    },
  });
}

export async function getMeetup(meetupId: string, viewerId: string) {
  const meetup = await prisma.meetup.findUnique({
    where: { id: meetupId },
    include: {
      host: { select: hostSelect },
      _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
      bookings: { where: { userId: viewerId }, select: { id: true, status: true } },
    },
  });
  if (!meetup) return null;
  const { bookings, ...rest } = meetup;
  return {
    ...rest,
    confirmedCount: meetup._count.bookings,
    spotsLeft: meetup.capacity - meetup._count.bookings,
    myBooking: bookings[0] ?? null,
  };
}

export type BookResult =
  | { ok: true; bookingId: string }
  | { ok: false; reason: "not_bookable" | "own_meetup" | "already_booked" | "sold_out" };

/**
 * Book a spot. Payment is simulated in dev (DEV provider, marked PAID) — swap this block for a
 * real Stripe/Razorpay charge when keys are configured. The 70/30 split is computed once and
 * frozen on the booking so payouts (Phase 5) never recompute it.
 */
export async function bookMeetup(userId: string, meetupId: string): Promise<BookResult> {
  const meetup = await prisma.meetup.findUnique({ where: { id: meetupId } });
  if (!meetup || meetup.status !== "APPROVED" || meetup.startsAt.getTime() <= Date.now()) {
    return { ok: false, reason: "not_bookable" };
  }
  if (meetup.hostId === userId) return { ok: false, reason: "own_meetup" };

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const existing = await tx.booking.findUnique({
        where: { meetupId_userId: { meetupId, userId } },
      });
      if (existing) throw new Error("already_booked");

      const confirmed = await tx.booking.count({ where: { meetupId, status: "CONFIRMED" } });
      if (confirmed >= meetup.capacity) throw new Error("sold_out");

      let paymentId: string | null = null;
      if (meetup.feeCents > 0) {
        // --- DEV payment. Replace with a real gateway charge when configured. ---
        const payment = await tx.payment.create({
          data: {
            userId,
            provider: "DEV",
            providerRef: `dev_${Date.now()}`,
            amountCents: meetup.feeCents,
            currency: meetup.currency,
            kind: "MEETUP_BOOKING",
            status: "PAID",
          },
        });
        paymentId = payment.id;
      }

      const hostShareCents = Math.round((meetup.feeCents * meetup.hostSharePct) / 100);
      const platformShareCents = meetup.feeCents - hostShareCents;

      return tx.booking.create({
        data: {
          meetupId,
          userId,
          amountCents: meetup.feeCents,
          hostShareCents,
          platformShareCents,
          paymentId,
        },
      });
    });
    return { ok: true, bookingId: booking.id };
  } catch (e) {
    const reason = e instanceof Error ? e.message : "";
    if (reason === "already_booked") return { ok: false, reason: "already_booked" };
    if (reason === "sold_out") return { ok: false, reason: "sold_out" };
    throw e;
  }
}

// ── Admin approval ──

export async function listPendingMeetups() {
  return prisma.meetup.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: { host: { select: hostSelect } },
  });
}

export async function pendingMeetupCount(): Promise<number> {
  return prisma.meetup.count({ where: { status: "PENDING" } });
}

export async function approveMeetup(staffId: string, meetupId: string) {
  await prisma.meetup.updateMany({
    where: { id: meetupId, status: "PENDING" },
    data: { status: "APPROVED", approvedById: staffId, approvedAt: new Date() },
  });
}

export async function rejectMeetup(staffId: string, meetupId: string, reason?: string) {
  await prisma.meetup.updateMany({
    where: { id: meetupId, status: "PENDING" },
    data: { status: "REJECTED", approvedById: staffId, approvedAt: new Date(), rejectionReason: reason },
  });
}
