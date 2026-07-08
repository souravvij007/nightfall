import { prisma } from "@/lib/db/client";
import { randomToken } from "@/lib/auth/crypto";

const userSelect = { id: true, handle: true, displayName: true, avatarUrl: true, level: true, rank: true } as const;

export type ServerRole = "OWNER" | "ADMIN" | "MEMBER";
export type ChannelType = "TEXT" | "VOICE";

/** OWNER/ADMIN may create, rename, and delete channels and manage the server. */
function canManage(role: ServerRole | null): boolean {
  return role === "OWNER" || role === "ADMIN";
}

/** Text channels are lowercased/hyphenated like Discord; voice channels keep their display name. */
function normalizeChannelName(name: string, type: ChannelType): string {
  if (type === "VOICE") return name.trim().slice(0, 50);
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_]/g, "")
    .slice(0, 50);
  return slug || "channel";
}

/** The viewer's role in a server, or null if not a member. */
export async function membershipRole(userId: string, serverId: string): Promise<ServerRole | null> {
  const m = await prisma.serverMember.findUnique({
    where: { serverId_userId: { serverId, userId } },
    select: { role: true },
  });
  return m?.role ?? null;
}

/** Create a server: the creator becomes OWNER and a #general text channel is auto-created. */
export async function createServer(userId: string, name: string) {
  return prisma.server.create({
    data: {
      name,
      ownerId: userId,
      members: { create: { userId, role: "OWNER" } },
      channels: { create: { name: "general", type: "TEXT", position: 0 } },
    },
    select: { id: true },
  });
}

/** Servers the viewer belongs to, for the server rail. */
export async function listMyServers(userId: string) {
  const memberships = await prisma.serverMember.findMany({
    where: { userId },
    orderBy: { joinedAt: "asc" },
    select: { server: { select: { id: true, name: true, iconUrl: true } } },
  });
  return memberships.map((m) => m.server);
}

/** A server with its channels, gated to members. Returns null if the viewer isn't a member. */
export async function getServer(userId: string, serverId: string) {
  const role = await membershipRole(userId, serverId);
  if (!role) return null;

  const server = await prisma.server.findUnique({
    where: { id: serverId },
    include: { channels: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] } },
  });
  if (!server) return null;

  return { ...server, myRole: role, canManage: canManage(role) };
}

/** Members of a server (id-gated to members via the caller). */
export async function listMembers(serverId: string) {
  const members = await prisma.serverMember.findMany({
    where: { serverId },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    include: { user: { select: userSelect } },
  });
  return members.map((m) => ({ role: m.role as ServerRole, user: m.user }));
}

/** Create a channel. OWNER/ADMIN only. */
export async function createChannel(
  userId: string,
  serverId: string,
  input: { name: string; type: ChannelType },
) {
  const role = await membershipRole(userId, serverId);
  if (!canManage(role)) throw new Error("Only server admins can create channels.");

  const last = await prisma.channel.findFirst({
    where: { serverId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  return prisma.channel.create({
    data: {
      serverId,
      name: normalizeChannelName(input.name, input.type),
      type: input.type,
      position: (last?.position ?? -1) + 1,
    },
    select: { id: true },
  });
}

/** Rename a channel. OWNER/ADMIN only. */
export async function renameChannel(userId: string, channelId: string, name: string) {
  const channel = await prisma.channel.findUnique({ where: { id: channelId }, select: { serverId: true, type: true } });
  if (!channel) return;
  const role = await membershipRole(userId, channel.serverId);
  if (!canManage(role)) throw new Error("Only server admins can rename channels.");
  await prisma.channel.update({
    where: { id: channelId },
    data: { name: normalizeChannelName(name, channel.type as ChannelType) },
  });
}

/** Delete a channel. OWNER/ADMIN only. */
export async function deleteChannel(userId: string, channelId: string) {
  const channel = await prisma.channel.findUnique({ where: { id: channelId }, select: { serverId: true } });
  if (!channel) return;
  const role = await membershipRole(userId, channel.serverId);
  if (!canManage(role)) throw new Error("Only server admins can delete channels.");
  await prisma.channel.delete({ where: { id: channelId } });
}

/** Create a shareable invite code for a server. Any member may invite. */
export async function createInvite(userId: string, serverId: string) {
  const role = await membershipRole(userId, serverId);
  if (!role) throw new Error("Join the server before inviting others.");
  const code = randomToken(5); // 10 hex chars
  await prisma.serverInvite.create({ data: { code, serverId, createdById: userId } });
  return code;
}

/** Look up an invite by code (for the join preview), with server + member count. */
export async function getInvite(code: string) {
  const invite = await prisma.serverInvite.findUnique({
    where: { code },
    include: { server: { select: { id: true, name: true, iconUrl: true, _count: { select: { members: true } } } } },
  });
  if (!invite) return null;
  if (invite.expiresAt && invite.expiresAt < new Date()) return null;
  if (invite.maxUses != null && invite.uses >= invite.maxUses) return null;
  return invite;
}

/** Redeem an invite: add the viewer as a MEMBER (idempotent) and bump the use count. Returns serverId. */
export async function joinViaInvite(userId: string, code: string): Promise<string> {
  const invite = await getInvite(code);
  if (!invite) throw new Error("This invite is invalid or has expired.");

  const existing = await membershipRole(userId, invite.serverId);
  if (!existing) {
    await prisma.$transaction([
      prisma.serverMember.create({ data: { serverId: invite.serverId, userId, role: "MEMBER" } }),
      prisma.serverInvite.update({ where: { id: invite.id }, data: { uses: { increment: 1 } } }),
    ]);
  }
  return invite.serverId;
}
