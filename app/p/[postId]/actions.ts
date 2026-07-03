"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { createCommentSchema, reportSchema } from "@/lib/validation/social";
import { addComment } from "@/lib/social/engagement";
import { report } from "@/lib/social/safety";

export async function addCommentAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const postId = String(formData.get("postId") ?? "");
  const parsed = createCommentSchema.safeParse({ body: formData.get("body") });
  if (!postId || !parsed.success) return;

  await addComment(user.id, postId, parsed.data.body);
  revalidatePath(`/p/${postId}`);
}

export async function reportContentAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = reportSchema.safeParse({
    targetType: formData.get("targetType"),
    targetId: formData.get("targetId"),
    reason: formData.get("reason"),
    detail: (formData.get("detail") as string) || undefined,
  });
  if (!parsed.success) return;

  await report(user.id, parsed.data);
  revalidatePath(`/p/${String(formData.get("postId") ?? "")}`);
}
