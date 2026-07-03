import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getMeetup } from "@/lib/meetups/service";
import { formatMoney } from "@/lib/money";
import { AppNav } from "@/components/AppNav";
import { bookMeetupAction } from "../actions";

export default async function MeetupPage({
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
  const m = await getMeetup(id, user.id);
  if (!m) notFound();

  const isHost = m.hostId === user.id;
  const soldOut = m.spotsLeft <= 0;
  const past = m.startsAt.getTime() <= Date.now();
  const alreadyBooked = m.myBooking?.status === "CONFIRMED";

  return (
    <div className="flex flex-1 flex-col items-center bg-[#0a0a12] px-6 py-8 text-white">
      <div className="w-full max-w-xl">
        <AppNav />
        <Link href="/meetups" className="mb-4 inline-block text-sm text-white/40 hover:text-white">
          ← All meetups
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{m.title}</h1>
            {m.isOfficial && (
              <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-xs text-indigo-300">Official</span>
            )}
          </div>
          <p className="mt-1 text-sm text-white/40">
            hosted by{" "}
            <Link href={`/u/${m.host.handle}`} className="hover:underline">
              {m.host.displayName}
            </Link>
          </p>

          <p className="mt-4 whitespace-pre-wrap text-white/80">{m.description}</p>

          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <Info label="📍 City" value={m.venue ? `${m.city} · ${m.venue}` : m.city} />
            <Info label="🗓️ When" value={m.startsAt.toLocaleString()} />
            <Info label="🎟️ Fee" value={m.feeCents === 0 ? "Free" : formatMoney(m.feeCents, m.currency)} />
            <Info label="👥 Spots" value={`${m.spotsLeft} of ${m.capacity} left`} />
          </dl>

          <div className="mt-6">
            {booked && (
              <p className="mb-3 rounded-lg bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300">
                You're booked! 🎉 See you there.
              </p>
            )}
            {error && <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

            {isHost ? (
              <p className="text-sm text-white/40">This is your meetup.</p>
            ) : alreadyBooked ? (
              <p className="rounded-lg bg-emerald-400/10 px-4 py-2 text-center font-semibold text-emerald-300">
                Booked ✓
              </p>
            ) : past ? (
              <p className="text-sm text-white/40">This meetup has already happened.</p>
            ) : soldOut ? (
              <p className="text-sm text-white/40">Sold out.</p>
            ) : (
              <form action={bookMeetupAction}>
                <input type="hidden" name="meetupId" value={m.id} />
                <button className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-3 font-semibold text-white">
                  {m.feeCents === 0 ? "Book free spot" : `Book · ${formatMoney(m.feeCents, m.currency)}`}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/[0.03] px-3 py-2">
      <dt className="text-xs text-white/40">{label}</dt>
      <dd className="text-white/90">{value}</dd>
    </div>
  );
}
