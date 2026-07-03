import { prisma } from "@/lib/db/client";
import { hasFeature } from "@/lib/gamification/levels";

const hostSelect = { id: true, handle: true, displayName: true, level: true } as const;

export interface HostContext {
  id: string;
  level: number;
  isStaff: boolean;
}

export interface TripInput {
  title: string;
  description: string;
  destination: string;
  startsAt: Date;
  endsAt: Date;
  price: number; // major units
  capacity: number;
  itinerary: { dayNumber: number; title: string; description: string }[];
  accommodations: { name: string; nights: number; details?: string }[];
  vendors: { kind: "HOTEL" | "TRANSPORT" | "ACTIVITY" | "OTHER"; name: string; contact?: string }[];
}

/**
 * Create a trip. Staff create official trips (auto-approved, vendors trusted); Level 20+ users
 * submit their own PENDING, with vendors that admins must vet before the trip can be approved.
 */
export async function createTrip(host: HostContext, input: TripInput) {
  if (!host.isStaff && !hasFeature(host.level, "HOST_TRIP")) {
    throw new Error("Reach Level 20 to host a trip.");
  }
  const vetStatus = host.isStaff ? "APPROVED" : "PENDING";

  return prisma.trip.create({
    data: {
      hostId: host.id,
      title: input.title,
      description: input.description,
      destination: input.destination,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      priceCents: Math.round(input.price * 100),
      capacity: input.capacity,
      isOfficial: host.isStaff,
      status: host.isStaff ? "APPROVED" : "PENDING",
      approvedById: host.isStaff ? host.id : null,
      approvedAt: host.isStaff ? new Date() : null,
      itinerary: { create: input.itinerary },
      accommodations: { create: input.accommodations },
      vendors: {
        create: input.vendors.map((v) => ({
          kind: v.kind,
          name: v.name,
          contact: v.contact,
          vetStatus,
          vettedById: host.isStaff ? host.id : null,
          vettedAt: host.isStaff ? new Date() : null,
        })),
      },
    },
  });
}

export async function listApprovedTrips(filter: { destination?: string } = {}) {
  const where: Record<string, unknown> = { status: "APPROVED", endsAt: { gte: new Date() } };
  if (filter.destination) where.destination = { contains: filter.destination, mode: "insensitive" };
  return prisma.trip.findMany({
    where,
    orderBy: { startsAt: "asc" },
    include: {
      host: { select: hostSelect },
      _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
    },
  });
}

export async function getTrip(tripId: string, viewerId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      host: { select: hostSelect },
      itinerary: { orderBy: { dayNumber: "asc" } },
      accommodations: true,
      vendors: true,
      _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
      bookings: { where: { userId: viewerId }, select: { id: true, status: true } },
    },
  });
  if (!trip) return null;
  const { bookings, ...rest } = trip;
  return {
    ...rest,
    confirmedCount: trip._count.bookings,
    spotsLeft: trip.capacity - trip._count.bookings,
    myBooking: bookings[0] ?? null,
  };
}

export type BookResult =
  | { ok: true; bookingId: string }
  | { ok: false; reason: "not_bookable" | "own_trip" | "already_booked" | "sold_out" };

export async function bookTrip(userId: string, tripId: string): Promise<BookResult> {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip || trip.status !== "APPROVED" || trip.startsAt.getTime() <= Date.now()) {
    return { ok: false, reason: "not_bookable" };
  }
  if (trip.hostId === userId) return { ok: false, reason: "own_trip" };

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const existing = await tx.tripBooking.findUnique({ where: { tripId_userId: { tripId, userId } } });
      if (existing) throw new Error("already_booked");
      const confirmed = await tx.tripBooking.count({ where: { tripId, status: "CONFIRMED" } });
      if (confirmed >= trip.capacity) throw new Error("sold_out");

      let paymentId: string | null = null;
      if (trip.priceCents > 0) {
        // --- DEV payment. Swap for a real gateway when configured. ---
        const payment = await tx.payment.create({
          data: {
            userId,
            provider: "DEV",
            providerRef: `dev_${Date.now()}`,
            amountCents: trip.priceCents,
            currency: trip.currency,
            kind: "TRIP_BOOKING",
            status: "PAID",
          },
        });
        paymentId = payment.id;
      }
      const hostShareCents = Math.round((trip.priceCents * trip.hostSharePct) / 100);
      const platformShareCents = trip.priceCents - hostShareCents;
      return tx.tripBooking.create({
        data: { tripId, userId, amountCents: trip.priceCents, hostShareCents, platformShareCents, paymentId },
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

// ── Admin: approval + vendor vetting ──

export async function listPendingTrips() {
  return prisma.trip.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: { host: { select: hostSelect }, vendors: true },
  });
}

export async function pendingTripCount(): Promise<number> {
  return prisma.trip.count({ where: { status: "PENDING" } });
}

export async function vetVendor(staffId: string, vendorId: string, approve: boolean) {
  await prisma.tripVendor.updateMany({
    where: { id: vendorId },
    data: { vetStatus: approve ? "APPROVED" : "REJECTED", vettedById: staffId, vettedAt: new Date() },
  });
}

export type ApproveTripResult = { ok: true } | { ok: false; reason: "vendors_unvetted" };

/** Approve a trip — only once every vendor has been vetted (approved). */
export async function approveTrip(staffId: string, tripId: string): Promise<ApproveTripResult> {
  const vendors = await prisma.tripVendor.findMany({ where: { tripId } });
  const allApproved = vendors.every((v) => v.vetStatus === "APPROVED");
  if (!allApproved) return { ok: false, reason: "vendors_unvetted" };

  await prisma.trip.updateMany({
    where: { id: tripId, status: "PENDING" },
    data: { status: "APPROVED", approvedById: staffId, approvedAt: new Date() },
  });
  return { ok: true };
}

export async function rejectTrip(staffId: string, tripId: string, reason?: string) {
  await prisma.trip.updateMany({
    where: { id: tripId, status: "PENDING" },
    data: { status: "REJECTED", approvedById: staffId, approvedAt: new Date(), rejectionReason: reason },
  });
}
