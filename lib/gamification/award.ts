import { prisma } from "@/lib/db/client";
import { PointReason } from "@/lib/generated/prisma/enums";
import { levelForPoints, rankForLevel } from "./levels";
import { resolveAward } from "./points";

export interface AwardPointsInput {
  userId: string;
  reason: PointReason;
  /** Optional explicit amount; clamped to the reason's bounds. Falls back to the default. */
  amount?: number;
  /** Provenance, e.g. { sourceType: "room", sourceId } for a room award. */
  sourceType?: string;
  sourceId?: string;
  /** Host/admin who granted it; omit for automated system awards. */
  awardedById?: string;
  note?: string;
  metadata?: Record<string, unknown>;
}

export interface AwardResult {
  entryId: string;
  amount: number;
  pointsBalance: number;
  level: number;
  leveledUp: boolean;
}

/**
 * Award points to a user. Appends an immutable PointEntry and recomputes the denormalized
 * balance/level/rank caches from the *ledger itself* — all inside one transaction, so the
 * cache can never drift from the source of truth. Returns whether the user leveled up.
 */
export async function awardPoints(input: AwardPointsInput): Promise<AwardResult> {
  const amount = resolveAward(input.reason, input.amount);

  return prisma.$transaction(async (tx) => {
    const before = await tx.user.findUniqueOrThrow({
      where: { id: input.userId },
      select: { level: true },
    });

    const entry = await tx.pointEntry.create({
      data: {
        userId: input.userId,
        amount,
        reason: input.reason,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        awardedById: input.awardedById,
        note: input.note,
        metadata: input.metadata as object | undefined,
      },
    });

    // Recompute balance from the full ledger — never trust an in-place increment.
    const agg = await tx.pointEntry.aggregate({
      where: { userId: input.userId },
      _sum: { amount: true },
    });
    const pointsBalance = agg._sum.amount ?? 0;
    const level = levelForPoints(pointsBalance);
    const rank = rankForLevel(level);

    await tx.user.update({
      where: { id: input.userId },
      data: { pointsBalance, level, rank },
    });

    return {
      entryId: entry.id,
      amount,
      pointsBalance,
      level,
      leveledUp: level > before.level,
    };
  });
}
