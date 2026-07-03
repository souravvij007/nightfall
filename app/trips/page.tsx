import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listApprovedTrips } from "@/lib/trips/service";
import { formatMoney } from "@/lib/money";
import { AppNav } from "@/components/AppNav";
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
    <div className="flex flex-1 flex-col items-center bg-[#0a0a12] px-6 py-8 text-white">
      <div className="w-full max-w-xl">
        <AppNav active="trips" />
        <div className="mb-4">
          <PromoBanner variant="rooms" />
        </div>
        <div className="mb-4 flex items-baseline justify-between">
          <h1 className="text-xl font-bold">Trips</h1>
          <Link href="/trips/host" className="text-sm text-fuchsia-300 hover:underline">
            Host a trip →
          </Link>
        </div>

        <form method="get" className="mb-6 flex gap-2">
          <input
            name="destination"
            defaultValue={destination}
            placeholder="Filter by destination"
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-fuchsia-400"
          />
          <button className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20">Search</button>
        </form>

        <div className="space-y-3">
          {trips.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-white/40">
              No upcoming trips{destination ? ` to ${destination}` : ""} yet.
            </p>
          ) : (
            trips.map((t) => (
              <Link key={t.id} href={`/trips/${t.id}`} className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{t.title}</span>
                      {t.isOfficial && <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-xs text-indigo-300">Official</span>}
                    </div>
                    <div className="mt-1 text-xs text-white/40">
                      🧭 {t.destination} · {t.startsAt.toLocaleDateString()}–{t.endsAt.toLocaleDateString()} · by {t.host.displayName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{t.priceCents === 0 ? "Free" : formatMoney(t.priceCents, t.currency)}</div>
                    <div className="text-xs text-white/40">{t.capacity - t._count.bookings} left</div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
