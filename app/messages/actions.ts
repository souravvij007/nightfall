"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { messageSchema } from "@/lib/validation/social";
import { sendMessage } from "@/lib/social/dm";

export async function sendMessageAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const threadId = String(formData.get("threadId") ?? "");
  const parsed = messageSchema.safeParse({ body: formData.get("body") });
  if (!threadId || !parsed.success) return;

  await sendMessage(user.id, threadId, parsed.data.body);
  revalidatePath(`/messages/${threadId}`);
  revalidatePath("/messages");
}
