import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getPost } from "@/lib/social/posts";
import { HomePane } from "@/components/shell/HomePane";
import { PostCard } from "@/components/social/PostCard";
import { addCommentAction, reportContentAction } from "./actions";

export default async function PostPage({ params }: { params: Promise<{ postId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { postId } = await params;
  const post = await getPost(postId, user.id);
  if (!post) notFound();

  return (
    <HomePane active="feed" icon="💬" title="Post">
      <Link href="/feed" className="mb-4 inline-block text-sm text-muted hover:text-bright">
        ← Back to feed
      </Link>

      <PostCard post={post} likedByMe={post.likedByMe} />

      {/* Comments */}
      <div className="mt-6 text-white">
        <h2 className="mb-3 text-sm uppercase tracking-widest text-muted">
          Comments · {post.commentCount}
        </h2>

        <form action={addCommentAction} className="mb-4 flex gap-2">
          <input type="hidden" name="postId" value={post.id} />
          <input
            name="body"
            required
            maxLength={1000}
            placeholder="Add a comment…"
            className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-bright placeholder-muted outline-none focus:border-brand-fuchsia"
          />
          <button className="rounded-lg bg-hover px-4 py-2 text-sm font-semibold text-bright transition hover:bg-active">
            Send
          </button>
        </form>

        <ul className="space-y-3">
          {post.comments.map((c) => (
            <li key={c.id} className="rounded-lg bg-surface px-3 py-2">
              <div className="text-sm">
                <Link href={`/u/${c.author.handle}`} className="font-semibold text-bright hover:underline">
                  {c.author.displayName}
                </Link>{" "}
                <span className="text-muted">@{c.author.handle}</span>
              </div>
              <p className="text-white/80">{c.body}</p>
            </li>
          ))}
          {post.comments.length === 0 && (
            <li className="text-sm text-muted">No comments yet — be the first.</li>
          )}
        </ul>
      </div>

      {/* Report */}
      <details className="mt-8 text-sm text-muted">
        <summary className="cursor-pointer hover:text-bright">Report this post</summary>
        <form action={reportContentAction} className="mt-3 flex flex-wrap items-center gap-2">
          <input type="hidden" name="targetType" value="POST" />
          <input type="hidden" name="targetId" value={post.id} />
          <input type="hidden" name="postId" value={post.id} />
          <select name="reason" className="rounded-lg border border-line bg-bg px-3 py-2 text-bright">
            <option value="SPAM">Spam</option>
            <option value="HARASSMENT">Harassment</option>
            <option value="NUDITY">Nudity</option>
            <option value="HATE">Hate</option>
            <option value="OTHER">Other</option>
          </select>
          <button className="rounded-lg bg-red-500/15 px-4 py-2 text-red-300 transition hover:bg-red-500/25">
            Submit report
          </button>
        </form>
      </details>
    </HomePane>
  );
}
