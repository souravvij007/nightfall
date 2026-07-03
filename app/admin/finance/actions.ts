"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/admin";
import { createPayout, approvePayout } from "@/lib/payouts/service";

export async function createPayoutAction(formData: FormData) {
  await requireStaff();
  const hostId = String(formData.get("hostId") ?? "");
  if (hostId) await createPayout(hostId);
  revalidatePath("/admin/finance");
}

export async function approvePayoutAction(formData: FormData) {
  const staff = await requireStaff();
  const payoutId = String(formData.get("payoutId") ?? "");
  if (payoutId) await approvePayout(staff.id, payoutId);
  revalidatePath("/admin/finance");
}
