import Link from "next/link";
import { listPendingTrips } from "@/lib/trips/service";
import { formatMoney } from "@/lib/money";
import { vetVendorAction, approveTripAction, rejectTripAction } from "./actions";

const VET_STYLE: Record<string, string> = {
  PENDING: "text-amber-300",
  APPROVED: "text-emerald-300",
  REJECTED: "text-red-300",
};

export default async function AdminTripsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, trips] = await Promise.all([searchParams, listPendingTrips()]);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold">Trip approvals</h1>
      <p className="mt-1 text-white/50">{trips.length} awaiting review · vet every vendor before approving</p>
      {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      <div className="mt-6 space-y-4">
        {trips.length === 0 && (
          <p className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-white/40">
            No trips awaiting approval. ✨
          </p>
        )}

        {trips.map((t) => {
          const allVetted = t.vendors.every((v) => v.vetStatus === "APPROVED");
          return (
            <div key={t.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold">{t.title}</h2>
                  <p className="mt-1 text-xs text-white/40">
                    by <Link href={`/u/${t.host.handle}`} className="hover:underline">@{t.host.handle}</Link>{" "}
                    (Lvl {t.host.level}) · 🧭 {t.destination}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <div className="font-semibold">{t.priceCents === 0 ? "Free" : formatMoney(t.priceCents, t.currency)}</div>
                  <div className="text-xs text-white/40">cap {t.capacity}</div>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-white/70">{t.description}</p>

              {/* Vendor vetting */}
              <div className="mt-4 rounded-lg bg-black/30 p-3">
                <div className="mb-2 text-xs uppercase tracking-widest text-white/40">Vendors to vet</div>
                {t.vendors.length === 0 ? (
                  <p className="text-sm text-white/40">No third-party vendors listed.</p>
                ) : (
                  <ul className="space-y-2">
                    {t.vendors.map((v) => (
                      <li key={v.id} className="flex items-center justify-between">
                        <span className="text-sm">
                          <span className="text-white/50">{v.kind}</span> · {v.name}
                          {v.contact && <span className="text-white/40"> · {v.contact}</span>}
                          <span className={`ml-2 text-xs ${VET_STYLE[v.vetStatus]}`}>({v.vetStatus})</span>
                        </span>
                        <span className="flex gap-1">
                          <form action={vetVendorAction}>
                            <input type="hidden" name="vendorId" value={v.id} />
                            <input type="hidden" name="decision" value="approve" />
                            <button className="rounded bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/25">Vet ✓</button>
                          </form>
                          <form action={vetVendorAction}>
                            <input type="hidden" name="vendorId" value={v.id} />
                            <input type="hidden" name="decision" value="reject" />
                            <button className="rounded bg-red-500/15 px-2 py-1 text-xs text-red-300 hover:bg-red-500/25">✕</button>
                          </form>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <form action={approveTripAction}>
                  <input type="hidden" name="tripId" value={t.id} />
                  <button
                    disabled={!allVetted}
                    className="rounded-lg bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/25 disabled:opacity-40"
                  >
                    {allVetted ? "Approve trip" : "Vet vendors first"}
                  </button>
                </form>
                <form action={rejectTripAction} className="flex gap-2">
                  <input type="hidden" name="tripId" value={t.id} />
                  <input name="reason" placeholder="Reason (optional)" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none" />
                  <button className="rounded-lg bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/25">Reject</button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
