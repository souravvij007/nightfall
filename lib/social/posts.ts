import { prisma } from "@/lib/db/client";
import type { CreatePostInput } from "@/lib/validation/social";
import { feedAuthorIds } from "./graph";
import { blockedUserIds } from "./safety";

const authorSelect = {
  id: true,
  handle: true,
  displayName: true,
  avatarUrl: true,
  level: true,
  rank: true,
} as const;

export async function createPost(authorId: string, input: CreatePostInput) {
  return prisma.post.create({
    data: {
      authorId,
      type: input.type,
      caption: input.caption,
      mediaUrl: input.mediaUrl,
    },
  });
}

/** Home feed: posts from people the viewer follows (plus their own), excluding blocked users. */
export async function getFeed(viewerId: string, take = 50) {
  const [authorIds, blocked] = await Promise.all([
    feedAuthorIds(viewerId),
    blockedUserIds(viewerId),
  ]);
  const blockedSet = new Set(blocked);
  const visibleAuthors = authorIds.filter((id) => !blockedSet.has(id));

  const posts = await prisma.post.findMany({
    where: { authorId: { in: visibleAuthors } },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      author: { select: authorSelect },
      likes: { where: { userId: viewerId }, select: { userId: true } },
    },
  });

  return posts.map(({ likes, ...post }) => ({ ...post, likedByMe: likes.length > 0 }));
}

/** Single post with its comments. Returns null if blocked or missing. */
export async function getPost(postId: string, viewerId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: { select: authorSelect },
      likes: { where: { userId: viewerId }, select: { userId: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: authorSelect } },
      },
    },
  });
  if (!post) return null;

  const blocked = new Set(await blockedUserIds(viewerId));
  if (blocked.has(post.authorId)) return null;

  const { likes, ...rest } = post;
  return { ...rest, likedByMe: likes.length > 0 };
}

export async function getUserPosts(authorId: string, take = 50) {
  return prisma.post.findMany({
    where: { authorId },
    orderBy: { createdAt: "desc" },
    take,
    include: { author: { select: authorSelect } },
  });
}
