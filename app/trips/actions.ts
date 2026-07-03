"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/admin";
import {
  createTripScalarSchema,
  parseItinerary,
  parseAccommodations,
  parseVendors,
} from "@/lib/validation/trips";
import { createTrip, bookTrip } from "@/lib/trips/service";

export interface TripFormState {
  error?: string;
}

export async function createTripAction(
  _prev: TripFormState,
  formData: FormData,
): Promise<TripFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = createTripScalarSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    destination: formData.get("destination"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    price: formData.get("price"),
    capacity: formData.get("capacity"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details." };

  let tripId: string;
  try {
    const trip = await createTrip(
      { id: user.id, level: user.level, isStaff: isStaff(user) },
      {
        ...parsed.data,
        itinerary: parseItinerary((formData.get("itinerary") as string) ?? ""),
        accommodations: parseAccommodations((formData.get("accommodations") as string) ?? ""),
        vendors: parseVendors((formData.get("vendors") as string) ?? ""),
      },
    );
    tripId = trip.id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create trip." };
  }
  redirect(`/trips/${tripId}`);
}

const BOOK_ERRORS: Record<string, string> = {
  not_bookable: "This trip can no longer be booked.",
  own_trip: "You can't book your own trip.",
  already_booked: "You've already booked this trip.",
  sold_out: "This trip is sold out.",
};

export async function bookTripAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const tripId = String(formData.get("tripId") ?? "");
  if (!tripId) return;

  const result = await bookTrip(user.id, tripId);
  const params = result.ok ? "booked=1" : `error=${encodeURIComponent(BOOK_ERRORS[result.reason])}`;
  redirect(`/trips/${tripId}?${params}`);
}
