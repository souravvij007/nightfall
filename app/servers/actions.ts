"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { messageSchema } from "@/lib/validation/social";
import { createServerSchema, createChannelSchema } from "@/lib/validation/servers";
import {
  createServer,
  createChannel,
  createInvite,
  joinViaInvite,
} from "@/lib/servers/service";
import { sendChannelMessage } from "@/lib/servers/messages";

export interface ServerFormState {
  error?: string;
}

/** Create a server and jump into its #general channel. */
export async function createServerAction(
  _prev: ServerFormState,
  formData: FormData,
): Promise<ServerFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = createServerSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Could not create server." };

  const server = await createServer(user.id, parsed.data.name);
  revalidatePath("/servers");
  redirect(`/servers/${server.id}`);
}

/** Create a channel in a server (OWNER/ADMIN only). */
export async function createChannelAction(
  _prev: ServerFormState,
  formData: FormData,
): Promise<ServerFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const serverId = String(formData.get("serverId") ?? "");
  const parsed = createChannelSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type") || "TEXT",
  });
  if (!serverId || !parsed.success) {
    return { error: parsed.success ? "Missing server." : parsed.error.issues[0]?.message ?? "Could not create channel." };
  }

  let channelId: string;
  try {
    const channel = await createChannel(user.id, serverId, parsed.data);
    channelId = channel.id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create channel." };
  }
  revalidatePath(`/servers/${serverId}`);
  redirect(`/servers/${serverId}/${channelId}`);
}

/** Post a message to a text channel. */
export async function sendChannelMessageAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const serverId = String(formData.get("serverId") ?? "");
  const channelId = String(formData.get("channelId") ?? "");
  const parsed = messageSchema.safeParse({ body: formData.get("body") });
  if (!channelId || !parsed.success) return;

  await sendChannelMessage(user.id, channelId, parsed.data.body);
  revalidatePath(`/servers/${serverId}/${channelId}`);
}

/** Create an invite code and return it (called from a client component). */
export async function createInviteAction(serverId: string): Promise<{ code?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  try {
    const code = await createInvite(user.id, serverId);
    return { code };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create invite." };
  }
}

/** Redeem an invite and jump into the server. */
export async function joinServerAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const code = String(formData.get("code") ?? "");
  if (!code) redirect("/servers");

  const serverId = await joinViaInvite(user.id, code);
  revalidatePath("/servers");
  redirect(`/servers/${serverId}`);
}
