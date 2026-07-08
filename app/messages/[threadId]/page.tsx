import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getThread } from "@/lib/social/dm";
import { AppShell } from "@/components/shell/AppShell";
import { HomeSidebar } from "@/components/shell/HomeSidebar";
import { RealtimeRefresh } from "@/components/realtime/RealtimeRefresh";
import { sendMessageAction } from "../actions";

export default async function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { threadId } = await params;
  const thread = await getThread(user.id, threadId);
  if (!thread) notFound();

  return (
    <AppShell activeServerId="home" sidebar={<HomeSidebar active="messages" />}>
      <RealtimeRefresh topic="dm" id={thread.id} />
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-4 shadow-sm">
        <Link href="/messages" className="text-muted hover:text-bright md:hidden">
          ←
        </Link>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-indigo to-brand-fuchsia text-xs font-bold text-white">
          {thread.other.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thread.other.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            thread.other.displayName.charAt(0).toUpperCase()
          )}
        </span>
        <Link href={`/u/${thread.other.handle}`} className="font-semibold text-bright hover:underline">
          {thread.other.displayName}
        </Link>
        <span className="text-sm text-muted">@{thread.other.handle}</span>
      </header>

      <div className="dc-scroll flex-1 overflow-y-auto">
        <div className="flex min-h-full flex-col justify-end gap-1 p-4">
          {thread.messages.length === 0 && (
            <p className="py-8 text-center text-sm text-muted">Say hi 👋</p>
          )}
          {thread.messages.map((m) => {
            const mine = m.senderId === user.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    mine
                      ? "bg-gradient-to-r from-brand-indigo to-brand-fuchsia text-white"
                      : "bg-hover text-foreground"
                  }`}
                >
                  {m.body}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <form action={sendMessageAction} className="flex gap-2 px-4 pb-5 pt-1">
        <input type="hidden" name="threadId" value={thread.id} />
        <input
          name="body"
          required
          maxLength={2000}
          autoComplete="off"
          placeholder={`Message ${thread.other.displayName}`}
          className="flex-1 rounded-lg bg-[#383a40] px-4 py-2.5 text-bright placeholder-muted outline-none"
        />
        <button className="shrink-0 rounded-lg bg-gradient-to-r from-brand-indigo to-brand-fuchsia px-5 py-2 text-sm font-semibold text-white">
          Send
        </button>
      </form>
    </AppShell>
  );
}
