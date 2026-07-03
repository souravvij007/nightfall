import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { progressForPoints, unlockedFeatures, FEATURE_UNLOCK_LEVEL, type Feature } from "@/lib/gamification/levels";
import { AppNav } from "@/components/AppNav";
import { claimDailyLoginAction, awardDemoAction, logoutAction } from "./actions";

const FEATURE_LABELS: Record<Feature, string> = {
  HOST_AV_ROOM: "Host A/V Chat Rooms",
  HOST_MEETUP: "Host Stranger Meetups",
  HOST_TRIP: "Host Stranger Trips",
};

const DEMO_AWARDS = [
  { reason: "ROOM_GAME_WIN", label: "Win a room game", pts: 50 },
  { reason: "MEETUP_ATTENDED", label: "Attend a meetup", pts: 100 },
  { reason: "TRIP_ATTENDED", label: "Attend a trip", pts: 500 },
] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function MePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const lastDaily = await prisma.pointEntry.findFirst({
    where: { userId: user.id, reason: "DAILY_LOGIN" },
    orderBy: { createdAt: "desc" },
  });
  const canClaimDaily = !lastDaily || Date.now() - lastDaily.createdAt.getTime() >= DAY_MS;

  const p = progressForPoints(user.pointsBalance);
  const unlocked = new Set(unlockedFeatures(p.level));

  return (
    <div className="flex flex-1 flex-col items-center bg-[#0a0a12] px-6 py-12 text-white">
      <div className="w-full max-w-xl">
        <AppNav active="me" />
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{user.displayName}</h1>
            <p className="text-white/50">@{user.handle}</p>
          </div>
          <form action={logoutAction}>
            <button className="text-sm text-white/40 transition hover:text-white/70">Log out</button>
          </form>
        </div>
        {user.bio && <p className="mt-3 text-white/70">{user.bio}</p>}

        {/* Level card */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-white/40">Level</div>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-bold tabular-nums">{p.level}</span>
                <span className="mb-1 rounded-full px-3 py-1 text-sm font-semibold text-fuchsia-300 ring-1 ring-fuchsia-400/40">
                  {p.rank}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest text-white/40">Points</div>
              <div className="text-2xl font-semibold tabular-nums">{p.points.toLocaleString()}</div>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex justify-between text-xs text-white/50">
              <span>Level {p.level}</span>
              <span>
                {p.pointsToNextLevel > 0
                  ? `${p.pointsToNextLevel.toLocaleString()} pts to level ${p.level + 1}`
                  : "Max level"}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-400"
                style={{ width: `${Math.round(p.progress * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Earn points (persisted) */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-3 text-xs uppercase tracking-widest text-white/40">Earn points</div>
          <form action={claimDailyLoginAction}>
            <button
              disabled={!canClaimDaily}
              className="w-full rounded-lg bg-emerald-500/15 px-4 py-2.5 text-emerald-300 transition hover:bg-emerald-500/25 disabled:opacity-40"
            >
              {canClaimDaily ? "Claim daily login +5" : "Daily login claimed ✓"}
            </button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {DEMO_AWARDS.map((a) => (
              <form key={a.reason} action={awardDemoAction}>
                <input type="hidden" name="reason" value={a.reason} />
                <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 transition hover:border-white/25 hover:bg-white/10">
                  {a.label} <span className="text-fuchsia-300">+{a.pts}</span>
                </button>
              </form>
            ))}
          </div>
          <p className="mt-3 text-xs text-white/30">These persist to the database — reload and your points remain.</p>
        </div>

        {/* Hosting privileges */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-3 text-xs uppercase tracking-widest text-white/40">Hosting privileges</div>
          <ul className="space-y-2">
            {(Object.keys(FEATURE_LABELS) as Feature[]).map((feature) => {
              const isUnlocked = unlocked.has(feature);
              return (
                <li
                  key={feature}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 ${isUnlocked ? "bg-emerald-400/10" : "bg-white/[0.02]"}`}
                >
                  <span className={isUnlocked ? "text-white" : "text-white/40"}>{FEATURE_LABELS[feature]}</span>
                  <span className={`text-sm font-medium ${isUnlocked ? "text-emerald-300" : "text-white/40"}`}>
                    {isUnlocked ? "Unlocked" : `Level ${FEATURE_UNLOCK_LEVEL[feature]}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
