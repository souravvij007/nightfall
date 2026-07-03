/**
 * Nightfall level engine — pure, dependency-free, and the single source of truth for how
 * points map to levels, ranks, and feature unlocks. No DB access lives here so it can be
 * unit-tested in isolation and reused verbatim by the future React Native client.
 *
 * Progression curve (cumulative points required to *reach* level L):
 *
 *     threshold(L) = 50 * (L - 1) * L
 *
 *     L1: 0    L2: 100   L3: 300   L4: 600   L5: 1000
 *     L10: 4500          L20: 19000
 *
 * The curve is smooth and quadratic, so each level costs a bit more than the last.
 */

/** Rank tiers. MUST stay in sync with the `Rank` enum in prisma/schema.prisma. */
export const RANKS = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"] as const;
export type Rank = (typeof RANKS)[number];

/** Level-gated capabilities. */
export type Feature = "HOST_AV_ROOM" | "HOST_MEETUP" | "HOST_TRIP";

/** Minimum level required to unlock each feature (per docs/architecture.md §4). */
export const FEATURE_UNLOCK_LEVEL: Record<Feature, number> = {
  HOST_AV_ROOM: 5,
  HOST_MEETUP: 10,
  HOST_TRIP: 20,
};

/** Lowest level in each rank band. Ordered ascending. */
const RANK_MIN_LEVEL: Record<Rank, number> = {
  BRONZE: 1,
  SILVER: 5,
  GOLD: 10,
  PLATINUM: 20,
  DIAMOND: 50,
};

export const MIN_LEVEL = 1;

/** Cumulative points needed to reach a given level. Level 1 requires 0. */
export function thresholdForLevel(level: number): number {
  const l = Math.max(MIN_LEVEL, Math.floor(level));
  return 50 * (l - 1) * l;
}

/**
 * The level a user is at given their (non-negative) cumulative points balance.
 * Inverts threshold(L) = 50*(L-1)*L, then corrects for floating-point drift.
 */
export function levelForPoints(points: number): number {
  const p = Math.max(0, Math.floor(points));
  if (p < thresholdForLevel(MIN_LEVEL + 1)) return MIN_LEVEL;

  // Solve 50*(L-1)*L <= p  ->  L <= (1 + sqrt(1 + p/12.5)) / 2
  let level = Math.floor((1 + Math.sqrt(1 + p / 12.5)) / 2);
  // Correct rounding at the boundaries in both directions.
  while (thresholdForLevel(level + 1) <= p) level++;
  while (thresholdForLevel(level) > p) level--;
  return Math.max(MIN_LEVEL, level);
}

/** Rank tier for a level. */
export function rankForLevel(level: number): Rank {
  let rank: Rank = "BRONZE";
  for (const r of RANKS) {
    if (level >= RANK_MIN_LEVEL[r]) rank = r;
  }
  return rank;
}

/** Every feature unlocked at or below the given level. */
export function unlockedFeatures(level: number): Feature[] {
  return (Object.keys(FEATURE_UNLOCK_LEVEL) as Feature[]).filter(
    (f) => level >= FEATURE_UNLOCK_LEVEL[f],
  );
}

/** Server-side gate: may a user at `level` use `feature`? */
export function hasFeature(level: number, feature: Feature): boolean {
  return level >= FEATURE_UNLOCK_LEVEL[feature];
}

export interface LevelProgress {
  level: number;
  rank: Rank;
  points: number;
  /** Points accumulated within the current level. */
  pointsIntoLevel: number;
  /** Points spanning the current level (current threshold → next). */
  pointsForLevel: number;
  /** Points still needed to reach the next level. */
  pointsToNextLevel: number;
  /** 0..1 progress through the current level (1 at max modeled level). */
  progress: number;
}

/** Full derived progression state for a points balance — everything the UI needs. */
export function progressForPoints(points: number): LevelProgress {
  const p = Math.max(0, Math.floor(points));
  const level = levelForPoints(p);
  const current = thresholdForLevel(level);
  const next = thresholdForLevel(level + 1);
  const span = next - current;
  const into = p - current;
  return {
    level,
    rank: rankForLevel(level),
    points: p,
    pointsIntoLevel: into,
    pointsForLevel: span,
    pointsToNextLevel: Math.max(0, next - p),
    progress: span > 0 ? into / span : 1,
  };
}
