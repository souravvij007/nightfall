import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getPost } from "@/lib/social/posts";
import { AppNav } from "@/components/AppNav";
import { PostCard } from "@/components/social/PostCard";
import { addCommentAction, reportContentAction } from "./actions";

export default async function PostPage({ params }: { params: Promise<{ postId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { postId } = await params;
  const post = await getPost(postId, user.id);
  if (!post) notFound();

  return (
    <div className="flex flex-1 flex-col items-center bg-[#0a0a12] px-6 py-8 text-white">
      <div className="w-full max-w-xl">
        <AppNav />
        <Link href="/feed" className="mb-4 inline-block text-sm text-white/40 hover:text-white">
          ← Back to feed
        </Link>

        <PostCard post={post} likedByMe={post.likedByMe} />

        {/* Comments */}
        <div className="mt-6">
          <h2 className="mb-3 text-sm uppercase tracking-widest text-white/40">
            Comments · {post.commentCount}
          </h2>

          <form action={addCommentAction} className="mb-4 flex gap-2">
            <input type="hidden" name="postId" value={post.id} />
            <input
              name="body"
              required
              maxLength={1000}
              placeholder="Add a comment…"
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-fuchsia-400"
            />
            <button className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20">
              Send
            </button>
          </form>

          <ul className="space-y-3">
            {post.comments.map((c) => (
              <li key={c.id} className="rounded-lg bg-white/[0.03] px-3 py-2">
                <div className="text-sm">
                  <Link href={`/u/${c.author.handle}`} className="font-semibold hover:underline">
                    {c.author.displayName}
                  </Link>{" "}
                  <span className="text-white/40">@{c.author.handle}</span>
                </div>
                <p className="text-white/80">{c.body}</p>
              </li>
            ))}
            {post.comments.length === 0 && (
              <li className="text-sm text-white/40">No comments yet — be the first.</li>
            )}
          </ul>
        </div>

        {/* Report */}
        <details className="mt-8 text-sm text-white/40">
          <summary className="cursor-pointer hover:text-white/70">Report this post</summary>
          <form action={reportContentAction} className="mt-3 flex flex-wrap items-center gap-2">
            <input type="hidden" name="targetType" value="POST" />
            <input type="hidden" name="targetId" value={post.id} />
            <input type="hidden" name="postId" value={post.id} />
            <select name="reason" className="rounded-lg border border-white/10 bg-[#14141c] px-3 py-2 text-white">
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
      </div>
    </div>
  );
}
