"use client";

import Link from "next/link";
import { useOptimistic } from "react";
import { toggleLikeAction } from "@/app/feed/actions";

export interface PostCardData {
  id: string;
  type: "TEXT" | "PHOTO" | "REEL";
  caption: string | null;
  mediaUrl: string | null;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  author: {
    handle: string;
    displayName: string;
    avatarUrl: string | null;
    level: number;
    rank: string;
  };
}

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/** Instagram-style post card: header, full-width media, actions, likes, caption. */
export function PostCard({ post, likedByMe = false }: { post: PostCardData; likedByMe?: boolean }) {
  const [like, toggleLike] = useOptimistic(
    { liked: likedByMe, count: post.likeCount },
    (s) => ({ liked: !s.liked, count: s.count + (s.liked ? -1 : 1) }),
  );

  async function onLike(formData: FormData) {
    toggleLike(undefined);
    await toggleLikeAction(formData);
  }

  const created = new Date(post.createdAt);

  return (
    <article className="overflow-hidden rounded-xl border border-line bg-surface">
      {/* Header */}
      <header className="flex items-center gap-2.5 px-3 py-2.5">
        <Link href={`/u/${post.author.handle}`} className="shrink-0">
          {post.author.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.author.avatarUrl}
              alt={`${post.author.displayName}'s avatar`}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-indigo to-brand-fuchsia text-sm font-bold text-white"
            >
              {post.author.displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </Link>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-1.5">
            <Link href={`/u/${post.author.handle}`} className="truncate text-sm font-semibold text-bright hover:underline">
              {post.author.displayName}
            </Link>
            <span className="shrink-0 rounded-full border border-brand-fuchsia/30 bg-brand-fuchsia/10 px-1.5 text-[10px] font-medium text-brand-fuchsia">
              {post.author.rank}
            </span>
          </div>
          <div className="truncate text-xs text-muted">@{post.author.handle}</div>
        </div>
        <time
          dateTime={created.toISOString()}
          title={created.toLocaleString()}
          suppressHydrationWarning
          className="shrink-0 text-xs text-muted"
        >
          {timeAgo(created)}
        </time>
      </header>

      {/* Media */}
      {post.mediaUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.mediaUrl}
          alt=""
          loading="lazy"
          className="max-h-[70vh] w-full bg-black object-cover"
        />
      )}

      {/* Text-only body */}
      {!post.mediaUrl && post.caption && (
        <p className="whitespace-pre-wrap px-3 py-2 text-[15px] text-foreground">{post.caption}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 px-3 pt-2.5 text-sm">
        <form action={onLike}>
          <input type="hidden" name="postId" value={post.id} />
          <button
            type="submit"
            aria-pressed={like.liked}
            aria-label={like.liked ? "Unlike post" : "Like post"}
            className={`flex items-center gap-1.5 transition active:scale-90 ${
              like.liked ? "text-brand-fuchsia" : "text-muted hover:text-bright"
            }`}
          >
            <span className="text-xl leading-none">{like.liked ? "♥" : "♡"}</span>
          </button>
        </form>
        <Link
          href={`/p/${post.id}`}
          aria-label={`${post.commentCount} comments`}
          className="flex items-center gap-1.5 text-muted transition hover:text-bright"
        >
          <span className="text-lg leading-none">💬</span>
        </Link>
      </div>

      {/* Likes */}
      <div className="px-3 pt-1.5 text-sm font-semibold text-bright">
        <span className="tabular-nums">{like.count}</span> {like.count === 1 ? "like" : "likes"}
      </div>

      {/* Caption (when there's media) */}
      {post.mediaUrl && post.caption && (
        <p className="px-3 pt-0.5 text-[15px] text-foreground">
          <Link href={`/u/${post.author.handle}`} className="mr-1.5 font-semibold text-bright hover:underline">
            {post.author.displayName}
          </Link>
          <span className="whitespace-pre-wrap">{post.caption}</span>
        </p>
      )}

      {/* Comments link */}
      <Link href={`/p/${post.id}`} className="block px-3 pb-3 pt-1 text-sm text-muted hover:text-bright">
        {post.commentCount === 0
          ? "Add a comment…"
          : `View ${post.commentCount === 1 ? "1 comment" : `all ${post.commentCount} comments`}`}
      </Link>
    </article>
  );
}
