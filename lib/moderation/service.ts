import { prisma } from "@/lib/db/client";

const reporterSelect = { id: true, handle: true, displayName: true } as const;

export async function listPendingReports() {
  return prisma.report.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: { reporter: { select: reporterSelect } },
  });
}

export async function pendingReportCount(): Promise<number> {
  return prisma.report.count({ where: { status: "PENDING" } });
}

export interface TargetPreview {
  kind: "POST" | "COMMENT" | "USER" | "MISSING";
  label: string;
  authorHandle?: string;
  postId?: string;
}

/** Resolve human-readable previews for a batch of report targets. */
export async function resolveTargets(
  reports: { id: string; targetType: string; targetId: string }[],
): Promise<Record<string, TargetPreview>> {
  const out: Record<string, TargetPreview> = {};
  await Promise.all(
    reports.map(async (r) => {
      if (r.targetType === "POST") {
        const post = await prisma.post.findUnique({
          where: { id: r.targetId },
          include: { author: { select: { handle: true } } },
        });
        out[r.id] = post
          ? { kind: "POST", label: post.caption ?? "(media post)", authorHandle: post.author.handle, postId: post.id }
          : { kind: "MISSING", label: "post already removed" };
      } else if (r.targetType === "USER") {
        const user = await prisma.user.findUnique({ where: { id: r.targetId }, select: { handle: true, displayName: true } });
        out[r.id] = user
          ? { kind: "USER", label: user.displayName, authorHandle: user.handle }
          : { kind: "MISSING", label: "user not found" };
      } else {
        const comment = await prisma.comment.findUnique({
          where: { id: r.targetId },
          include: { author: { select: { handle: true } } },
        });
        out[r.id] = comment
          ? { kind: "COMMENT", label: comment.body, authorHandle: comment.author.handle, postId: comment.postId }
          : { kind: "MISSING", label: "comment already removed" };
      }
    }),
  );
  return out;
}

/** Dismiss a report with no action taken. */
export async function dismissReport(actorId: string, reportId: string) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report || report.status !== "PENDING") return;
  await prisma.$transaction([
    prisma.report.update({
      where: { id: reportId },
      data: { status: "DISMISSED", reviewedById: actorId, reviewedAt: new Date() },
    }),
    prisma.moderationAction.create({
      data: { actorId, action: "DISMISS_REPORT", targetType: report.targetType, targetId: report.targetId },
    }),
  ]);
}

/** Remove the reported post and resolve every pending report against it. */
export async function removeReportedPost(actorId: string, reportId: string) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report || report.targetType !== "POST") return;
  const postId = report.targetId;

  await prisma.$transaction([
    prisma.post.deleteMany({ where: { id: postId } }),
    prisma.report.updateMany({
      where: { targetType: "POST", targetId: postId, status: "PENDING" },
      data: { status: "ACTIONED", reviewedById: actorId, reviewedAt: new Date() },
    }),
    prisma.moderationAction.create({
      data: { actorId, action: "REMOVE_POST", targetType: "POST", targetId: postId },
    }),
  ]);
}

/** Suspend the reported user and resolve every pending report against them. */
export async function suspendReportedUser(actorId: string, reportId: string) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report || report.targetType !== "USER") return;
  const userId = report.targetId;

  await prisma.$transaction([
    prisma.user.updateMany({ where: { id: userId }, data: { status: "SUSPENDED" } }),
    prisma.report.updateMany({
      where: { targetType: "USER", targetId: userId, status: "PENDING" },
      data: { status: "ACTIONED", reviewedById: actorId, reviewedAt: new Date() },
    }),
    prisma.moderationAction.create({
      data: { actorId, action: "SUSPEND_USER", targetType: "USER", targetId: userId },
    }),
  ]);
}
