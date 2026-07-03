import Link from "next/link";
import { listPendingMeetups } from "@/lib/meetups/service";
import { formatMoney } from "@/lib/money";
import { approveMeetupAction, rejectMeetupAction } from "./actions";

export default async function AdminMeetupsPage() {
  const meetups = await listPendingMeetups();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold">Meetup approvals</h1>
      <p className="mt-1 text-white/50">
        {meetups.length} awaiting review
      </p>

      <div className="mt-6 space-y-4">
        {meetups.length === 0 && (
          <p className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-white/40">
            No meetups awaiting approval. ✨
          </p>
        )}

        {meetups.map((m) => (
          <div key={m.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold">{m.title}</h2>
                <p className="mt-1 text-xs text-white/40">
                  by{" "}
                  <Link href={`/u/${m.host.handle}`} className="hover:underline">
                    @{m.host.handle}
                  </Link>{" "}
                  (Lvl {m.host.level}) · 📍 {m.city} · {m.startsAt.toLocaleString()}
                </p>
              </div>
              <div className="text-right text-sm">
                <div className="font-semibold">
                  {m.feeCents === 0 ? "Free" : formatMoney(m.feeCents, m.currency)}
                </div>
                <div className="text-xs text-white/40">cap {m.capacity}</div>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-white/70">{m.description}</p>

            <div className="mt-4 flex gap-2">
              <form action={approveMeetupAction}>
                <input type="hidden" name="meetupId" value={m.id} />
                <button className="rounded-lg bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/25">
                  Approve
                </button>
              </form>
              <form action={rejectMeetupAction} className="flex gap-2">
                <input type="hidden" name="meetupId" value={m.id} />
                <input
                  name="reason"
                  placeholder="Reason (optional)"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none"
                />
                <button className="rounded-lg bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/25">
                  Reject
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
