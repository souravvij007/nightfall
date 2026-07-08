import Link from "next/link";
import { AddChannelButton } from "./AddChannelButton";

interface ChannelLite {
  id: string;
  name: string;
  type: "TEXT" | "VOICE";
}

/** A server's channel list sidebar: server header + text/voice channels + add-channel for admins. */
export function ChannelSidebar({
  server,
  activeChannelId,
}: {
  server: { id: string; name: string; channels: ChannelLite[]; canManage: boolean };
  activeChannelId?: string;
}) {
  const text = server.channels.filter((c) => c.type === "TEXT");
  const voice = server.channels.filter((c) => c.type === "VOICE");

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4 font-bold text-bright shadow-sm">
        <span className="truncate">{server.name}</span>
      </div>

      <div className="dc-scroll flex-1 overflow-y-auto p-2">
        <ChannelGroup
          label="Text Channels"
          serverId={server.id}
          canManage={server.canManage}
          type="TEXT"
        >
          {text.map((c) => (
            <ChannelRow
              key={c.id}
              href={`/servers/${server.id}/${c.id}`}
              active={c.id === activeChannelId}
              icon="#"
              name={c.name}
            />
          ))}
        </ChannelGroup>

        <ChannelGroup
          label="Voice Channels"
          serverId={server.id}
          canManage={server.canManage}
          type="VOICE"
        >
          {voice.map((c) => (
            <ChannelRow
              key={c.id}
              href={`/servers/${server.id}/${c.id}`}
              active={c.id === activeChannelId}
              icon="🔊"
              name={c.name}
            />
          ))}
        </ChannelGroup>
      </div>
    </div>
  );
}

function ChannelGroup({
  label,
  serverId,
  canManage,
  type,
  children,
}: {
  label: string;
  serverId: string;
  canManage: boolean;
  type: "TEXT" | "VOICE";
  children: React.ReactNode;
}) {
  return (
    <div className="mt-3 first:mt-1">
      <div className="flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wide text-muted">
        <span>{label}</span>
        {canManage && <AddChannelButton serverId={serverId} type={type} />}
      </div>
      <div className="mt-1 space-y-0.5">{children}</div>
    </div>
  );
}

function ChannelRow({
  href,
  active,
  icon,
  name,
}: {
  href: string;
  active: boolean;
  icon: string;
  name: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 rounded px-2 py-1.5 text-sm transition ${
        active ? "bg-active text-bright" : "text-muted hover:bg-hover hover:text-bright"
      }`}
    >
      <span className="w-4 text-center text-muted">{icon}</span>
      <span className="truncate">{name}</span>
    </Link>
  );
}
