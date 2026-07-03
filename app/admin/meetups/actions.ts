"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/admin";
import { approveMeetup, rejectMeetup } from "@/lib/meetups/service";

export async function approveMeetupAction(formData: FormData) {
  const staff = await requireStaff();
  const meetupId = String(formData.get("meetupId") ?? "");
  if (meetupId) await approveMeetup(staff.id, meetupId);
  revalidatePath("/admin/meetups");
  revalidatePath("/meetups");
}

export async function rejectMeetupAction(formData: FormData) {
  const staff = await requireStaff();
  const meetupId = String(formData.get("meetupId") ?? "");
  const reason = (formData.get("reason") as string) || undefined;
  if (meetupId) await rejectMeetup(staff.id, meetupId, reason);
  revalidatePath("/admin/meetups");
}
