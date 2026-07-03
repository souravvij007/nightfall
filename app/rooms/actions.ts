"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { createRoomSchema } from "@/lib/validation/rooms";
import { PointReason } from "@/lib/generated/prisma/enums";
import { createRoom, joinRoom, leaveRoom, endRoom, awardInRoom } from "@/lib/rooms/service";

export interface CreateRoomState {
  error?: string;
}

export async function createRoomAction(
  _prev: CreateRoomState,
  formData: FormData,
): Promise<CreateRoomState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = createRoomSchema.safeParse({
    title: formData.get("title"),
    description: (formData.get("description") as string) || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  let roomId: string;
  try {
    const room = await createRoom(user, parsed.data);
    roomId = room.id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create room." };
  }
  redirect(`/rooms/${roomId}`);
}

export async function joinRoomAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const roomId = String(formData.get("roomId") ?? "");
  if (roomId) await joinRoom(user.id, roomId);
  revalidatePath(`/rooms/${roomId}`);
}

export async function leaveRoomAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const roomId = String(formData.get("roomId") ?? "");
  if (roomId) await leaveRoom(user.id, roomId);
  redirect("/rooms");
}

export async function endRoomAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const roomId = String(formData.get("roomId") ?? "");
  if (roomId) await endRoom(user.id, roomId);
  revalidatePath(`/rooms/${roomId}`);
}

export async function awardRoomAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const roomId = String(formData.get("roomId") ?? "");
  const targetUserId = String(formData.get("targetUserId") ?? "");
  const reason = String(formData.get("reason") ?? "") as PointReason;
  const allowed: PointReason[] = ["ROOM_GAME_WIN", "ROOM_TASK_COMPLETE"];
  if (roomId && targetUserId && allowed.includes(reason)) {
    await awardInRoom(user.id, roomId, targetUserId, reason);
  }
  revalidatePath(`/rooms/${roomId}`);
}
