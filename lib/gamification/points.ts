import { PointReason } from "@/lib/generated/prisma/enums";

/**
 * Default point values and award bounds. Automated awards (login, engagement) use the
 * defaults; host/admin-driven awards (room games, corrections) pass an explicit amount
 * that is clamped to the reason's [min, max] range by `clampAward`.
 */

interface ReasonConfig {
  /** Default amount when the caller doesn't specify one. */
  default: number;
  /** Inclusive lower/upper bounds a caller-supplied amount is clamped to. */
  min: number;
  max: number;
  /** Whether a human (host/admin) may set a custom amount for this reason. */
  hostConfigurable: boolean;
}

export const POINT_RULES: Record<PointReason, ReasonConfig> = {
  ROOM_GAME_WIN: { default: 50, min: 1, max: 500, hostConfigurable: true },
  ROOM_TASK_COMPLETE: { default: 20, min: 1, max: 200, hostConfigurable: true },
  MEETUP_ATTENDED: { default: 100, min: 0, max: 100, hostConfigurable: false },
  TRIP_ATTENDED: { default: 500, min: 0, max: 500, hostConfigurable: false },
  CONTENT_ENGAGEMENT: { default: 2, min: 0, max: 50, hostConfigurable: false },
  DAILY_LOGIN: { default: 5, min: 0, max: 5, hostConfigurable: false },
  REFERRAL: { default: 100, min: 0, max: 100, hostConfigurable: false },
  // Admin corrections may be negative.
  ADMIN_ADJUSTMENT: { default: 0, min: -100000, max: 100000, hostConfigurable: true },
};

/** Resolve the amount for an award: use the caller's value (clamped) or the default. */
export function resolveAward(reason: PointReason, amount?: number): number {
  const rule = POINT_RULES[reason];
  if (amount === undefined) return rule.default;
  return clampAward(reason, amount);
}

/** Clamp an amount into the reason's allowed range. */
export function clampAward(reason: PointReason, amount: number): number {
  const rule = POINT_RULES[reason];
  return Math.max(rule.min, Math.min(rule.max, Math.trunc(amount)));
}
