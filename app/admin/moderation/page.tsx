import Link from "next/link";
import { listPendingReports, resolveTargets } from "@/lib/moderation/service";
import { dismissReportAction, removePostAction, suspendUserAction } from "../actions";

const REASON_LABEL: Record<string, string> = {
  SPAM: "Spam",
  HARASSMENT: "Harassment",
  NUDITY: "Nudity",
  HATE: "Hate",
  OTHER: "Other",
};

export default async function ModerationPage() {
  const reports = await listPendingReports();
  const targets = await resolveTargets(reports);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold">Moderation queue</h1>
      <p className="mt-1 text-white/50">{reports.length} pending report{reports.length === 1 ? "" : "s"}</p>

      <div className="mt-6 space-y-4">
        {reports.length === 0 && (
          <p className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-white/40">
            Nothing to review. The queue is clear. ✨
          </p>
        )}

        {reports.map((r) => {
          const t = targets[r.id];
          return (
            <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded bg-white/10 px-2 py-0.5 font-semibold">{r.targetType}</span>
                <span className="rounded bg-red-500/15 px-2 py-0.5 text-red-300">{REASON_LABEL[r.reason]}</span>
                <span className="text-white/40">
                  reported by @{r.reporter.handle} · {r.createdAt.toLocaleString()}
                </span>
              </div>

              <div className="mt-3 rounded-lg bg-black/30 p-3">
                {t?.kind === "MISSING" ? (
                  <span className="text-white/40 italic">{t.label}</span>
                ) : (
                  <>
                    <p className="text-white/90">“{t?.label}”</p>
                    {t?.authorHandle && (
                      <p className="mt-1 text-xs text-white/40">
                        by{" "}
                        <Link href={`/u/${t.authorHandle}`} className="hover:underline">
                          @{t.authorHandle}
                        </Link>
                        {t.postId && (
                          <>
                            {" · "}
                            <Link href={`/p/${t.postId}`} className="hover:underline">
                              view post
                            </Link>
                          </>
                        )}
                      </p>
                    )}
                  </>
                )}
              </div>
              {r.detail && <p className="mt-2 text-sm text-white/50">Note: {r.detail}</p>}

              <div className="mt-4 flex flex-wrap gap-2">
                <form action={dismissReportAction}>
                  <input type="hidden" name="reportId" value={r.id} />
                  <button className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:bg-white/5">
                    Dismiss
                  </button>
                </form>
                {r.targetType === "POST" && t?.kind !== "MISSING" && (
                  <form action={removePostAction}>
                    <input type="hidden" name="reportId" value={r.id} />
                    <button className="rounded-lg bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/25">
                      Remove post
                    </button>
                  </form>
                )}
                {r.targetType === "USER" && t?.kind !== "MISSING" && (
                  <form action={suspendUserAction}>
                    <input type="hidden" name="reportId" value={r.id} />
                    <button className="rounded-lg bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/25">
                      Suspend user
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
