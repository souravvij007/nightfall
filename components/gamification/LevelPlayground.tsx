"use client";

import { useState } from "react";
import {
  progressForPoints,
  unlockedFeatures,
  FEATURE_UNLOCK_LEVEL,
  type Feature,
  type Rank,
} from "@/lib/gamification/levels";

const RANK_STYLES: Record<Rank, { ring: string; text: string; label: string }> = {
  BRONZE: { ring: "ring-amber-700/40", text: "text-amber-600", label: "Bronze" },
  SILVER: { ring: "ring-slate-400/40", text: "text-slate-300", label: "Silver" },
  GOLD: { ring: "ring-yellow-500/40", text: "text-yellow-400", label: "Gold" },
  PLATINUM: { ring: "ring-cyan-300/40", text: "text-cyan-300", label: "Platinum" },
  DIAMOND: { ring: "ring-indigo-400/50", text: "text-indigo-300", label: "Diamond" },
};

const FEATURE_LABELS: Record<Feature, string> = {
  HOST_AV_ROOM: "Host A/V Chat Rooms",
  HOST_MEETUP: "Host Stranger Meetups",
  HOST_TRIP: "Host Stranger Trips",
};

// Mirrors the real point rules — award events a host/user actually earns.
const AWARD_PRESETS: { label: string; amount: number }[] = [
  { label: "Win a room game", amount: 50 },
  { label: "Complete a task", amount: 20 },
  { label: "Attend a meetup", amount: 100 },
  { label: "Attend a trip", amount: 500 },
];

const MAX_POINTS = 25000;

export function LevelPlayground() {
  const [points, setPoints] = useState(0);
  const p = progressForPoints(points);
  const unlocked = new Set(unlockedFeatures(p.level));
  const rank = RANK_STYLES[p.rank];

  const add = (n: number) => setPoints((v) => Math.min(MAX_POINTS, v + n));

  return (
    <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur sm:p-8">
      {/* Level + rank headline */}
      <div className="flex items-center justify-between gap-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-white/40">Level</div>
          <div className="flex items-end gap-3">
            <span className="text-6xl font-bold leading-none tabular-nums">{p.level}</span>
            <span
              className={`mb-1 rounded-full px-3 py-1 text-sm font-semibold ring-1 ${rank.ring} ${rank.text}`}
            >
              {rank.label}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-widest text-white/40">Points</div>
          <div className="text-3xl font-semibold tabular-nums">{p.points.toLocaleString()}</div>
        </div>
      </div>

      {/* Progress to next level */}
      <div className="mt-6">
        <div className="mb-2 flex justify-between text-xs text-white/50">
          <span>Level {p.level}</span>
          <span>
            {p.pointsToNextLevel > 0
              ? `${p.pointsToNextLevel.toLocaleString()} pts to level ${p.level + 1}`
              : "Max modeled level"}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-400 transition-all duration-300"
            style={{ width: `${Math.round(p.progress * 100)}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8">
        <input
          type="range"
          min={0}
          max={MAX_POINTS}
          value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
          className="w-full accent-fuchsia-400"
          aria-label="Points"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {AWARD_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => add(preset.amount)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 transition hover:border-white/25 hover:bg-white/10"
            >
              {preset.label}
              <span className="ml-1.5 text-fuchsia-300">+{preset.amount}</span>
            </button>
          ))}
          <button
            onClick={() => setPoints(0)}
            className="rounded-lg px-3 py-1.5 text-sm text-white/40 transition hover:text-white/70"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Feature unlocks */}
      <div className="mt-8 border-t border-white/10 pt-6">
        <div className="mb-3 text-xs uppercase tracking-widest text-white/40">
          Hosting privileges
        </div>
        <ul className="space-y-2">
          {(Object.keys(FEATURE_LABELS) as Feature[]).map((feature) => {
            const isUnlocked = unlocked.has(feature);
            const reqLevel = FEATURE_UNLOCK_LEVEL[feature];
            return (
              <li
                key={feature}
                className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                  isUnlocked ? "bg-emerald-400/10" : "bg-white/[0.02]"
                }`}
              >
                <span className={isUnlocked ? "text-white" : "text-white/40"}>
                  {FEATURE_LABELS[feature]}
                </span>
                <span
                  className={`text-sm font-medium ${
                    isUnlocked ? "text-emerald-300" : "text-white/40"
                  }`}
                >
                  {isUnlocked ? "Unlocked" : `Level ${reqLevel}`}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
