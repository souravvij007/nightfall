import Link from "next/link";
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
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <header className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white">
          {post.author.displayName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <Link href={`/u/${post.author.handle}`} className="font-semibold text-white hover:underline">
            {post.author.displayName}
          </Link>
          <div className="text-xs text-white/40">
            @{post.author.handle} · Lvl {post.author.level} · {timeAgo(post.createdAt)}
          </div>
        </div>
      </header>

      {post.caption && <p className="mt-3 whitespace-pre-wrap text-white/90">{post.caption}</p>}
      {post.mediaUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.mediaUrl}
          alt=""
          className="mt-3 max-h-96 w-full rounded-xl border border-white/10 object-cover"
        />
      )}

      <footer className="mt-3 flex items-center gap-4 text-sm">
        <form action={toggleLikeAction}>
          <input type="hidden" name="postId" value={post.id} />
          <button
            className={`flex items-center gap-1.5 transition ${likedByMe ? "text-fuchsia-400" : "text-white/50 hover:text-white"}`}
          >
            <span>{likedByMe ? "♥" : "♡"}</span>
            <span className="tabular-nums">{post.likeCount}</span>
          </button>
        </form>
        <Link
          href={`/p/${post.id}`}
          className="flex items-center gap-1.5 text-white/50 transition hover:text-white"
        >
          <span>💬</span>
          <span className="tabular-nums">{post.commentCount}</span>
        </Link>
      </footer>
    </article>
  );
}
