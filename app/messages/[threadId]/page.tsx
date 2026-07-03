import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getThread } from "@/lib/social/dm";
import { AppNav } from "@/components/AppNav";
import { RealtimeRefresh } from "@/components/realtime/RealtimeRefresh";
import { sendMessageAction } from "../actions";

export default async function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { threadId } = await params;
  const thread = await getThread(user.id, threadId);
  if (!thread) notFound();

  return (
    <div className="flex flex-1 flex-col items-center bg-[#0a0a12] px-6 py-8 text-white">
      <div className="flex w-full max-w-xl flex-1 flex-col">
        <RealtimeRefresh topic="dm" id={thread.id} />
        <AppNav />

        <div className="mb-4 flex items-center gap-3">
          <Link href="/messages" className="text-sm text-white/40 hover:text-white">
            ←
          </Link>
          <Link href={`/u/${thread.other.handle}`} className="font-semibold hover:underline">
            {thread.other.displayName}
          </Link>
          <span className="text-sm text-white/40">@{thread.other.handle}</span>
        </div>

        <div className="flex-1 space-y-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          {thread.messages.length === 0 && (
            <p className="py-8 text-center text-sm text-white/40">Say hi 👋</p>
          )}
          {thread.messages.map((m) => {
            const mine = m.senderId === user.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    mine ? "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white" : "bg-white/10 text-white/90"
                  }`}
                >
                  {m.body}
                </div>
              </div>
            );
          })}
        </div>

        <form action={sendMessageAction} className="mt-3 flex gap-2">
          <input type="hidden" name="threadId" value={thread.id} />
          <input
            name="body"
            required
            maxLength={2000}
            autoComplete="off"
            placeholder="Message…"
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/30 outline-none focus:border-fuchsia-400"
          />
          <button className="rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
