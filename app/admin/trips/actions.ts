"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/admin";
import { vetVendor, approveTrip, rejectTrip } from "@/lib/trips/service";

export async function vetVendorAction(formData: FormData) {
  const staff = await requireStaff();
  const vendorId = String(formData.get("vendorId") ?? "");
  const approve = formData.get("decision") === "approve";
  if (vendorId) await vetVendor(staff.id, vendorId, approve);
  revalidatePath("/admin/trips");
}

export async function approveTripAction(formData: FormData) {
  const staff = await requireStaff();
  const tripId = String(formData.get("tripId") ?? "");
  if (!tripId) return;

  const result = await approveTrip(staff.id, tripId);
  revalidatePath("/admin/trips");
  revalidatePath("/trips");
  if (!result.ok) redirect("/admin/trips?error=Vet+all+vendors+before+approving");
}

export async function rejectTripAction(formData: FormData) {
  const staff = await requireStaff();
  const tripId = String(formData.get("tripId") ?? "");
  const reason = (formData.get("reason") as string) || undefined;
  if (tripId) await rejectTrip(staff.id, tripId, reason);
  revalidatePath("/admin/trips");
}
