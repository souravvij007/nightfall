import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listThreads } from "@/lib/social/dm";
import { AppShell } from "@/components/shell/AppShell";
import { HomeSidebar } from "@/components/shell/HomeSidebar";
import { RealtimeRefresh } from "@/components/realtime/RealtimeRefresh";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const threads = await listThreads(user.id);

  return (
    <AppShell activeServerId="home" sidebar={<HomeSidebar active="messages" />}>
      <RealtimeRefresh topic="dm" />
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-4 shadow-sm">
        <span className="text-muted">💬</span>
        <span className="font-semibold text-bright">Direct Messages</span>
      </header>

      <div className="dc-scroll flex-1 overflow-y-auto p-4">
        {threads.length === 0 ? (
          <div className="mx-auto mt-16 max-w-sm rounded-2xl border border-line bg-surface px-6 py-10 text-center">
            <div className="mb-2 text-3xl">💬</div>
            <p className="text-sm text-muted">
              No conversations yet. Open someone&apos;s profile and tap Message to start one.
            </p>
          </div>
        ) : (
          <ul className="mx-auto max-w-2xl space-y-1">
            {threads.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/messages/${t.id}`}
                  className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-hover"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-indigo to-brand-fuchsia font-bold text-white">
                    {t.other.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.other.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      t.other.displayName.charAt(0).toUpperCase()
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-bright">{t.other.displayName}</div>
                    <div className="truncate text-sm text-muted">
                      {t.lastMessage ? t.lastMessage.body : "No messages yet"}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
