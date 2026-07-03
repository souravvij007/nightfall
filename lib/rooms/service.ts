import { prisma } from "@/lib/db/client";
import { hasFeature } from "@/lib/gamification/levels";
import { awardPoints } from "@/lib/gamification/award";
import { PointReason } from "@/lib/generated/prisma/enums";

const userSelect = { id: true, handle: true, displayName: true, level: true, rank: true } as const;

// Presence/awards are reflected to clients via polling (/api/poll) — see RealtimeRefresh.

/** Create a user-hosted room. Requires the host to have unlocked hosting (Level 5+). */
export async function createRoom(
  host: { id: string; level: number },
  input: { title: string; description?: string },
) {
  if (!hasFeature(host.level, "HOST_AV_ROOM")) {
    throw new Error("Reach Level 5 to host your own room.");
  }
  return prisma.room.create({
    data: {
      hostId: host.id,
      title: input.title,
      description: input.description,
      participants: { create: { userId: host.id, role: "HOST" } },
    },
  });
}

export async function listLiveRooms() {
  return prisma.room.findMany({
    where: { status: "LIVE" },
    orderBy: { createdAt: "desc" },
    include: {
      host: { select: userSelect },
      _count: { select: { participants: { where: { leftAt: null } } } },
    },
  });
}

export async function getRoom(roomId: string) {
  return prisma.room.findUnique({
    where: { id: roomId },
    include: {
      host: { select: userSelect },
      participants: {
        where: { leftAt: null },
        orderBy: { joinedAt: "asc" },
        include: { user: { select: userSelect } },
      },
    },
  });
}

/** Join a live room as a listener (re-entry clears a prior leftAt). */
export async function joinRoom(userId: string, roomId: string) {
  const room = await prisma.room.findUnique({ where: { id: roomId }, select: { status: true, hostId: true } });
  if (!room || room.status !== "LIVE") throw new Error("Room is not live");

  await prisma.roomParticipant.upsert({
    where: { roomId_userId: { roomId, userId } },
    create: { roomId, userId, role: room.hostId === userId ? "HOST" : "LISTENER" },
    update: { leftAt: null },
  });
}

export async function leaveRoom(userId: string, roomId: string) {
  await prisma.roomParticipant.updateMany({
    where: { roomId, userId, leftAt: null },
    data: { leftAt: new Date() },
  });
}

/** End a room (host only). */
export async function endRoom(hostId: string, roomId: string) {
  const room = await prisma.room.findUnique({ where: { id: roomId }, select: { hostId: true } });
  if (!room || room.hostId !== hostId) return;
  await prisma.room.update({ where: { id: roomId }, data: { status: "ENDED", endedAt: new Date() } });
}

/** Host awards points to a participant for winning a game / completing a task. */
export async function awardInRoom(
  hostId: string,
  roomId: string,
  targetUserId: string,
  reason: PointReason,
) {
  if (hostId === targetUserId) return;
  const room = await prisma.room.findUnique({ where: { id: roomId }, select: { hostId: true, status: true } });
  if (!room || room.hostId !== hostId || room.status !== "LIVE") return;

  const isParticipant = await prisma.roomParticipant.findUnique({
    where: { roomId_userId: { roomId, userId: targetUserId } },
  });
  if (!isParticipant || isParticipant.leftAt) return;

  await awardPoints({
    userId: targetUserId,
    reason,
    sourceType: "room",
    sourceId: roomId,
    awardedById: hostId,
    note: "Room reward",
  });
}
