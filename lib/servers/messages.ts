import { prisma } from "@/lib/db/client";
import { membershipRole } from "./service";

const authorSelect = { id: true, handle: true, displayName: true, avatarUrl: true, level: true, rank: true } as const;

/** Resolve a channel to its server, or null if it doesn't exist. */
async function channelServer(channelId: string): Promise<{ serverId: string; type: string; name: string } | null> {
  return prisma.channel.findUnique({ where: { id: channelId }, select: { serverId: true, type: true, name: true } });
}

/** Messages in a text channel, oldest-first. Returns null if the viewer isn't a member of the channel's server. */
export async function listChannelMessages(userId: string, channelId: string, take = 100) {
  const channel = await channelServer(channelId);
  if (!channel) return null;
  const role = await membershipRole(userId, channel.serverId);
  if (!role) return null;

  const messages = await prisma.channelMessage.findMany({
    where: { channelId },
    orderBy: { createdAt: "asc" },
    take,
    include: { author: { select: authorSelect } },
  });
  return { channel, messages };
}

/** Post to a text channel. Verifies membership. */
export async function sendChannelMessage(userId: string, channelId: string, body: string) {
  const channel = await channelServer(channelId);
  if (!channel) throw new Error("Channel not found");
  if (channel.type !== "TEXT") throw new Error("Cannot post to a voice channel");
  const role = await membershipRole(userId, channel.serverId);
  if (!role) throw new Error("Not a member of this server");

  await prisma.channelMessage.create({ data: { channelId, authorId: userId, body } });
  // Clients pick up new messages via polling (/api/poll?topic=channel) — see RealtimeRefresh.
}
