"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/admin";
import { createMeetupSchema } from "@/lib/validation/meetups";
import { createMeetup, bookMeetup } from "@/lib/meetups/service";

export interface MeetupFormState {
  error?: string;
}

export async function createMeetupAction(
  _prev: MeetupFormState,
  formData: FormData,
): Promise<MeetupFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = createMeetupSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    city: formData.get("city"),
    venue: (formData.get("venue") as string) || undefined,
    startsAt: formData.get("startsAt"),
    fee: formData.get("fee"),
    capacity: formData.get("capacity"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details." };

  let meetupId: string;
  try {
    const meetup = await createMeetup(
      { id: user.id, level: user.level, isStaff: isStaff(user) },
      parsed.data,
    );
    meetupId = meetup.id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create meetup." };
  }
  redirect(`/meetups/${meetupId}`);
}

const BOOK_ERRORS: Record<string, string> = {
  not_bookable: "This meetup can no longer be booked.",
  own_meetup: "You can't book your own meetup.",
  already_booked: "You've already booked this meetup.",
  sold_out: "This meetup is sold out.",
};

export async function bookMeetupAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const meetupId = String(formData.get("meetupId") ?? "");
  if (!meetupId) return;

  const result = await bookMeetup(user.id, meetupId);
  const params = result.ok ? "booked=1" : `error=${encodeURIComponent(BOOK_ERRORS[result.reason])}`;
  redirect(`/meetups/${meetupId}?${params}`);
}
