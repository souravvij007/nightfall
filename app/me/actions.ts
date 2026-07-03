"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { getCurrentUser, destroySession } from "@/lib/auth/session";
import { awardPoints } from "@/lib/gamification/award";
import { PointReason } from "@/lib/generated/prisma/enums";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Award the daily-login bonus, at most once per 24h. */
export async function claimDailyLoginAction() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const last = await prisma.pointEntry.findFirst({
    where: { userId: user.id, reason: "DAILY_LOGIN" },
    orderBy: { createdAt: "desc" },
  });
  const claimable = !last || Date.now() - last.createdAt.getTime() >= DAY_MS;
  if (claimable) {
    await awardPoints({ userId: user.id, reason: "DAILY_LOGIN" });
    revalidatePath("/me");
  }
}

// Demo-only awards so you can watch level/rank change with real persistence.
const DEMO_REASONS = new Set<PointReason>(["ROOM_GAME_WIN", "MEETUP_ATTENDED", "TRIP_ATTENDED"]);

export async function awardDemoAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const reason = formData.get("reason") as PointReason;
  if (!DEMO_REASONS.has(reason)) return;

  await awardPoints({ userId: user.id, reason, sourceType: "demo" });
  revalidatePath("/me");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
