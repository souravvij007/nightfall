import { ServerRail } from "./ServerRail";

/**
 * The Discord-style app shell: far-left server rail, an optional contextual sidebar
 * (channel list / DM+home nav), the main pane, and an optional right rail (member list).
 * Sidebars collapse on small screens; the rail is always visible.
 */
export function AppShell({
  activeServerId,
  sidebar,
  right,
  children,
}: {
  activeServerId?: string;
  sidebar?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-bg text-foreground">
      <ServerRail active={activeServerId ?? "home"} />

      {sidebar && (
        <aside className="hidden w-60 shrink-0 flex-col bg-surface md:flex">{sidebar}</aside>
      )}

      <main className="flex min-w-0 flex-1 flex-col bg-panel">{children}</main>

      {right && (
        <aside className="hidden w-56 shrink-0 flex-col bg-surface lg:flex">{right}</aside>
      )}
    </div>
  );
}
