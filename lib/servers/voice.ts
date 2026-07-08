import { prisma } from "@/lib/db/client";
import { membershipRole } from "./service";
import { leaveRoom } from "@/lib/rooms/service";

const userSelect = { id: true, handle: true, displayName: true, avatarUrl: true, level: true, rank: true } as const;

/** A VOICE channel with its owning server, or null. */
async function voiceChannel(channelId: string) {
  return prisma.channel.findUnique({
    where: { id: channelId },
    select: { id: true, name: true, type: true, serverId: true, server: { select: { ownerId: true } } },
  });
}

/**
 * Ensure a persistent LIVE Room backs a VOICE channel, returning its id.
 * Unlike standalone rooms (Level-5 host gate), a channel's room is spun up by any server member;
 * the server owner is recorded as host so the existing host→participant award loop still works.
 */
async function ensureVoiceRoom(channel: { id: string; name: string; serverId: string; server: { ownerId: string } }) {
  const existing = await prisma.room.findUnique({
    where: { channelId: channel.id },
    select: { id: true, status: true },
  });
  if (existing) {
    if (existing.status !== "LIVE") {
      await prisma.room.update({ where: { id: existing.id }, data: { status: "LIVE", endedAt: null } });
    }
    return existing.id;
  }
  const room = await prisma.room.create({
    data: { channelId: channel.id, hostId: channel.server.ownerId, title: channel.name },
    select: { id: true },
  });
  return room.id;
}

/** The LIVE room backing a voice channel with its present participants. Membership-gated; null otherwise. */
export async function getVoiceRoom(userId: string, channelId: string) {
  const channel = await voiceChannel(channelId);
  if (!channel || channel.type !== "VOICE") return null;
  const role = await membershipRole(userId, channel.serverId);
  if (!role) return null;

  const room = await prisma.room.findUnique({
    where: { channelId },
    include: {
      participants: {
        where: { leftAt: null },
        orderBy: { joinedAt: "asc" },
        include: { user: { select: userSelect } },
      },
    },
  });

  const me = room?.participants.find((p) => p.userId === userId) ?? null;
  return {
    channel,
    roomId: room?.id ?? null,
    hostId: room?.hostId ?? channel.server.ownerId,
    participants: room?.participants ?? [],
    inRoom: Boolean(me),
  };
}

/** Join a voice channel: ensure its room exists, then add the member as a SPEAKER (everyone can talk). */
export async function joinVoiceChannel(userId: string, channelId: string): Promise<string> {
  const channel = await voiceChannel(channelId);
  if (!channel || channel.type !== "VOICE") throw new Error("Not a voice channel");
  const role = await membershipRole(userId, channel.serverId);
  if (!role) throw new Error("Not a member of this server");

  const roomId = await ensureVoiceRoom(channel);
  await prisma.roomParticipant.upsert({
    where: { roomId_userId: { roomId, userId } },
    create: { roomId, userId, role: channel.server.ownerId === userId ? "HOST" : "SPEAKER" },
    update: { leftAt: null },
  });
  return roomId;
}

/** Leave a voice channel (marks the participant as gone; the room persists like a Discord channel). */
export async function leaveVoiceChannel(userId: string, channelId: string) {
  const room = await prisma.room.findUnique({ where: { channelId }, select: { id: true } });
  if (room) await leaveRoom(userId, room.id);
}

/** Present participants per voice channel of a server, for showing presence in the sidebar. */
export async function listVoicePresence(serverId: string): Promise<Record<string, { id: string; displayName: string; avatarUrl: string | null }[]>> {
  const rooms = await prisma.room.findMany({
    where: { status: "LIVE", channel: { serverId, type: "VOICE" } },
    select: {
      channelId: true,
      participants: {
        where: { leftAt: null },
        orderBy: { joinedAt: "asc" },
        select: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
      },
    },
  });
  const map: Record<string, { id: string; displayName: string; avatarUrl: string | null }[]> = {};
  for (const r of rooms) {
    if (r.channelId) map[r.channelId] = r.participants.map((p) => p.user);
  }
  return map;
}
