import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listApprovedTrips } from "@/lib/trips/service";
import { formatMoney } from "@/lib/money";
import { HomePane } from "@/components/shell/HomePane";
import { PromoBanner } from "@/components/PromoBanner";

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { destination } = await searchParams;
  const trips = await listApprovedTrips({ destination });

  return (
    <HomePane
      active="trips"
      icon="🧭"
      title="Trips"
      headerRight={
        <Link href="/trips/host" className="text-sm text-brand-fuchsia hover:underline">
          Host a trip →
        </Link>
      }
    >
      <div className="mb-4">
        <PromoBanner variant="rooms" />
      </div>

      <form method="get" className="mb-6 flex gap-2">
        <input
          name="destination"
          defaultValue={destination}
          placeholder="Filter by destination"
          className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-bright placeholder-muted outline-none focus:border-brand-fuchsia"
        />
        <button className="rounded-lg bg-hover px-4 py-2 text-sm font-semibold text-bright transition hover:bg-active">Search</button>
      </form>

      <div className="space-y-3">
        {trips.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface p-8 text-center text-muted">
            No upcoming trips{destination ? ` to ${destination}` : ""} yet.
          </p>
        ) : (
          trips.map((t) => (
            <Link key={t.id} href={`/trips/${t.id}`} className="block rounded-2xl border border-line bg-surface p-4 transition hover:bg-hover">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-bright">{t.title}</span>
                    {t.isOfficial && <span className="rounded bg-brand-indigo/20 px-1.5 py-0.5 text-xs text-indigo-300">Official</span>}
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    🧭 {t.destination} · {t.startsAt.toLocaleDateString()}–{t.endsAt.toLocaleDateString()} · by {t.host.displayName}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-bright">{t.priceCents === 0 ? "Free" : formatMoney(t.priceCents, t.currency)}</div>
                  <div className="text-xs text-muted">{t.capacity - t._count.bookings} left</div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </HomePane>
  );
}
