import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listApprovedMeetups } from "@/lib/meetups/service";
import { formatMoney } from "@/lib/money";
import { HomePane } from "@/components/shell/HomePane";
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
    <HomePane
      active="meetups"
      icon="📍"
      title="Meetups"
      headerRight={
        <Link href="/meetups/host" className="text-sm text-brand-fuchsia hover:underline">
          Host a meetup →
        </Link>
      }
    >
      <div className="mb-4">
        <PromoBanner variant="trips" />
      </div>

      {/* Filters */}
      <form method="get" className="mb-6 flex gap-2">
        <input
          name="city"
          defaultValue={city}
          placeholder="Filter by city"
          className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-bright placeholder-muted outline-none focus:border-brand-fuchsia"
        />
        <input
          name="date"
          type="date"
          defaultValue={date}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-bright outline-none focus:border-brand-fuchsia"
        />
        <button className="rounded-lg bg-hover px-4 py-2 text-sm font-semibold text-bright transition hover:bg-active">
          Search
        </button>
      </form>

      <div className="space-y-3">
        {meetups.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface p-8 text-center text-muted">
            No upcoming meetups{city ? ` in ${city}` : ""}. Check back soon or host one.
          </p>
        ) : (
          meetups.map((m) => {
            const spotsLeft = m.capacity - m._count.bookings;
            return (
              <Link
                key={m.id}
                href={`/meetups/${m.id}`}
                className="block rounded-2xl border border-line bg-surface p-4 transition hover:bg-hover"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-bright">{m.title}</span>
                      {m.isOfficial && (
                        <span className="rounded bg-brand-indigo/20 px-1.5 py-0.5 text-xs text-indigo-300">
                          Official
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      📍 {m.city} · {m.startsAt.toLocaleString()} · by {m.host.displayName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-bright">{m.feeCents === 0 ? "Free" : formatMoney(m.feeCents, m.currency)}</div>
                    <div className="text-xs text-muted">{spotsLeft} left</div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </HomePane>
  );
}
