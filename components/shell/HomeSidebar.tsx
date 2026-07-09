import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { listThreads } from "@/lib/social/dm";

// Voice lives inside servers now (Phase 2), so "Rooms" is no longer a top-level destination.
const NAV = [
  { href: "/search", label: "Search", icon: "🔍", key: "search" },
  { href: "/feed", label: "Feed", icon: "🏠", key: "feed" },
  { href: "/meetups", label: "Meetups", icon: "📍", key: "meetups" },
  { href: "/trips", label: "Trips", icon: "🧭", key: "trips" },
  { href: "/messages", label: "Direct Messages", icon: "💬", key: "messages" },
  { href: "/me", label: "You", icon: "✨", key: "me" },
];

/** The contextual sidebar for "home" (non-server) pages: app nav + DM conversation list. */
export async function HomeSidebar({ active }: { active?: string }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const threads = await listThreads(user.id);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center border-b border-line px-4 font-bold text-bright shadow-sm">
        Nightfall
      </div>

      <div className="dc-scroll flex-1 overflow-y-auto p-2">
        <nav className="space-y-0.5">
          {NAV.map((n) => (
            <Link
              key={n.key}
              href={n.href}
              className={`flex items-center gap-3 rounded px-2 py-2 text-sm font-medium transition ${
                active === n.key
                  ? "bg-active text-bright"
                  : "text-muted hover:bg-hover hover:text-bright"
              }`}
            >
              <span className="text-base leading-none">{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="mt-4 px-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Direct Messages
        </div>
        <ul className="mt-1 space-y-0.5">
          {threads.length === 0 && (
            <li className="px-2 py-2 text-xs text-muted">No conversations yet.</li>
          )}
          {threads.map((t) => (
            <li key={t.id}>
              <Link
                href={`/messages/${t.id}`}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-muted transition hover:bg-hover hover:text-bright"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-indigo to-brand-fuchsia text-xs font-bold text-white">
                  {t.other.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.other.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    t.other.displayName.charAt(0).toUpperCase()
                  )}
                </span>
                <span className="truncate text-sm">{t.other.displayName}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-line bg-bg/40 px-3 py-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-indigo to-brand-fuchsia text-xs font-bold text-white">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            user.displayName.charAt(0).toUpperCase()
          )}
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-bright">{user.displayName}</div>
          <div className="truncate text-xs text-muted">@{user.handle}</div>
        </div>
      </div>
    </div>
  );
}
