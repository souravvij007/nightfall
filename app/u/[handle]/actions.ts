"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { follow, unfollow } from "@/lib/social/graph";
import { block, report } from "@/lib/social/safety";
import { getOrCreateThread } from "@/lib/social/dm";
import { reportSchema } from "@/lib/validation/social";

function revalidateProfile(handle: string) {
  revalidatePath(`/u/${handle}`);
  revalidatePath("/feed");
}

export async function followAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const targetId = String(formData.get("targetId") ?? "");
  const handle = String(formData.get("handle") ?? "");
  if (targetId) await follow(user.id, targetId);
  revalidateProfile(handle);
}

export async function unfollowAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const targetId = String(formData.get("targetId") ?? "");
  const handle = String(formData.get("handle") ?? "");
  if (targetId) await unfollow(user.id, targetId);
  revalidateProfile(handle);
}

export async function blockAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const targetId = String(formData.get("targetId") ?? "");
  const handle = String(formData.get("handle") ?? "");
  if (targetId) await block(user.id, targetId);
  revalidateProfile(handle);
}

export async function startDmAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const targetId = String(formData.get("targetId") ?? "");
  const threadId = await getOrCreateThread(user.id, targetId);
  redirect(`/messages/${threadId}`);
}

export async function reportUserAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const parsed = reportSchema.safeParse({
    targetType: "USER",
    targetId: formData.get("targetId"),
    reason: formData.get("reason"),
  });
  if (parsed.success) await report(user.id, parsed.data);
  revalidateProfile(String(formData.get("handle") ?? ""));
}
