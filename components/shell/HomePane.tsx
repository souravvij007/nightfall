import { AppShell } from "./AppShell";
import { HomeSidebar } from "./HomeSidebar";

/**
 * Convenience wrapper for the "home" (non-server) content pages: renders the
 * Discord shell with the Home sidebar, a titled header, and a scrolling body.
 * Content is centered in a readable column, matching the old max-w-xl layout.
 */
export function HomePane({
  active,
  icon,
  title,
  headerRight,
  children,
}: {
  active: string;
  icon: string;
  title: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <AppShell activeServerId="home" sidebar={<HomeSidebar active={active} />}>
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted">{icon}</span>
          <span className="font-semibold text-bright">{title}</span>
        </div>
        {headerRight}
      </header>
      <div className="dc-scroll flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-4 py-6">{children}</div>
      </div>
    </AppShell>
  );
}
