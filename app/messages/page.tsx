import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listThreads } from "@/lib/social/dm";
import { AppNav } from "@/components/AppNav";
import { RealtimeRefresh } from "@/components/realtime/RealtimeRefresh";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const threads = await listThreads(user.id);

  return (
    <div className="flex flex-1 flex-col items-center bg-[#0a0a12] px-6 py-8 text-white">
      <div className="w-full max-w-xl">
        <RealtimeRefresh topic="dm" />
        <AppNav active="messages" />
        <h1 className="mb-4 text-xl font-bold">Messages</h1>

        {threads.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-white/40">
            No conversations yet. Open someone's profile and tap Message to start one.
          </p>
        ) : (
          <ul className="space-y-2">
            {threads.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/messages/${t.id}`}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:bg-white/[0.06]"
                >
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 font-bold">
                    {t.other.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{t.other.displayName}</div>
                    <div className="truncate text-sm text-white/50">
                      {t.lastMessage ? t.lastMessage.body : "No messages yet"}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
