import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getServer, listMembers } from "@/lib/servers/service";
import { listChannelMessages } from "@/lib/servers/messages";
import { getVoiceRoom, listVoicePresence } from "@/lib/servers/voice";
import { AppShell } from "@/components/shell/AppShell";
import { ChannelSidebar } from "@/components/shell/ChannelSidebar";
import { MemberList } from "@/components/shell/MemberList";
import { ChannelMessages } from "@/components/shell/ChannelMessages";
import { ChannelComposer } from "@/components/shell/ChannelComposer";
import { VoiceChannel } from "@/components/shell/VoiceChannel";
import { InviteButton } from "@/components/shell/InviteButton";
import { RealtimeRefresh } from "@/components/realtime/RealtimeRefresh";

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ serverId: string; channelId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { serverId, channelId } = await params;
  const server = await getServer(user.id, serverId);
  if (!server) notFound();
  const channel = server.channels.find((c) => c.id === channelId);
  if (!channel) notFound();

  const [members, voicePresence] = await Promise.all([
    listMembers(serverId),
    listVoicePresence(serverId),
  ]);
  const sidebar = (
    <ChannelSidebar
      server={{ id: server.id, name: server.name, channels: server.channels, canManage: server.canManage }}
      activeChannelId={channelId}
      voicePresence={voicePresence}
    />
  );
  const right = <MemberList members={members} />;

  return (
    <AppShell activeServerId={serverId} sidebar={sidebar} right={right}>
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4 shadow-sm">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-muted">{channel.type === "VOICE" ? "🔊" : "#"}</span>
          <span className="truncate font-semibold text-bright">{channel.name}</span>
        </div>
        <InviteButton serverId={serverId} />
      </header>

      {channel.type === "VOICE" ? (
        <VoiceBody user={user.id} serverId={serverId} channelId={channelId} />
      ) : (
        <ChannelBody user={user.id} serverId={serverId} channelId={channelId} channelName={channel.name} />
      )}
    </AppShell>
  );
}

async function ChannelBody({
  user,
  serverId,
  channelId,
  channelName,
}: {
  user: string;
  serverId: string;
  channelId: string;
  channelName: string;
}) {
  const data = await listChannelMessages(user, channelId);
  const messages = data?.messages ?? [];

  return (
    <>
      <RealtimeRefresh topic="channel" id={channelId} />
      <div className="dc-scroll flex-1 overflow-y-auto">
        <div className="flex min-h-full flex-col justify-end">
          <ChannelMessages messages={messages} channelName={channelName} />
        </div>
      </div>
      <ChannelComposer serverId={serverId} channelId={channelId} channelName={channelName} />
    </>
  );
}

async function VoiceBody({
  user,
  serverId,
  channelId,
}: {
  user: string;
  serverId: string;
  channelId: string;
}) {
  const voice = await getVoiceRoom(user, channelId);
  if (!voice) notFound();
  return (
    <VoiceChannel
      serverId={serverId}
      voice={{ channel: voice.channel, roomId: voice.roomId, participants: voice.participants, inRoom: voice.inRoom }}
    />
  );
}
