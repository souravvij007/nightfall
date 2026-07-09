"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { createPostSchema } from "@/lib/validation/social";
import { createPost } from "@/lib/social/posts";
import { toggleLike } from "@/lib/social/engagement";
import { follow } from "@/lib/social/graph";

export interface PostFormState {
  error?: string;
  ok?: boolean;
}

export async function createPostAction(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = createPostSchema.safeParse({
    caption: (formData.get("caption") as string) || undefined,
    mediaUrl: (formData.get("mediaUrl") as string) || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Could not post." };
  }

  await createPost(user.id, {
    ...parsed.data,
    type: parsed.data.mediaUrl ? "PHOTO" : "TEXT",
  });
  revalidatePath("/feed");
  return { ok: true };
}

/** Follow a suggested user from the feed/search suggestions. */
export async function followUserAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const targetId = String(formData.get("targetId") ?? "");
  if (targetId) await follow(user.id, targetId);
  revalidatePath("/feed");
  revalidatePath("/search");
}

export async function toggleLikeAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const postId = String(formData.get("postId") ?? "");
  if (!postId) return;

  await toggleLike(user.id, postId);
  revalidatePath("/feed");
  revalidatePath(`/p/${postId}`);
}
