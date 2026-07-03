"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { createPostSchema } from "@/lib/validation/social";
import { createPost } from "@/lib/social/posts";
import { toggleLike } from "@/lib/social/engagement";

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

export async function toggleLikeAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const postId = String(formData.get("postId") ?? "");
  if (!postId) return;

  await toggleLike(user.id, postId);
  revalidatePath("/feed");
  revalidatePath(`/p/${postId}`);
}
