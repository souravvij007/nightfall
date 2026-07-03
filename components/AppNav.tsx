import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/admin";

type Tab = "feed" | "me" | "messages" | "rooms" | "meetups" | "trips";

const TABS: { href: string; label: string; icon: string; key: Tab }[] = [
  { href: "/feed", label: "Feed", icon: "🏠", key: "feed" },
  { href: "/rooms", label: "Rooms", icon: "🎙️", key: "rooms" },
  { href: "/meetups", label: "Meetups", icon: "📍", key: "meetups" },
  { href: "/trips", label: "Trips", icon: "🧭", key: "trips" },
  { href: "/messages", label: "Chats", icon: "💬", key: "messages" },
  { href: "/me", label: "You", icon: "✨", key: "me" },
];

/** Sticky glass top bar (all sizes) + a fixed bottom tab bar on mobile. */
export async function AppNav({ active }: { active?: Tab }) {
  const user = await getCurrentUser();
  const staff = user ? isStaff(user) : false;

  return (
    <>
      {/* Top bar */}
      <nav className="sticky top-0 z-30 -mx-6 mb-6 border-b border-white/5 bg-[#0a0a12]/70 px-6 backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl items-center justify-between py-3">
          <Link href="/feed" className="flex items-center gap-1.5 text-lg font-bold tracking-tight text-white">
            <span>🌙</span> <span className="hidden sm:inline">Nightfall</span>
          </Link>
          <div className="no-scrollbar flex items-center gap-4 overflow-x-auto">
            {TABS.map((t) => (
              <Link
                key={t.key}
                href={t.href}
                className={`hidden text-sm transition sm:block ${active === t.key ? "font-semibold text-white" : "text-white/50 hover:text-white"}`}
              >
                {t.label}
              </Link>
            ))}
            {staff && (
              <Link href="/admin/moderation" className="text-sm font-semibold text-red-300 hover:text-red-200">
                Admin
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Bottom tab bar (mobile only) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0a0a12]/90 backdrop-blur-xl sm:hidden">
        <div className="mx-auto flex max-w-xl items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={t.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition ${active === t.key ? "text-white" : "text-white/45"}`}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              {t.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
