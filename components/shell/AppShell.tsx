import { ServerRail } from "./ServerRail";
import { ShellChrome } from "./ShellChrome";

/**
 * The Discord-style app shell: far-left server rail, an optional contextual sidebar
 * (channel list / DM+home nav), the main pane, and an optional right rail (member list).
 * On mobile the sidebars collapse into drawers (see ShellChrome); the rail stays visible.
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
    <ShellChrome rail={<ServerRail active={activeServerId ?? "home"} />} sidebar={sidebar} right={right}>
      {children}
    </ShellChrome>
  );
}
