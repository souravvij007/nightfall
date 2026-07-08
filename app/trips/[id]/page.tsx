import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getTrip } from "@/lib/trips/service";
import { formatMoney } from "@/lib/money";
import { HomePane } from "@/components/shell/HomePane";
import { bookTripAction } from "../actions";

const VENDOR_ICON: Record<string, string> = { HOTEL: "🏨", TRANSPORT: "🚐", ACTIVITY: "🎯", OTHER: "📦" };

export default async function TripPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ booked?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const { booked, error } = await searchParams;
  const t = await getTrip(id, user.id);
  if (!t) notFound();

  const isHost = t.hostId === user.id;
  const soldOut = t.spotsLeft <= 0;
  const past = t.startsAt.getTime() <= Date.now();
  const alreadyBooked = t.myBooking?.status === "CONFIRMED";

  return (
    <HomePane active="trips" icon="🧭" title={t.title}>
      <Link href="/trips" className="mb-4 inline-block text-sm text-muted hover:text-bright">← All trips</Link>

      <div className="rounded-2xl border border-line bg-surface p-6 text-white">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{t.title}</h1>
            {t.isOfficial && <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-xs text-indigo-300">Official</span>}
          </div>
          <p className="mt-1 text-sm text-white/40">
            🧭 {t.destination} · {t.startsAt.toLocaleDateString()}–{t.endsAt.toLocaleDateString()} · hosted by{" "}
            <Link href={`/u/${t.host.handle}`} className="hover:underline">{t.host.displayName}</Link>
          </p>
          <p className="mt-4 whitespace-pre-wrap text-white/80">{t.description}</p>

          {/* Itinerary */}
          {t.itinerary.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-2 text-xs uppercase tracking-widest text-white/40">Itinerary</h2>
              <ol className="space-y-2">
                {t.itinerary.map((d) => (
                  <li key={d.id} className="rounded-lg bg-white/[0.03] px-3 py-2">
                    <div className="text-sm font-semibold">Day {d.dayNumber}: {d.title}</div>
                    {d.description && <div className="text-sm text-white/60">{d.description}</div>}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Accommodations */}
          {t.accommodations.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-2 text-xs uppercase tracking-widest text-white/40">Stays</h2>
              <ul className="space-y-1 text-sm text-white/70">
                {t.accommodations.map((a) => (
                  <li key={a.id}>🏨 {a.name} · {a.nights} night{a.nights === 1 ? "" : "s"}{a.details ? ` · ${a.details}` : ""}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Vendors (transparency) */}
          {t.vendors.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-2 text-xs uppercase tracking-widest text-white/40">Vetted vendors</h2>
              <ul className="flex flex-wrap gap-2 text-xs">
                {t.vendors.map((v) => (
                  <li key={v.id} className="rounded-full bg-white/5 px-3 py-1 text-white/70">
                    {VENDOR_ICON[v.kind]} {v.name}
                    {v.vetStatus === "APPROVED" && <span className="ml-1 text-emerald-300">✓</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <Info label="🎟️ Price" value={t.priceCents === 0 ? "Free" : formatMoney(t.priceCents, t.currency)} />
            <Info label="👥 Spots" value={`${t.spotsLeft} of ${t.capacity} left`} />
          </dl>

          <div className="mt-6">
            {booked && <p className="mb-3 rounded-lg bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300">You&apos;re booked! 🎉 Adventure awaits.</p>}
            {error && <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

            {isHost ? (
              <p className="text-sm text-white/40">This is your trip.</p>
            ) : alreadyBooked ? (
              <p className="rounded-lg bg-emerald-400/10 px-4 py-2 text-center font-semibold text-emerald-300">Booked ✓</p>
            ) : past ? (
              <p className="text-sm text-white/40">This trip has already started.</p>
            ) : soldOut ? (
              <p className="text-sm text-white/40">Sold out.</p>
            ) : (
              <form action={bookTripAction}>
                <input type="hidden" name="tripId" value={t.id} />
                <button className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-3 font-semibold text-white">
                  {t.priceCents === 0 ? "Book free spot" : `Book · ${formatMoney(t.priceCents, t.currency)}`}
                </button>
              </form>
            )}
          </div>
        </div>
    </HomePane>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-panel px-3 py-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-white/90">{value}</dd>
    </div>
  );
}
