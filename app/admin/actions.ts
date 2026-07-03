"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/admin";
import {
  dismissReport,
  removeReportedPost,
  suspendReportedUser,
} from "@/lib/moderation/service";

export async function dismissReportAction(formData: FormData) {
  const staff = await requireStaff();
  const reportId = String(formData.get("reportId") ?? "");
  if (reportId) await dismissReport(staff.id, reportId);
  revalidatePath("/admin/moderation");
}

export async function removePostAction(formData: FormData) {
  const staff = await requireStaff();
  const reportId = String(formData.get("reportId") ?? "");
  if (reportId) await removeReportedPost(staff.id, reportId);
  revalidatePath("/admin/moderation");
  revalidatePath("/feed");
}

export async function suspendUserAction(formData: FormData) {
  const staff = await requireStaff();
  const reportId = String(formData.get("reportId") ?? "");
  if (reportId) await suspendReportedUser(staff.id, reportId);
  revalidatePath("/admin/moderation");
}
