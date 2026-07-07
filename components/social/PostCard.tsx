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

export function PostCard({ post, likedByMe = false }: { post: PostCardData; likedByMe?: boolean }) {
  // Optimistic like: flip instantly on click, reconcile when the server revalidates.
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
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.05]">
      <header className="flex items-center gap-3">
        {post.author.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.author.avatarUrl}
            alt={`${post.author.displayName}'s avatar`}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white"
          >
            {post.author.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Link href={`/u/${post.author.handle}`} className="truncate font-semibold text-white hover:underline">
              {post.author.displayName}
            </Link>
            <span className="shrink-0 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-1.5 py-0.5 text-[10px] font-medium text-fuchsia-300">
              {post.author.rank}
            </span>
          </div>
          <div className="text-xs text-white/40">
            @{post.author.handle} · Lvl {post.author.level} ·{" "}
            <time dateTime={created.toISOString()} title={created.toLocaleString()} suppressHydrationWarning>
              {timeAgo(created)}
            </time>
          </div>
        </div>
      </header>

      {post.caption && <p className="mt-3 whitespace-pre-wrap text-white/90">{post.caption}</p>}
      {post.mediaUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.mediaUrl}
          alt=""
          loading="lazy"
          className="mt-3 max-h-96 w-full rounded-xl border border-white/10 object-cover"
        />
      )}

      <footer className="mt-3 flex items-center gap-4 text-sm">
        <form action={onLike}>
          <input type="hidden" name="postId" value={post.id} />
          <button
            type="submit"
            aria-pressed={like.liked}
            aria-label={like.liked ? "Unlike post" : "Like post"}
            className={`flex items-center gap-1.5 rounded-full px-1 py-0.5 transition active:scale-95 ${like.liked ? "text-fuchsia-400" : "text-white/50 hover:text-white"}`}
          >
            <span className="text-base leading-none">{like.liked ? "♥" : "♡"}</span>
            <span className="tabular-nums">{like.count}</span>
          </button>
        </form>
        <Link
          href={`/p/${post.id}`}
          aria-label={`${post.commentCount} comments`}
          className="flex items-center gap-1.5 rounded-full px-1 py-0.5 text-white/50 transition hover:text-white"
        >
          <span>💬</span>
          <span className="tabular-nums">{post.commentCount}</span>
        </Link>
      </footer>
    </article>
  );
}
