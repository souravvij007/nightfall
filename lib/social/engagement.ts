import { prisma } from "@/lib/db/client";
import { awardPoints } from "@/lib/gamification/award";

export interface ToggleLikeResult {
  liked: boolean;
  /** Set when a *new* like was added and the author isn't the liker (so we can reward engagement). */
  rewardAuthorId?: string;
}

/** Like/unlike a post, keeping the denormalized likeCount in sync. */
export async function toggleLike(userId: string, postId: string): Promise<ToggleLikeResult> {
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.like.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await tx.like.delete({ where: { postId_userId: { postId, userId } } });
      await tx.post.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } });
      return { liked: false } as ToggleLikeResult;
    }

    await tx.like.create({ data: { postId, userId } });
    const post = await tx.post.update({
      where: { id: postId },
      data: { likeCount: { increment: 1 } },
      select: { authorId: true },
    });
    return {
      liked: true,
      rewardAuthorId: post.authorId === userId ? undefined : post.authorId,
    } as ToggleLikeResult;
  });

  // Reward the author for the engagement (outside the like tx; awardPoints is transactional).
  if (result.rewardAuthorId) {
    await awardPoints({
      userId: result.rewardAuthorId,
      reason: "CONTENT_ENGAGEMENT",
      sourceType: "post",
      sourceId: postId,
      note: "Received a like",
    });
  }
  return result;
}

/** Add a comment, keeping the denormalized commentCount in sync. */
export async function addComment(userId: string, postId: string, body: string) {
  return prisma.$transaction(async (tx) => {
    const comment = await tx.comment.create({
      data: { postId, authorId: userId, body },
    });
    await tx.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } });
    return comment;
  });
}
