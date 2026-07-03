import { hostsWithUnpaidEarnings, listPayouts } from "@/lib/payouts/service";
import { formatMoney } from "@/lib/money";
import { createPayoutAction, approvePayoutAction } from "./actions";

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-400/15 text-amber-300",
  PAID: "bg-emerald-400/15 text-emerald-300",
  FAILED: "bg-red-400/15 text-red-300",
};

export default async function FinancePage() {
  const [hosts, payouts] = await Promise.all([hostsWithUnpaidEarnings(), listPayouts()]);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold">Finance</h1>
      <p className="mt-1 text-white/50">Host payouts against frozen 70/30 splits</p>

      {/* Pending earnings → create payout */}
      <section className="mt-6">
        <h2 className="mb-3 text-xs uppercase tracking-widest text-white/40">Unpaid host earnings</h2>
        <div className="space-y-2">
          {hosts.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center text-white/40">
              No unpaid earnings right now.
            </p>
          ) : (
            hosts.map(({ host, earnings }) => (
              <div key={host.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div>
                  <div className="font-semibold">{host.displayName}</div>
                  <div className="text-xs text-white/40">
                    @{host.handle} · gross {formatMoney(earnings.grossCents)} · Nightfall {formatMoney(earnings.platformShareCents)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-semibold text-emerald-300">{formatMoney(earnings.hostShareCents)}</div>
                    <div className="text-xs text-white/40">owed</div>
                  </div>
                  <form action={createPayoutAction}>
                    <input type="hidden" name="hostId" value={host.id} />
                    <button className="rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white">
                      Create payout
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Payout batches */}
      <section className="mt-8">
        <h2 className="mb-3 text-xs uppercase tracking-widest text-white/40">Payouts</h2>
        <div className="space-y-2">
          {payouts.length === 0 ? (
            <p className="text-sm text-white/40">No payouts yet.</p>
          ) : (
            payouts.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div>
                  <div className="font-semibold">{formatMoney(p.netCents, p.currency)} → {p.host.displayName}</div>
                  <div className="text-xs text-white/40">
                    gross {formatMoney(p.grossCents, p.currency)} · cut {formatMoney(p.platformCutCents, p.currency)} · {p.createdAt.toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                  {p.status === "PENDING" && (
                    <form action={approvePayoutAction}>
                      <input type="hidden" name="payoutId" value={p.id} />
                      <button className="rounded-lg bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/25">
                        Approve &amp; release
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
