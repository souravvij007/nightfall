import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listApprovedMeetups } from "@/lib/meetups/service";
import { formatMoney } from "@/lib/money";
import { AppNav } from "@/components/AppNav";
import { PromoBanner } from "@/components/PromoBanner";

export default async function MeetupsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; date?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { city, date } = await searchParams;
  const meetups = await listApprovedMeetups({ city, date });

  return (
    <div className="flex flex-1 flex-col items-center bg-[#0a0a12] px-6 py-8 text-white">
      <div className="w-full max-w-xl">
        <AppNav active="meetups" />
        <div className="mb-4">
          <PromoBanner variant="trips" />
        </div>
        <div className="mb-4 flex items-baseline justify-between">
          <h1 className="text-xl font-bold">Meetups</h1>
          <Link href="/meetups/host" className="text-sm text-fuchsia-300 hover:underline">
            Host a meetup →
          </Link>
        </div>

        {/* Filters */}
        <form method="get" className="mb-6 flex gap-2">
          <input
            name="city"
            defaultValue={city}
            placeholder="Filter by city"
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-fuchsia-400"
          />
          <input
            name="date"
            type="date"
            defaultValue={date}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-fuchsia-400"
          />
          <button className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20">
            Search
          </button>
        </form>

        <div className="space-y-3">
          {meetups.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-white/40">
              No upcoming meetups{city ? ` in ${city}` : ""}. Check back soon or host one.
            </p>
          ) : (
            meetups.map((m) => {
              const spotsLeft = m.capacity - m._count.bookings;
              return (
                <Link
                  key={m.id}
                  href={`/meetups/${m.id}`}
                  className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{m.title}</span>
                        {m.isOfficial && (
                          <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-xs text-indigo-300">
                            Official
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-white/40">
                        📍 {m.city} · {m.startsAt.toLocaleString()} · by {m.host.displayName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{m.feeCents === 0 ? "Free" : formatMoney(m.feeCents, m.currency)}</div>
                      <div className="text-xs text-white/40">{spotsLeft} left</div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
